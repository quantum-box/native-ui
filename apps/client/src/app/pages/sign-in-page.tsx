import { Badge, Button } from '@tachyon-sdk/native-ui'
import { ExternalLink, LogIn, ShieldCheck } from 'lucide-react'
import { Navigate } from 'react-router-dom'

import { useAuth } from '../../auth/auth-context'

export function SignInPage() {
	const { error, session, signIn, status } = useAuth()
	const authenticating = status === 'authenticating'

	if (session) return <Navigate replace to='/' />

	return (
		<main className='grid min-h-dvh place-items-center bg-background px-4 py-10'>
			<section className='w-full max-w-md border-border border bg-surface p-6 shadow-none sm:p-8'>
				<div className='flex items-center justify-between'>
					<div className='flex size-10 items-center justify-center bg-primary text-primary-foreground'>
						<ShieldCheck className='size-5' />
					</div>
					<Badge variant='neutral'>Cognito · PKCE</Badge>
				</div>

				<h1 className='mt-8 font-semibold text-2xl tracking-tight'>
					TACHYONにサインイン
				</h1>
				<p className='mt-2 text-muted-foreground text-sm'>
					システムブラウザのCognito Hosted UIで本人確認を行います。
				</p>

				{error ? (
					<div
						aria-live='polite'
						className='mt-5 border-destructive/30 border bg-destructive/5 p-3 text-destructive text-sm'
					>
						{error}
					</div>
				) : null}

				<div className='mt-6 grid gap-2'>
					<Button
						disabled={authenticating}
						onClick={() => void signIn('cognito')}
						variant='primary'
					>
						<LogIn />
						Cognitoで続行
					</Button>
					<Button
						disabled={authenticating}
						onClick={() => void signIn('google')}
						variant='secondary'
					>
						<ExternalLink />
						Googleで続行
					</Button>
				</div>

				<p className='mt-6 text-subtle-foreground text-xs leading-5'>
					Authorization Code + PKCEを使用します。client
					secretは使用せず、Webのtokenは永続化しません。
				</p>
			</section>
		</main>
	)
}
