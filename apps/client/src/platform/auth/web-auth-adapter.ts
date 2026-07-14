import { CognitoAuthController } from './cognito-client'
import { createWebAuthPersistence } from './auth-persistence'
import type { AuthAdapter, AuthProviderName } from './auth-types'

export class WebAuthAdapter implements AuthAdapter {
	private readonly controller: CognitoAuthController

	constructor(redirectUri: string, statePrefix: string) {
		this.controller = new CognitoAuthController(
			createWebAuthPersistence(),
			redirectUri,
			statePrefix,
		)
	}

	completeSignIn(callbackUrl: string) {
		return this.controller.completeSignIn(callbackUrl)
	}

	async listenForCallbacks() {
		return () => undefined
	}

	restoreSession() {
		return this.controller.restoreSession()
	}

	signOut() {
		return this.controller.signOut()
	}

	async startSignIn(provider: AuthProviderName) {
		const url = await this.controller.createSignInUrl(provider)
		window.location.assign(url)
	}
}
