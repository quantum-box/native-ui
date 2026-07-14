import { describe, expect, it } from 'vitest'

import type { AuthSession } from '../platform/auth/auth-adapter'
import { authorizationAdapter } from './authorization-adapter'

const session: AuthSession = {
	accessToken: 'in-memory-access-token',
	expiresAt: Date.now() + 60_000,
	idToken: 'in-memory-id-token',
	identity: {
		displayName: 'Test User',
		subject: 'user-1',
	},
}

describe('authorization boundary', () => {
	it('allows the authenticated bootstrap shell', async () => {
		await expect(
			authorizationAdapter.checkAccess(session, 'app:shell'),
		).resolves.toEqual({ decision: 'allow' })
	})

	it('returns a resource-level 403 for unconfigured tenant authorization', async () => {
		await expect(
			authorizationAdapter.checkAccess(session, 'tenant:administration'),
		).resolves.toMatchObject({ decision: 'deny', status: 403 })
	})
})
