import { platformAdapter } from '../adapter'
import { resolveAuthRuntimeConfig } from './auth-config'
import type { AuthAdapter } from './auth-types'
import { NativeAuthAdapter } from './native-auth-adapter'
import { WebAuthAdapter } from './web-auth-adapter'

export type {
	AuthAdapter,
	AuthIdentity,
	AuthProviderName,
	AuthSession,
} from './auth-types'

export function createAuthAdapter(
	target = platformAdapter.target,
	isDevelopment = import.meta.env.DEV,
): AuthAdapter {
	const runtime = resolveAuthRuntimeConfig(target, isDevelopment)
	return target === 'web'
		? new WebAuthAdapter(runtime.redirectUri, runtime.statePrefix)
		: new NativeAuthAdapter(runtime.redirectUri, runtime.statePrefix)
}

export const authAdapter = createAuthAdapter()
