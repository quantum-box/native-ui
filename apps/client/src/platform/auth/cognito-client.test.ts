import { describe, expect, it } from 'vitest'

import { cognitoAuthConfig } from './auth-config'
import { createAuthorizationRequest } from './cognito-client'

describe('Cognito authorization request', () => {
	it.each([
		['cognito', 'COGNITO'],
		['google', 'Google'],
	] as const)(
		'builds a %s Authorization Code + PKCE request',
		async (provider, idp) => {
			const request = await createAuthorizationRequest(
				provider,
				'https://native-ui.txcloud.app/callback',
				'web.',
			)
			const url = new URL(request.url)

			expect(`${url.origin}${url.pathname}`).toBe(
				cognitoAuthConfig.authorizationEndpoint,
			)
			expect(url.searchParams.get('client_id')).toBe(cognitoAuthConfig.clientId)
			expect(url.searchParams.get('response_type')).toBe('code')
			expect(url.searchParams.get('code_challenge_method')).toBe('S256')
			expect(url.searchParams.get('code_challenge')).toMatch(/^[\w-]{43}$/u)
			expect(url.searchParams.get('identity_provider')).toBe(idp)
			expect(url.searchParams.get('scope')).toBe(
				cognitoAuthConfig.scopes.join(' '),
			)
			expect(url.searchParams.has('client_secret')).toBe(false)
			expect(request.pending.codeVerifier.length).toBeGreaterThanOrEqual(43)
			expect(request.pending.state).toMatch(/^web\.[\w-]+$/u)
		},
	)
})
