import { exportJWK, generateKeyPair, SignJWT } from 'jose'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { cognitoAuthConfig } from './auth-config'
import { CognitoAuthController } from './cognito-client'
import type { AuthPersistence, PendingAuthorization } from './auth-types'

afterEach(() => vi.unstubAllGlobals())

describe('Cognito callback authentication boundary', () => {
	it('exchanges PKCE, validates identity tokens, and persists only refresh', async () => {
		const { privateKey, publicKey } = await generateKeyPair('RS256')
		const publicJwk = await exportJWK(publicKey)
		publicJwk.alg = 'RS256'
		publicJwk.kid = 'test-key'
		publicJwk.use = 'sig'

		const now = Math.floor(Date.now() / 1000)
		const pending: PendingAuthorization = {
			codeVerifier: 'test-code-verifier',
			createdAt: Date.now(),
			nonce: 'test-nonce',
			redirectUri: 'https://native-ui.txcloud.app/callback',
			state: 'web.test-state',
		}
		const idToken = await new SignJWT({
			email: 'user@example.com',
			nonce: pending.nonce,
			token_use: 'id',
		})
			.setProtectedHeader({ alg: 'RS256', kid: 'test-key' })
			.setAudience(cognitoAuthConfig.clientId)
			.setExpirationTime(now + 3600)
			.setIssuedAt(now)
			.setIssuer(cognitoAuthConfig.issuer)
			.setSubject('user-1')
			.sign(privateKey)
		const accessToken = await new SignJWT({
			client_id: cognitoAuthConfig.clientId,
			token_use: 'access',
		})
			.setProtectedHeader({ alg: 'RS256', kid: 'test-key' })
			.setExpirationTime(now + 3600)
			.setIssuedAt(now)
			.setIssuer(cognitoAuthConfig.issuer)
			.setSubject('user-1')
			.sign(privateKey)

		let pendingValue: PendingAuthorization | null = pending
		let refreshValue: string | null = null
		const persistence: AuthPersistence = {
			async clearPending() {
				pendingValue = null
			},
			async clearRefreshToken() {
				refreshValue = null
			},
			async getPending() {
				return pendingValue
			},
			async getRefreshToken() {
				return refreshValue
			},
			async savePending(value) {
				pendingValue = value
			},
			async saveRefreshToken(value) {
				refreshValue = value
			},
		}

		const fetchMock = vi.fn(
			async (input: string | URL | Request, init?: RequestInit) => {
				const url = input.toString()
				if (url === cognitoAuthConfig.jwksUri) {
					return Response.json({ keys: [publicJwk] })
				}
				if (url === cognitoAuthConfig.tokenEndpoint) {
					expect(init?.body).toBeInstanceOf(URLSearchParams)
					const body = init?.body as URLSearchParams
					expect(body.get('grant_type')).toBe('authorization_code')
					expect(body.get('code_verifier')).toBe(pending.codeVerifier)
					expect(body.has('client_secret')).toBe(false)
					return Response.json({
						access_token: accessToken,
						expires_in: 3600,
						id_token: idToken,
						refresh_token: 'native-secure-refresh-token',
						token_type: 'Bearer',
					})
				}
				throw new Error(`Unexpected request: ${url}`)
			},
		)
		vi.stubGlobal('fetch', fetchMock)

		const controller = new CognitoAuthController(
			persistence,
			pending.redirectUri,
			'web.',
		)
		const session = await controller.completeSignIn(
			`${pending.redirectUri}?code=authorization-code&state=${pending.state}`,
		)

		expect(session.identity).toMatchObject({
			email: 'user@example.com',
			subject: 'user-1',
		})
		expect(pendingValue).toBeNull()
		expect(refreshValue).toBe('native-secure-refresh-token')
	})
})
