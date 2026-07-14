import {
	BrowserRouter,
	HashRouter,
	Navigate,
	Route,
	Routes,
} from 'react-router-dom'

import { platformAdapter } from '../platform/adapter'
import { AuthProvider } from '../auth/auth-context'
import { AuthenticationGuard } from '../auth/authentication-guard'
import { AuthorizationGuard } from '../authorization/authorization-guard'
import { AppShell } from './app-shell'
import { AuthCallbackPage } from './pages/auth-callback-page'
import { HomePage } from './pages/home-page'
import { RoadmapPage } from './pages/roadmap-page'
import { SignInPage } from './pages/sign-in-page'

function AppRoutes() {
	return (
		<AuthProvider>
			<Routes>
				<Route element={<SignInPage />} path='sign-in' />
				<Route element={<AuthCallbackPage />} path='callback' />
				<Route element={<AuthenticationGuard />}>
					<Route element={<AuthorizationGuard resource='app:shell' />}>
						<Route element={<AppShell />}>
							<Route element={<HomePage />} index />
							<Route element={<RoadmapPage />} path='roadmap' />
						</Route>
					</Route>
				</Route>
				<Route element={<Navigate replace to='/' />} path='*' />
			</Routes>
		</AuthProvider>
	)
}

export function AppRouter() {
	const Router =
		platformAdapter.navigationMode === 'browser' ? BrowserRouter : HashRouter

	return (
		<Router>
			<AppRoutes />
		</Router>
	)
}
