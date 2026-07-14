import { getCurrent, onOpenUrl } from '@tauri-apps/plugin-deep-link'
import { openUrl } from '@tauri-apps/plugin-opener'

import { isNativeAuthCallback } from './auth-config'
import { CognitoAuthController } from './cognito-client'
import { createNativeAuthPersistence } from './auth-persistence'
import type { AuthAdapter, AuthProviderName } from './auth-types'

export class NativeAuthAdapter implements AuthAdapter {
	private readonly controller: CognitoAuthController
	private readonly handledCallbacks = new Set<string>()

	constructor(redirectUri: string, statePrefix: string) {
		this.controller = new CognitoAuthController(
			createNativeAuthPersistence(),
			redirectUri,
			statePrefix,
		)
	}

	completeSignIn(callbackUrl: string) {
		return this.controller.completeSignIn(callbackUrl)
	}

	async listenForCallbacks(handler: (callbackUrl: string) => void) {
		const handleUrls = (urls: string[]) => {
			for (const url of urls) {
				if (isNativeAuthCallback(url) && !this.handledCallbacks.has(url)) {
					this.handledCallbacks.add(url)
					handler(url)
				}
			}
		}

		const currentUrls = await getCurrent()
		if (currentUrls) handleUrls(currentUrls)
		return onOpenUrl(handleUrls)
	}

	restoreSession() {
		return this.controller.restoreSession()
	}

	signOut() {
		return this.controller.signOut()
	}

	async startSignIn(provider: AuthProviderName) {
		const url = await this.controller.createSignInUrl(provider)
		await openUrl(url)
	}
}
