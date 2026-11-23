'use client'

import { ArrowRight, Check, ShieldQuestion, X } from 'lucide-react'
import type * as React from 'react'

import { cn } from '../../lib/utils'
import { Button } from './button'

/*
 * AI が何かを変える前に「この操作をしてよいか」を人に聞く枠。
 * 変わる中身を並べ、承認・却下（と、必要なら「この会話では常に許可」）を選ぶ。
 * 選んだあとは、どちらに決めたかだけを静かに残す。
 */

/** 変わる中身 1 つ。 */
interface ApprovalChange {
	/** 何が変わるか。例「勘定科目」「取引先」。 */
	label: React.ReactNode
	/** 今の値。新しく作るときは渡さない。 */
	before?: React.ReactNode
	/** 変えたあとの値。消すときは渡さない。 */
	after?: React.ReactNode
}

type ApprovalStatus = 'pending' | 'approved' | 'rejected'

interface ApprovalRequestProps {
	/** 何をしてよいか。例「仕訳を 3 件作ります」。 */
	title: React.ReactNode
	/** 補足。理由やどこが変わるか。 */
	description?: React.ReactNode
	/** 変わる中身の一覧。 */
	changes?: ApprovalChange[]
	/** 変わる中身が多いとき、全部の件数（一覧は先頭だけ渡す）。 */
	totalChanges?: number
	status?: ApprovalStatus
	/** 承認を押したとき。 */
	onApprove?: () => void
	/** 却下を押したとき。 */
	onReject?: () => void
	/** 渡すと「この会話では常に許可」も出る。 */
	onApproveAlways?: () => void
	/** 送っている途中。ボタンが押せなくなる。 */
	busy?: boolean
	/** ボタンの言葉。 */
	approveLabel?: string
	rejectLabel?: string
	approveAlwaysLabel?: string
	/** 中に足す物（詳しく見るリンクなど）。 */
	children?: React.ReactNode
	className?: string
}

const DECIDED: Record<Exclude<ApprovalStatus, 'pending'>, string> = {
	approved: '承認しました',
	rejected: '却下しました',
}

/** 実行の前の確かめ。 */
function ApprovalRequest({
	title,
	description,
	changes = [],
	totalChanges,
	status = 'pending',
	onApprove,
	onReject,
	onApproveAlways,
	busy = false,
	approveLabel = '承認する',
	rejectLabel = '却下する',
	approveAlwaysLabel = 'この会話では常に許可',
	children,
	className,
}: Readonly<ApprovalRequestProps>) {
	const pending = status === 'pending'
	const rest = totalChanges !== undefined ? totalChanges - changes.length : 0
	return (
		<section
			aria-label='実行の前の確かめ'
			className={cn(
				'grid gap-3 rounded-lg border bg-background p-3 text-sm',
				pending
					? 'border-warning/60 shadow-sm'
					: 'border-border bg-surface text-muted-foreground',
				className,
			)}
		>
			<div className='flex items-start gap-2'>
				<span
					className={cn(
						'mt-0.5 grid size-5 shrink-0 place-items-center rounded-md',
						pending
							? 'bg-warning/15 text-warning'
							: status === 'approved'
								? 'bg-success/15 text-success'
								: 'bg-muted text-muted-foreground',
					)}
				>
					{pending ? (
						<ShieldQuestion aria-hidden className='size-3.5' />
					) : status === 'approved' ? (
						<Check aria-hidden className='size-3.5' />
					) : (
						<X aria-hidden className='size-3.5' />
					)}
				</span>
				<div className='grid min-w-0 gap-0.5'>
					<p className={cn('font-medium', pending && 'text-foreground')}>
						{title}
					</p>
					{description ? (
						<p className='text-muted-foreground text-xs'>{description}</p>
					) : null}
				</div>
			</div>
			{changes.length ? (
				<ul
					aria-label='変わる中身'
					className='grid gap-1 rounded-md border border-border bg-surface p-2 text-xs'
				>
					{changes.map((change, index) => (
						<li
							className='grid grid-cols-[minmax(5rem,auto)_1fr] items-baseline gap-2'
							key={index}
						>
							<span className='text-muted-foreground'>{change.label}</span>
							<span className='flex min-w-0 flex-wrap items-center gap-1'>
								{change.before !== undefined ? (
									<span className='text-muted-foreground line-through decoration-muted-foreground/60'>
										{change.before}
									</span>
								) : (
									<span className='rounded-sm bg-success/15 px-1 text-[10px] text-success'>
										新しく
									</span>
								)}
								{change.before !== undefined ? (
									<ArrowRight
										aria-label='から'
										className='size-3 shrink-0 text-muted-foreground'
									/>
								) : null}
								{change.after !== undefined ? (
									<span className='font-medium text-foreground'>
										{change.after}
									</span>
								) : (
									<span className='rounded-sm bg-destructive/15 px-1 text-[10px] text-destructive'>
										消す
									</span>
								)}
							</span>
						</li>
					))}
					{rest > 0 ? (
						<li className='text-muted-foreground'>ほか {rest} 件</li>
					) : null}
				</ul>
			) : null}
			{children}
			{pending ? (
				<div className='flex flex-wrap items-center gap-2'>
					<Button
						disabled={busy}
						onClick={onApprove}
						size='sm'
						type='button'
						variant='primary'
					>
						{approveLabel}
					</Button>
					{onApproveAlways ? (
						<Button
							disabled={busy}
							onClick={onApproveAlways}
							size='sm'
							type='button'
						>
							{approveAlwaysLabel}
						</Button>
					) : null}
					<Button
						disabled={busy}
						onClick={onReject}
						size='sm'
						type='button'
						variant='ghost'
					>
						{rejectLabel}
					</Button>
				</div>
			) : (
				<p aria-live='polite' className='text-xs'>
					{DECIDED[status]}
				</p>
			)}
		</section>
	)
}

export {
	type ApprovalChange,
	ApprovalRequest,
	type ApprovalRequestProps,
	type ApprovalStatus,
}
