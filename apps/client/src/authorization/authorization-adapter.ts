import type { AuthSession } from '../platform/auth/auth-adapter'

export type ProtectedResource = 'app:shell' | 'tenant:administration'

export type AuthorizationDecision =
	| Readonly<{ decision: 'allow' }>
	| Readonly<{ decision: 'deny'; reason: string; status: 403 }>

export interface AuthorizationAdapter {
	checkAccess: (
		session: AuthSession,
		resource: ProtectedResource,
	) => Promise<AuthorizationDecision>
}

/**
 * AuthZ boundary (§4-10). The Cognito callback never calls this adapter.
 *
 * PR2 grants access only to the unscoped bootstrap shell. Tenant membership,
 * RBAC, and per-app access will be resolved through a Tachyon API adapter here
 * in a later PR. Until then, tenant-scoped resources fail as resource-level
 * HTTP-equivalent 403 decisions, never as authentication failures.
 */
export const authorizationAdapter: AuthorizationAdapter = {
	async checkAccess(_session, resource) {
		if (resource === 'app:shell') return { decision: 'allow' }
		return {
			decision: 'deny',
			reason:
				'Tachyon tenant authorization is not configured for this resource',
			status: 403,
		}
	},
}
