import { AlertCircle, RefreshCw } from 'lucide-react'
import type * as React from 'react'

import { cn } from '../../lib/utils'
import { Button } from '../basics/button'

interface ChatErrorProps {
	/** 何が起きたか。例「AI の返事が途中で止まりました」。 */
	title?: React.ReactNode
	/** どうすればよいか。 */
	description?: React.ReactNode
	/** 渡すと「やり直す」のボタンが出る。 */
	onRetry?: () => void
	retryLabel?: string
	/** やり直している途中。 */
	retrying?: boolean
	/** 右に足す物（問い合わせのボタンなど）。 */
	children?: React.ReactNode
	className?: string
}

/** 会話の中の失敗の表示と、やり直しのボタン。 */
function ChatError({
	title = 'AI の返事を受け取れませんでした',
	description,
	onRetry,
	retryLabel = 'やり直す',
	retrying = false,
	children,
	className,
}: Readonly<ChatErrorProps>) {
	return (
		<div
			className={cn(
				'flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm',
				className,
			)}
			role='alert'
		>
			<AlertCircle
				aria-hidden
				className='mt-0.5 size-4 shrink-0 text-destructive'
			/>
			<div className='grid min-w-0 flex-1 gap-0.5'>
				<p className='font-medium text-destructive'>{title}</p>
				{description ? (
					<p className='text-muted-foreground text-xs'>{description}</p>
				) : null}
			</div>
			{onRetry || children ? (
				<div className='flex shrink-0 items-center gap-1'>
					{onRetry ? (
						<Button
							disabled={retrying}
							onClick={onRetry}
							size='sm'
							type='button'
						>
							<RefreshCw
								aria-hidden
								className={cn(retrying && 'motion-safe:animate-spin')}
							/>
							{retryLabel}
						</Button>
					) : null}
					{children}
				</div>
			) : null}
		</div>
	)
}

export { ChatError, type ChatErrorProps }
