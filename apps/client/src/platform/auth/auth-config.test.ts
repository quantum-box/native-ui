import { describe, expect, it } from 'vitest'

import {
	authRedirectUris,
	getDesktopDevelopmentDeepLink,
	isNativeAuthCallback,
	resolveAuthRuntimeConfig,
} from './auth-config'

describe('auth runtime config', () => {
	it('selects compile-time Web redirects', () => {
		expect(resolveAuthRuntimeConfig('web', true).redirectUri).toBe(
			authRedirectUris.development,
		)
		expect(resolveAuthRuntimeConfig('web', false).redirectUri).toBe(
			authRedirectUris.production,
		)
	})

	it('uses localhost for desktop development and a deep link for bundles', () => {
		expect(resolveAuthRuntimeConfig('desktop', true)).toEqual({
			redirectUri: authRedirectUris.development,
			statePrefix: 'native-desktop.',
		})
		expect(resolveAuthRuntimeConfig('desktop', false).redirectUri).toBe(
			authRedirectUris.native,
		)
		expect(resolveAuthRuntimeConfig('mobile', false).redirectUri).toBe(
			authRedirectUris.native,
		)
	})

	it('forwards only a desktop-development callback to the native scheme', () => {
		const callback =
			'http://localhost:1420/callback?code=code&state=native-desktop.random'
		expect(getDesktopDevelopmentDeepLink(callback)).toBe(
			'tachyon-native://auth/callback?code=code&state=native-desktop.random',
		)
		expect(
			getDesktopDevelopmentDeepLink(
				'http://localhost:1420/callback?code=code&state=web.random',
			),
		).toBeNull()
	})

	it('rejects callbacks outside the exact registered deep-link route', () => {
		expect(isNativeAuthCallback('tachyon-native://auth/callback?code=x')).toBe(
			true,
		)
		expect(isNativeAuthCallback('tachyon-native://attacker/callback')).toBe(
			false,
		)
		expect(isNativeAuthCallback('https://native-ui.txcloud.app/callback')).toBe(
			false,
		)
	})
})
