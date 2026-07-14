import { Badge } from '@tachyon-sdk/native-ui'
import { useEffect, useRef } from 'react'

import { useAuth } from '../../auth/auth-context'
import { getDesktopDevelopmentDeepLink } from '../../platform/auth/auth-config'

export function AuthCallbackPage() {
	const { completeSignIn, error, status } = useAuth()
	const started = useRef(false)

	useEffect(() => {
		if (started.current) return
		started.current = true

		const deepLink = getDesktopDevelopmentDeepLink(window.location.href)
		if (deepLink) {
			window.location.replace(deepLink)
			return
		}

		void completeSignIn(window.location.href)
	}, [completeSignIn])

	return (
		<main className='grid min-h-dvh place-items-center bg-background px-4'>
			<section className='w-full max-w-md border-border border bg-surface p-6'>
				<Badge variant={error ? 'destructive' : 'accent'}>
					{error ? 'Authentication error' : 'Identity verification'}
				</Badge>
				<h1 className='mt-4 font-semibold text-xl'>
					{error
						? 'サインインを完了できませんでした'
						: 'サインインを完了しています'}
				</h1>
				<p aria-live='polite' className='mt-2 text-muted-foreground text-sm'>
					{error ??
						(status === 'authenticating'
							? 'Cognitoの応答とtokenを検証しています…'
							: 'アプリケーションへ戻ります…')}
				</p>
			</section>
		</main>
	)
}
