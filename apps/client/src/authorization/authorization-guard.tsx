import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'

import { useAuth } from '../auth/auth-context'
import {
	authorizationAdapter,
	type AuthorizationDecision,
	type ProtectedResource,
} from './authorization-adapter'

export function AuthorizationGuard({
	resource,
}: { resource: ProtectedResource }) {
	const { session } = useAuth()
	const [decision, setDecision] = useState<AuthorizationDecision | null>(null)

	useEffect(() => {
		let active = true
		setDecision(null)
		if (session) {
			void authorizationAdapter.checkAccess(session, resource).then(result => {
				if (active) setDecision(result)
			})
		}
		return () => {
			active = false
		}
	}, [resource, session])

	if (!decision) {
		return (
			<div className='grid min-h-dvh place-items-center bg-background text-muted-foreground text-sm'>
				アクセス権を確認しています…
			</div>
		)
	}

	if (decision.decision === 'deny') {
		return (
			<main className='grid min-h-dvh place-items-center bg-background px-6'>
				<div className='max-w-md border-border border bg-surface p-6'>
					<div className='font-mono text-muted-foreground text-xs'>403</div>
					<h1 className='mt-2 font-semibold text-xl'>アクセス権がありません</h1>
					<p className='mt-2 text-muted-foreground text-sm'>
						{decision.reason}
					</p>
				</div>
			</main>
		)
	}

	return <Outlet />
}
