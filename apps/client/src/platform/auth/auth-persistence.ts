import { secureStorage } from 'tauri-plugin-secure-storage-api'

import type { AuthPersistence, PendingAuthorization } from './auth-types'

const WEB_PENDING_KEY = 'tachyon.native-ui.auth.pending'
const NATIVE_PENDING_KEY = 'pending-authorization'
const NATIVE_REFRESH_KEY = 'refresh-token'

let webRefreshToken: string | null = null

function parsePending(value: string | null): PendingAuthorization | null {
	if (!value) return null

	try {
		const parsed = JSON.parse(value) as Partial<PendingAuthorization>
		if (
			typeof parsed.codeVerifier !== 'string' ||
			typeof parsed.createdAt !== 'number' ||
			typeof parsed.nonce !== 'string' ||
			typeof parsed.redirectUri !== 'string' ||
			typeof parsed.state !== 'string'
		) {
			return null
		}
		return parsed as PendingAuthorization
	} catch {
		return null
	}
}

/**
 * Web tokens are never written to localStorage, sessionStorage, cookies, or
 * IndexedDB. Only the short-lived PKCE transaction survives the full-page
 * redirect in tab-scoped sessionStorage and is deleted before code exchange.
 */
export function createWebAuthPersistence(): AuthPersistence {
	return {
		async clearPending() {
			window.sessionStorage.removeItem(WEB_PENDING_KEY)
		},
		async clearRefreshToken() {
			webRefreshToken = null
		},
		async getPending() {
			return parsePending(window.sessionStorage.getItem(WEB_PENDING_KEY))
		},
		async getRefreshToken() {
			return webRefreshToken
		},
		async savePending(pending) {
			window.sessionStorage.setItem(WEB_PENDING_KEY, JSON.stringify(pending))
		},
		async saveRefreshToken(refreshToken) {
			webRefreshToken = refreshToken
		},
	}
}

let nativeStorageReady: Promise<void> | undefined

function prepareNativeStorage(): Promise<void> {
	nativeStorageReady ??= secureStorage.setKeyPrefix('one.tachy.nativeui.auth.')
	return nativeStorageReady
}

async function removeNativeValue(key: string): Promise<void> {
	await prepareNativeStorage()
	if (await secureStorage.getItem(key)) await secureStorage.removeItem(key)
}

/** Native values are delegated to OS keyring/Keychain/Android Keystore. */
export function createNativeAuthPersistence(): AuthPersistence {
	return {
		async clearPending() {
			await removeNativeValue(NATIVE_PENDING_KEY)
		},
		async clearRefreshToken() {
			await removeNativeValue(NATIVE_REFRESH_KEY)
		},
		async getPending() {
			await prepareNativeStorage()
			return parsePending(await secureStorage.getItem(NATIVE_PENDING_KEY))
		},
		async getRefreshToken() {
			await prepareNativeStorage()
			return secureStorage.getItem(NATIVE_REFRESH_KEY)
		},
		async savePending(pending) {
			await prepareNativeStorage()
			await secureStorage.setItem(NATIVE_PENDING_KEY, JSON.stringify(pending))
		},
		async saveRefreshToken(refreshToken) {
			await prepareNativeStorage()
			await secureStorage.setItem(NATIVE_REFRESH_KEY, refreshToken)
		},
	}
}
