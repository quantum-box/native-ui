'use client'

import { Check, Sparkles } from 'lucide-react'
import * as React from 'react'

import { useHoverOpen } from '../../lib/use-hover-open'
import { cn } from '../../lib/utils'
import {
	type AiReasoning,
	AiReasoningDetails,
	hasReasoning,
	reasoningSentence,
} from './ai-reasoning'
import { Popover, PopoverContent, PopoverTrigger } from '../overlays/popover'

/*
 * AI が値を入れた入力欄を、入力欄そのものの見た目で分かるようにする包み。
 * `AiSuggestion` と同じ紫〜青のグラデーションの枠と薄い地を使う。
 * 入力欄の部品（Input・SelectTrigger・textarea など）は変えずに、外から包むだけで使える。
 *
 *   <AiField status='filled' onEdit={() => setStatus('edited')}>
 *     <Input value={value} onChange={...} />
 *   </AiField>
 */

type AiFieldStatus =
	/** AI が入れたまま。まだ人が見ていない。 */
	| 'filled'
	/** AI が入れている途中。 */
	| 'filling'
	/** AI が入れたが、確からしさが低い。人に確かめてほしい。 */
	| 'uncertain'
	/** AI が入れた値を、人が「これでよい」と確かめた。 */
	| 'confirmed'
	/** AI が入れた値を、人が直した。AI の見た目は消える。 */
	| 'edited'
	/** AI は関わっていない。普通の入力欄と同じ。 */
	| 'none'

interface AiFieldLabels {
	filled: string
	filling: string
	uncertain: string
	confirmed: string
	edited: string
	/** 確かめるボタンの読み上げ用の名前。 */
	confirm: string
}

/** 画面を読む道具に伝える文。 */
const DESCRIPTIONS: Record<Exclude<AiFieldStatus, 'none'>, string> = {
	filled: 'AI が入れた値です。正しいか確かめてください。',
	filling: 'AI が値を入れています。',
	uncertain: 'AI が入れた値です。確からしさが低いので、必ず確かめてください。',
	confirmed: 'AI が入れ、確かめ済みの値です。',
	edited: 'AI が入れた値を直しました。',
}

const DEFAULT_LABELS: AiFieldLabels = {
	filled: 'AI',
	filling: 'AI が入力中',
	uncertain: 'AI・要確認',
	confirmed: '確認済み',
	edited: '直した',
	confirm: 'AI が入れた値を確かめた',
}

interface AiFieldProps {
	status: AiFieldStatus
	/** 入力欄 1 つ。Input・SelectTrigger・textarea など。 */
	children: React.ReactElement
	/**
	 * 人が文字を打ったときに呼ばれる（input・textarea の入力で発火）。
	 * ここで status を `edited` にすると、AI の見た目が消える。
	 * 選択欄（Select）は `onValueChange` の中で同じことをする。
	 */
	onEdit?: () => void
	/** 渡すと、`filled`・`uncertain` のときに「確かめた」ボタンが出る。 */
	onConfirm?: () => void
	/** 印の文言を変えるとき。 */
	labels?: Partial<AiFieldLabels>
	/** `edited` のときに「直した」の印を出すか。既定は出す。 */
	showEditedMark?: boolean
	/**
	 * 理由や判断の材料。渡すと、右上の印に触れる・押すと中身が開き、
	 * 読み上げでも伝える（人が直した後は出さない）。
	 */
	reasoning?: AiReasoning
	className?: string
}

function AiField({
	status,
	children,
	onEdit,
	onConfirm,
	labels,
	showEditedMark = true,
	reasoning,
	className,
}: Readonly<AiFieldProps>) {
	const descriptionId = React.useId()
	const showReasoning =
		hasReasoning(reasoning) && status !== 'edited' && status !== 'none'
	const text = { ...DEFAULT_LABELS, ...labels }
	const ai =
		status === 'filled' || status === 'filling' || status === 'uncertain'
	const framed = ai || status === 'confirmed'
	const described = status !== 'none' && (status !== 'edited' || showEditedMark)

	const child = React.Children.only(children)
	const childProps = child.props as {
		className?: string
		'aria-describedby'?: string
	}
	const field = React.cloneElement(child, {
		className: cn(
			childProps.className,
			framed &&
				'border-transparent bg-transparent hover:bg-transparent focus-visible:border-transparent focus:border-transparent',
		),
		'aria-describedby':
			[childProps['aria-describedby'], described ? descriptionId : undefined]
				.filter(Boolean)
				.join(' ') || undefined,
		'aria-busy': status === 'filling' ? true : undefined,
		'data-ai-status': status,
	} as Record<string, unknown>)

	const mark = (() => {
		switch (status) {
			case 'filled':
			case 'filling':
				return (
					<span className='inline-flex items-center gap-0.5 rounded-full bg-gradient-to-r from-ai-1 via-ai-2 to-ai-3 px-1.5 text-white'>
						<Sparkles
							aria-hidden
							className={cn(
								'size-2.5',
								status === 'filling' && 'animate-pulse',
							)}
						/>
						{status === 'filled' ? text.filled : text.filling}
					</span>
				)
			case 'uncertain':
				return (
					<span className='inline-flex items-center gap-0.5 rounded-full bg-gradient-to-r from-amber-700 to-ai-2 px-1.5 text-white'>
						<Sparkles aria-hidden className='size-2.5' />
						{text.uncertain}
					</span>
				)
			case 'confirmed':
				return (
					<span className='inline-flex items-center gap-0.5 rounded-full border border-ai-border bg-background px-1.5 text-ai-foreground'>
						<Check aria-hidden className='size-2.5' />
						{text.confirmed}
					</span>
				)
			case 'edited':
				return showEditedMark ? (
					<span className='inline-flex items-center rounded-full border border-border bg-background px-1.5 text-muted-foreground'>
						{text.edited}
					</span>
				) : null
			default:
				return null
		}
	})()

	return (
		<div
			className={cn('relative w-full', className)}
			data-ai-status={status}
			onInput={onEdit}
		>
			<div
				className={cn(
					'rounded-[7px] p-px',
					(status === 'filled' || status === 'filling') &&
						'bg-gradient-to-r from-ai-1 via-ai-2 to-ai-3 shadow-ai-2/15 dark:shadow-none shadow-sm',
					status === 'filling' &&
						'motion-safe:animate-trace-shimmer motion-safe:bg-[length:200%_100%]',
					status === 'uncertain' &&
						'bg-gradient-to-r from-amber-500 via-ai-2 to-ai-1 shadow-amber-500/15 shadow-sm dark:from-amber-600/80 dark:shadow-none',
					status === 'confirmed' && 'bg-ai-1/35',
				)}
			>
				<div className={cn('rounded-md', framed && 'bg-background')}>
					<div
						className={cn(
							'rounded-md',
							(status === 'filled' || status === 'filling') &&
								'bg-gradient-to-r from-ai-1/[0.07] via-ai-2/[0.07] to-ai-3/[0.07]',
							status === 'uncertain' &&
								'bg-gradient-to-r from-amber-500/[0.09] via-ai-2/[0.06] to-ai-1/[0.06]',
						)}
					>
						{field}
					</div>
				</div>
			</div>
			{mark ||
			(onConfirm && (status === 'filled' || status === 'uncertain')) ? (
				<div className='pointer-events-none absolute -top-2 right-2 flex items-center gap-1 font-medium text-[10px] leading-4'>
					{mark ? (
						showReasoning ? (
							<ReasoningMark reasoning={reasoning}>{mark}</ReasoningMark>
						) : (
							<span aria-hidden>{mark}</span>
						)
					) : null}
					{onConfirm && (status === 'filled' || status === 'uncertain') ? (
						<button
							aria-label={text.confirm}
							className='pointer-events-auto grid size-4 place-items-center rounded-full border border-ai-1/50 bg-background text-ai-foreground transition-colors duration-fast hover:bg-ai-1 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 dark:hover:text-white'
							onClick={onConfirm}
							title={text.confirm}
							type='button'
						>
							<Check aria-hidden className='size-2.5' />
						</button>
					) : null}
				</div>
			) : null}
			{described ? (
				<span className='sr-only' id={descriptionId}>
					{DESCRIPTIONS[status as Exclude<AiFieldStatus, 'none'>]}
					{showReasoning ? reasoningSentence(reasoning) : null}
				</span>
			) : null}
		</div>
	)
}

/** 右上の印を、判断の中身を開く押せる物にする。 */
function ReasoningMark({
	reasoning,
	children,
}: Readonly<{ reasoning: AiReasoning; children: React.ReactNode }>) {
	const { open, setOpen, hover } = useHoverOpen()
	return (
		<Popover onOpenChange={setOpen} open={open}>
			<PopoverTrigger
				aria-label='AI の判断の中身を見る'
				className='pointer-events-auto cursor-pointer rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50'
				type='button'
				{...hover}
			>
				{children}
			</PopoverTrigger>
			<PopoverContent align='end' className='w-72' {...hover}>
				<AiReasoningDetails reasoning={reasoning} />
			</PopoverContent>
		</Popover>
	)
}

export { AiField, type AiFieldLabels, type AiFieldProps, type AiFieldStatus }
