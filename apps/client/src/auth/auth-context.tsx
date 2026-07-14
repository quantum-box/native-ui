import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
	type ReactNode,
} from 'react'
import { useNavigate } from 'react-router-dom'

import {
	authAdapter,
	type AuthProviderName,
	type AuthSession,
} from '../platform/auth/auth-adapter'

type AuthStatus =
	| 'authenticating'
	| 'initializing'
	| 'unauthenticated'
	| 'authenticated'

type AuthContextValue = Readonly<{
	completeSignIn: (callbackUrl: string) => Promise<void>
	error: string | null
	session: AuthSession | null
	signIn: (provider: AuthProviderName) => Promise<void>
	signOut: () => Promise<void>
	status: AuthStatus
}>

const AuthContext = createContext<AuthContextValue | null>(null)

function getErrorMessage(error: unknown): string {
	return error instanceof Error
		? error.message
		: 'Authentication could not be completed'
}

export function AuthProvider({ children }: { children: ReactNode }) {
	const navigate = useNavigate()
	const [session, setSession] = useState<AuthSession | null>(null)
	const [status, setStatus] = useState<AuthStatus>('initializing')
	const [error, setError] = useState<string | null>(null)

	const completeSignIn = useCallback(
		async (callbackUrl: string) => {
			setError(null)
			setStatus('authenticating')
			try {
				const nextSession = await authAdapter.completeSignIn(callbackUrl)
				setSession(nextSession)
				setStatus('authenticated')
				navigate('/', { replace: true })
			} catch (callbackError) {
				setSession(null)
				setError(getErrorMessage(callbackError))
				setStatus('unauthenticated')
			}
		},
		[navigate],
	)

	useEffect(() => {
		let active = true
		let stopListening: () => void = () => undefined

		async function initialize() {
			try {
				const restoredSession = await authAdapter.restoreSession()
				if (!active) return
				setSession(restoredSession)
				setStatus(restoredSession ? 'authenticated' : 'unauthenticated')

				const unlisten = await authAdapter.listenForCallbacks(callbackUrl => {
					if (active) void completeSignIn(callbackUrl)
				})
				if (!active) {
					unlisten()
					return
				}
				stopListening = unlisten
			} catch (initializationError) {
				if (!active) return
				setError(getErrorMessage(initializationError))
				setStatus('unauthenticated')
			}
		}

		void initialize()
		return () => {
			active = false
			stopListening()
		}
	}, [completeSignIn])

	useEffect(() => {
		if (!session) return

		let active = true
		let refreshTimer: ReturnType<typeof setTimeout> | undefined

		const refresh = async () => {
			try {
				const refreshedSession = await authAdapter.restoreSession()
				if (!active) return
				if (!refreshedSession) {
					setSession(null)
					setStatus('unauthenticated')
					return
				}
				setSession(refreshedSession)
			} catch (refreshError) {
				if (!active) return
				if (Date.now() >= session.expiresAt) {
					setSession(null)
					setError(getErrorMessage(refreshError))
					setStatus('unauthenticated')
					return
				}
				refreshTimer = setTimeout(() => void refresh(), 30_000)
			}
		}

		// Refresh one minute before access-token expiry. Web can do this only
		// while the current page keeps its in-memory refresh token alive.
		const delay = Math.max(0, session.expiresAt - Date.now() - 60_000)
		refreshTimer = setTimeout(() => void refresh(), delay)

		return () => {
			active = false
			if (refreshTimer) clearTimeout(refreshTimer)
		}
	}, [session])

	const signIn = useCallback(async (provider: AuthProviderName) => {
		setError(null)
		setStatus('authenticating')
		try {
			await authAdapter.startSignIn(provider)
			// Native returns after opening the system browser. Keep the sign-in
			// controls usable in case the user cancels outside the application.
			setStatus('unauthenticated')
		} catch (signInError) {
			setError(getErrorMessage(signInError))
			setStatus('unauthenticated')
		}
	}, [])

	const signOut = useCallback(async () => {
		await authAdapter.signOut()
		setSession(null)
		setError(null)
		setStatus('unauthenticated')
		navigate('/sign-in', { replace: true })
	}, [navigate])

	const value = useMemo(
		() => ({ completeSignIn, error, session, signIn, signOut, status }),
		[completeSignIn, error, session, signIn, signOut, status],
	)

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
	const context = useContext(AuthContext)
	if (!context) throw new Error('useAuth must be used within AuthProvider')
	return context
}
