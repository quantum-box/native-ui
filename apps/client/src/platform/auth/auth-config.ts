import type { RuntimeTarget } from '../adapter'

export const cognitoAuthConfig = Object.freeze({
	authorizationEndpoint: 'https://auth-pool.n1.tachy.one/oauth2/authorize',
	clientId: '2keb54tbqmrk1srd1603mqtspu',
	issuer:
		'https://cognito-idp.ap-northeast-1.amazonaws.com/ap-northeast-1_8Ga4bK5M4',
	jwksUri:
		'https://cognito-idp.ap-northeast-1.amazonaws.com/ap-northeast-1_8Ga4bK5M4/.well-known/jwks.json',
	revokeEndpoint: 'https://auth-pool.n1.tachy.one/oauth2/revoke',
	scopes: ['openid', 'email', 'profile', 'aws.cognito.signin.user.admin'],
	tokenEndpoint: 'https://auth-pool.n1.tachy.one/oauth2/token',
})

export const authRedirectUris = Object.freeze({
	development: 'http://localhost:1420/callback',
	native: 'tachyon-native://auth/callback',
	production: 'https://native-ui.txcloud.app/callback',
})

export type AuthRuntimeConfig = Readonly<{
	redirectUri: string
	statePrefix: string
}>

/**
 * Redirect selection is compiled into each Vite target. It never depends on a
 * runtime environment variable. The client id and endpoints above are public
 * OAuth metadata; this application has no client secret.
 */
export function resolveAuthRuntimeConfig(
	target: RuntimeTarget,
	isDevelopment: boolean,
): AuthRuntimeConfig {
	if (target === 'web') {
		return {
			redirectUri: isDevelopment
				? authRedirectUris.development
				: authRedirectUris.production,
			statePrefix: 'web.',
		}
	}

	if (target === 'desktop' && isDevelopment) {
		return {
			redirectUri: authRedirectUris.development,
			statePrefix: 'native-desktop.',
		}
	}

	return {
		redirectUri: authRedirectUris.native,
		statePrefix: 'native.',
	}
}

export function isNativeAuthCallback(callbackUrl: string): boolean {
	try {
		const url = new URL(callbackUrl)
		return (
			url.protocol === 'tachyon-native:' &&
			url.hostname === 'auth' &&
			url.pathname === '/callback'
		)
	} catch {
		return false
	}
}

/**
 * In desktop development Cognito must use the registered localhost callback.
 * The page forwards the authorization response to the running Tauri process;
 * regular Web development states remain in the browser.
 */
export function getDesktopDevelopmentDeepLink(
	callbackUrl: string,
): string | null {
	try {
		const url = new URL(callbackUrl)
		const state = url.searchParams.get('state')
		if (
			url.origin !== 'http://localhost:1420' ||
			url.pathname !== '/callback' ||
			!state?.startsWith('native-desktop.')
		) {
			return null
		}

		return `${authRedirectUris.native}${url.search}`
	} catch {
		return null
	}
}
