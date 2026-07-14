export type AuthProviderName = 'cognito' | 'google'

export type AuthIdentity = Readonly<{
	displayName: string
	email?: string
	emailVerified?: boolean
	subject: string
	username?: string
}>

/** Access and ID tokens are held only in this in-memory session object. */
export type AuthSession = Readonly<{
	accessToken: string
	expiresAt: number
	idToken: string
	identity: AuthIdentity
}>

export type PendingAuthorization = Readonly<{
	codeVerifier: string
	createdAt: number
	nonce: string
	redirectUri: string
	state: string
}>

export interface AuthPersistence {
	clearPending: () => Promise<void>
	clearRefreshToken: () => Promise<void>
	getPending: () => Promise<PendingAuthorization | null>
	getRefreshToken: () => Promise<string | null>
	savePending: (pending: PendingAuthorization) => Promise<void>
	saveRefreshToken: (refreshToken: string) => Promise<void>
}

export interface AuthAdapter {
	completeSignIn: (callbackUrl: string) => Promise<AuthSession>
	listenForCallbacks: (
		handler: (callbackUrl: string) => void,
	) => Promise<() => void>
	restoreSession: () => Promise<AuthSession | null>
	signOut: () => Promise<void>
	startSignIn: (provider: AuthProviderName) => Promise<void>
}
