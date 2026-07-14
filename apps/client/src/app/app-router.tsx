import {
	BrowserRouter,
	HashRouter,
	Navigate,
	Route,
	Routes,
} from 'react-router-dom'

import { platformAdapter } from '../platform/adapter'
import { AppShell } from './app-shell'
import { HomePage } from './pages/home-page'
import { RoadmapPage } from './pages/roadmap-page'

export function AppRouter() {
	const Router =
		platformAdapter.navigationMode === 'browser' ? BrowserRouter : HashRouter

	return (
		<Router>
			<Routes>
				<Route element={<AppShell />}>
					<Route element={<HomePage />} index />
					<Route element={<RoadmapPage />} path='roadmap' />
					<Route element={<Navigate replace to='/' />} path='*' />
				</Route>
			</Routes>
		</Router>
	)
}
