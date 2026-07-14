import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose'

import { createCodeChallenge, createRandomValue } from './auth-crypto'
import { authRedirectUris, cognitoAuthConfig } from './auth-config'
import type {
	AuthIdentity,
	AuthPersistence,
	AuthProviderName,
	AuthSession,
	PendingAuthorization,
} from './auth-types'

const PENDING_AUTHORIZATION_MAX_AGE_MS = 10 * 60 * 1000
const cognitoJwks = createRemoteJWKSet(new URL(cognitoAuthConfig.jwksUri))

type TokenResponse = Readonly<{
	access_token: string
	expires_in: number
	id_token: string
	refresh_token?: string
	token_type: string
}>

export class AuthCallbackError extends Error {
	constructor(
		message: string,
		readonly code: string,
	) {
		super(message)
		this.name = 'AuthCallbackError'
	}
}

class TokenEndpointError extends Error {
	constructor(
		message: string,
		readonly status: number,
	) {
		super(message)
		this.name = 'TokenEndpointError'
	}
}

function normalizeCallbackUri(value: string): string {
	const url = new URL(value)
	return `${url.protocol}//${url.host}${url.pathname}`
}

function readTokenResponse(value: unknown): TokenResponse {
	if (!value || typeof value !== 'object') {
		throw new Error('Cognito returned an invalid token response')
	}

	const response = value as Partial<TokenResponse>
	if (
		typeof response.access_token !== 'string' ||
		typeof response.expires_in !== 'number' ||
		typeof response.id_token !== 'string' ||
		response.token_type?.toLowerCase() !== 'bearer'
	) {
		throw new Error('Cognito returned an incomplete token response')
	}

	return response as TokenResponse
}

async function requestTokens(
	parameters: URLSearchParams,
): Promise<TokenResponse> {
	const response = await fetch(cognitoAuthConfig.tokenEndpoint, {
		body: parameters,
		headers: { 'content-type': 'application/x-www-form-urlencoded' },
		method: 'POST',
	})

	if (!response.ok) {
		let errorCode = `HTTP ${response.status}`
		try {
			const body = (await response.json()) as { error?: unknown }
			if (typeof body.error === 'string') errorCode = body.error
		} catch {
			// Do not surface or log response bodies from the token endpoint.
		}
		throw new TokenEndpointError(
			`Cognito token request failed (${errorCode})`,
			response.status,
		)
	}

	return readTokenResponse(await response.json())
}

function readIdentity(payload: JWTPayload): AuthIdentity {
	if (typeof payload.sub !== 'string') {
		throw new Error('Cognito ID token is missing its subject')
	}

	const email = typeof payload.email === 'string' ? payload.email : undefined
	const username =
		typeof payload['cognito:username'] === 'string'
			? payload['cognito:username']
			: undefined
	const name = typeof payload.name === 'string' ? payload.name : undefined

	return {
		displayName: name ?? email ?? username ?? payload.sub,
		email,
		emailVerified:
			typeof payload.email_verified === 'boolean'
				? payload.email_verified
				: undefined,
		subject: payload.sub,
		username,
	}
}

async function verifyIdentityToken(
	idToken: string,
	nonce?: string,
): Promise<AuthIdentity> {
	const { payload } = await jwtVerify(idToken, cognitoJwks, {
		algorithms: ['RS256'],
		audience: cognitoAuthConfig.clientId,
		issuer: cognitoAuthConfig.issuer,
	})

	if (payload.token_use !== 'id') {
		throw new Error('Cognito returned a token with the wrong use')
	}
	if (nonce && payload.nonce !== nonce) {
		throw new Error('Cognito ID token nonce validation failed')
	}

	return readIdentity(payload)
}

async function verifyAccessToken(accessToken: string): Promise<void> {
	const { payload } = await jwtVerify(accessToken, cognitoJwks, {
		algorithms: ['RS256'],
		issuer: cognitoAuthConfig.issuer,
	})

	if (
		payload.token_use !== 'access' ||
		payload.client_id !== cognitoAuthConfig.clientId
	) {
		throw new Error('Cognito access token validation failed')
	}
}

async function issueSession(
	tokens: TokenResponse,
	nonce?: string,
): Promise<AuthSession> {
	const [identity] = await Promise.all([
		verifyIdentityToken(tokens.id_token, nonce),
		verifyAccessToken(tokens.access_token),
	])

	return {
		accessToken: tokens.access_token,
		expiresAt: Date.now() + tokens.expires_in * 1000,
		idToken: tokens.id_token,
		identity,
	}
}

export type AuthorizationRequest = Readonly<{
	pending: PendingAuthorization
	url: string
}>

export async function createAuthorizationRequest(
	provider: AuthProviderName,
	redirectUri: string,
	statePrefix: string,
): Promise<AuthorizationRequest> {
	const codeVerifier = createRandomValue(64)
	const pending = {
		codeVerifier,
		createdAt: Date.now(),
		nonce: createRandomValue(),
		redirectUri,
		state: `${statePrefix}${createRandomValue()}`,
	} satisfies PendingAuthorization

	const url = new URL(cognitoAuthConfig.authorizationEndpoint)
	url.search = new URLSearchParams({
		client_id: cognitoAuthConfig.clientId,
		code_challenge: await createCodeChallenge(codeVerifier),
		code_challenge_method: 'S256',
		identity_provider: provider === 'google' ? 'Google' : 'COGNITO',
		nonce: pending.nonce,
		redirect_uri: redirectUri,
		response_type: 'code',
		scope: cognitoAuthConfig.scopes.join(' '),
		state: pending.state,
	}).toString()

	return { pending, url: url.toString() }
}

export class CognitoAuthController {
	constructor(
		private readonly persistence: AuthPersistence,
		private readonly redirectUri: string,
		private readonly statePrefix: string,
	) {}

	async createSignInUrl(provider: AuthProviderName): Promise<string> {
		const request = await createAuthorizationRequest(
			provider,
			this.redirectUri,
			this.statePrefix,
		)
		await this.persistence.savePending(request.pending)
		return request.url
	}

	/**
	 * AuthN boundary (§4-10): validate the OAuth response, verify Cognito
	 * identity tokens, and issue the local in-memory session. Tenant, RBAC, and
	 * application-access decisions deliberately do not run in this callback.
	 */
	async completeSignIn(callbackUrl: string): Promise<AuthSession> {
		const url = new URL(callbackUrl)
		const pending = await this.persistence.getPending()

		if (!pending) {
			throw new AuthCallbackError(
				'No pending sign-in transaction was found',
				'missing_transaction',
			)
		}

		const callbackUri = normalizeCallbackUri(callbackUrl)
		const requestedCallbackUri = normalizeCallbackUri(pending.redirectUri)
		const isDesktopDevelopmentForward =
			pending.state.startsWith('native-desktop.') &&
			requestedCallbackUri ===
				normalizeCallbackUri(authRedirectUris.development) &&
			callbackUri === normalizeCallbackUri(authRedirectUris.native)
		if (callbackUri !== requestedCallbackUri && !isDesktopDevelopmentForward) {
			throw new AuthCallbackError(
				'The callback URI does not match the sign-in request',
				'invalid_callback',
			)
		}
		if (Date.now() - pending.createdAt > PENDING_AUTHORIZATION_MAX_AGE_MS) {
			await this.persistence.clearPending()
			throw new AuthCallbackError(
				'The sign-in transaction expired',
				'expired_transaction',
			)
		}
		if (url.searchParams.get('state') !== pending.state) {
			throw new AuthCallbackError(
				'The callback state did not match',
				'invalid_state',
			)
		}

		// A matching state is single-use. Delete it before either an OAuth error
		// or a token exchange so replayed callbacks cannot reuse the verifier.
		await this.persistence.clearPending()

		const oauthError = url.searchParams.get('error')
		if (oauthError) {
			throw new AuthCallbackError(
				url.searchParams.get('error_description') ??
					'Cognito rejected the sign-in request',
				oauthError,
			)
		}

		const code = url.searchParams.get('code')
		if (!code) {
			throw new AuthCallbackError(
				'The callback did not include an authorization code',
				'missing_code',
			)
		}

		const tokens = await requestTokens(
			new URLSearchParams({
				client_id: cognitoAuthConfig.clientId,
				code,
				code_verifier: pending.codeVerifier,
				grant_type: 'authorization_code',
				redirect_uri: pending.redirectUri,
			}),
		)
		const session = await issueSession(tokens, pending.nonce)

		if (tokens.refresh_token) {
			await this.persistence.saveRefreshToken(tokens.refresh_token)
		}

		return session
	}

	async restoreSession(): Promise<AuthSession | null> {
		const refreshToken = await this.persistence.getRefreshToken()
		if (!refreshToken) return null

		try {
			const tokens = await requestTokens(
				new URLSearchParams({
					client_id: cognitoAuthConfig.clientId,
					grant_type: 'refresh_token',
					refresh_token: refreshToken,
				}),
			)
			const session = await issueSession(tokens)
			if (tokens.refresh_token) {
				await this.persistence.saveRefreshToken(tokens.refresh_token)
			}
			return session
		} catch (error) {
			if (error instanceof TokenEndpointError && error.status < 500) {
				await this.persistence.clearRefreshToken()
				return null
			}
			throw error
		}
	}

	async signOut(): Promise<void> {
		const refreshToken = await this.persistence.getRefreshToken()
		await this.persistence.clearPending()
		await this.persistence.clearRefreshToken()

		if (!refreshToken) return
		try {
			await fetch(cognitoAuthConfig.revokeEndpoint, {
				body: new URLSearchParams({
					client_id: cognitoAuthConfig.clientId,
					token: refreshToken,
				}),
				headers: { 'content-type': 'application/x-www-form-urlencoded' },
				method: 'POST',
			})
		} catch {
			// Local sign-out must complete even when revocation is temporarily offline.
		}
	}
}
