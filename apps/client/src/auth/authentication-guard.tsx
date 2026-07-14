import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { useAuth } from './auth-context'

export function AuthenticationGuard() {
	const { session, status } = useAuth()
	const location = useLocation()

	if (status === 'initializing') {
		return (
			<div
				aria-live='polite'
				className='grid min-h-dvh place-items-center bg-background text-muted-foreground text-sm'
			>
				セッションを確認しています…
			</div>
		)
	}

	if (!session) {
		return (
			<Navigate replace state={{ returnTo: location.pathname }} to='/sign-in' />
		)
	}

	return <Outlet />
}
