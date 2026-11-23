'use client'

import { Check, Database, ExternalLink } from 'lucide-react'
import * as React from 'react'

import { cn } from '../../lib/utils'
import { Popover, PopoverContent, PopoverTrigger } from './popover'

/*
 * データ基盤から来た事実（統計・市場価格などの実測データ）の見た目。
 * AI の推測（紫〜青のグラデーション）と見分けられるよう、落ち着いた青緑の単色と
 * データの印（円柱のアイコン）で出す。どの値にも出典を付けられる。
 */

/** 値の出典。 */
interface FactSource {
	/** 出典の名前。例「小売物価統計」。 */
	name: string
	/** いつのデータか。例「2026年10月」。 */
	asOf?: string
	/** 何を基にした値か。例「東京都区部の平均」。 */
	basis?: string
	/** 元の資料の URL。 */
	url?: string
}

/** 「小売物価統計・2026年10月」のような短い書き方。 */
function sourceText(source: FactSource) {
	return source.asOf ? `${source.name}・${source.asOf}` : source.name
}

/** 画面を読む道具に伝える出典の文。 */
function sourceSentence(source: FactSource) {
	return `出典: ${sourceText(source)}${source.basis ? `（${source.basis}）` : ''}。`
}

/** 出典の詳しい中身。印に触れたときや、囲みの中で使う。 */
function FactSourceDetails({
	source,
	className,
}: Readonly<{ source: FactSource; className?: string }>) {
	return (
		<div className={cn('grid gap-2 text-xs', className)}>
			<p className='flex items-center gap-1.5 font-medium text-sm text-teal-700 dark:text-teal-300'>
				<Database aria-hidden className='size-3.5' />
				データ基盤の値
			</p>
			<dl className='grid grid-cols-[auto_1fr] gap-x-3 gap-y-1'>
				<dt className='text-muted-foreground'>出典</dt>
				<dd>{source.name}</dd>
				{source.asOf ? (
					<>
						<dt className='text-muted-foreground'>時点</dt>
						<dd>{source.asOf}</dd>
					</>
				) : null}
				{source.basis ? (
					<>
						<dt className='text-muted-foreground'>基にした値</dt>
						<dd>{source.basis}</dd>
					</>
				) : null}
			</dl>
			{source.url ? (
				<a
					className='inline-flex w-fit items-center gap-1 text-teal-700 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 dark:text-teal-300'
					href={source.url}
					rel='noreferrer noopener'
					target='_blank'
				>
					元の資料を開く
					<ExternalLink aria-hidden className='size-3' />
				</a>
			) : null}
		</div>
	)
}

/** 指を乗せると開き、離すと少し待って閉じる。押しても開け閉めできる。 */
function useHoverOpen() {
	const [open, setOpen] = React.useState(false)
	const timer = React.useRef<ReturnType<typeof setTimeout>>()
	const cancel = () => {
		if (timer.current) clearTimeout(timer.current)
	}
	React.useEffect(() => cancel, [])
	const hover = {
		onPointerEnter: (event: React.PointerEvent) => {
			if (event.pointerType !== 'mouse') return
			cancel()
			setOpen(true)
		},
		onPointerLeave: (event: React.PointerEvent) => {
			if (event.pointerType !== 'mouse') return
			cancel()
			timer.current = setTimeout(() => setOpen(false), 150)
		},
	}
	return { open, setOpen, hover }
}

// 地は透けない色にする。入力欄の枠に重ねても、枠線が印の上に透けて見えないように。
// 幅には上限を付け、長い出典名は「…」で省く（全部の名前は詳しい中身と読み上げで分かる）。
const factLabelClass =
	'inline-flex min-w-0 max-w-[14rem] shrink-0 items-center gap-0.5 whitespace-nowrap rounded-full border border-teal-200 bg-teal-50 px-1.5 align-middle font-medium text-[10px] text-teal-800 leading-4 dark:border-teal-800 dark:bg-teal-950 dark:text-teal-200'

interface FactLabelProps {
	/** 印の文言。既定は出典名。出典が無いときは「データ」。 */
	children?: React.ReactNode
	/** 出典。渡すと、印に出典名が出て、触れたり押したりすると詳しい中身が開く。 */
	source?: FactSource
	/** 出典名のあとに時点（例「2026年10月」）も出す。 */
	showAsOf?: boolean
	/** 出典名のあとに付ける言葉。例「要確認」。省かずに必ず出す。 */
	suffix?: React.ReactNode
	className?: string
}

/**
 * 文の中や値の横に付ける小さな印。出典名を出し、その値がデータ基盤から来た事実だと
 * 青緑の色と円柱の絵で示す。`AiLabel`（AI の推測）と並べて使う。
 */
function FactLabel({
	children,
	source,
	showAsOf = false,
	suffix,
	className,
}: Readonly<FactLabelProps>) {
	const { open, setOpen, hover } = useHoverOpen()
	const text = children ?? source?.name ?? 'データ'
	const content = (
		<>
			<Database aria-hidden className='size-2.5 shrink-0' />
			<span className='min-w-0 truncate'>
				{text}
				{showAsOf && source?.asOf ? (
					<span className='font-normal opacity-80'>・{source.asOf}</span>
				) : null}
			</span>
			{suffix ? <span className='shrink-0'>・{suffix}</span> : null}
		</>
	)

	if (!source) {
		return <span className={cn(factLabelClass, className)}>{content}</span>
	}

	return (
		<Popover onOpenChange={setOpen} open={open}>
			<PopoverTrigger
				aria-label={`データ基盤の値。${sourceSentence(source)}${
					typeof suffix === 'string' ? `${suffix}。` : ''
				}詳しく見る`}
				className={cn(
					factLabelClass,
					'cursor-pointer transition-colors duration-fast hover:bg-teal-100 dark:hover:bg-teal-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
					className,
				)}
				type='button'
				{...hover}
			>
				{content}
			</PopoverTrigger>
			<PopoverContent align='start' className='w-64' {...hover}>
				<FactSourceDetails source={source} />
			</PopoverContent>
		</Popover>
	)
}

type FactFieldStatus =
	/** データ基盤の値が入ったまま。 */
	| 'filled'
	/** データが古い。人に確かめてほしい。 */
	| 'stale'
	/** 人が「これでよい」と確かめた。 */
	| 'confirmed'
	/** 人が直した。データの見た目は消える。 */
	| 'edited'
	/** データ基盤は関わっていない。普通の入力欄と同じ。 */
	| 'none'

interface FactFieldProps {
	status: FactFieldStatus
	/** 値の出典。印に触れると詳しく見られる。 */
	source?: FactSource
	/** 入力欄 1 つ。Input・SelectTrigger・textarea など。 */
	children: React.ReactElement
	/** 人が文字を打ったときに呼ばれる。ここで status を `edited` にする。 */
	onEdit?: () => void
	/** 渡すと、`filled`・`stale` のときに「確かめた」ボタンが出る。 */
	onConfirm?: () => void
	/** `edited` のときに「直した」の印を出すか。既定は出す。 */
	showEditedMark?: boolean
	className?: string
}

function describe(status: FactFieldStatus, source?: FactSource) {
	const from = source ? sourceSentence(source) : ''
	switch (status) {
		case 'filled':
			return `データ基盤の値です。${from}`
		case 'stale':
			return `データ基盤の値ですが、データが古い可能性があります。確かめてください。${from}`
		case 'confirmed':
			return `データ基盤の値で、確かめ済みです。${from}`
		case 'edited':
			return 'データ基盤の値を直しました。'
		default:
			return ''
	}
}

/**
 * データ基盤の値が入った入力欄を、欄そのものの見た目で分かるようにする包み。
 * `AiField` と同じ使い方で、入力欄の部品は変えずに外から包む。
 */
function FactField({
	status,
	source,
	children,
	onEdit,
	onConfirm,
	showEditedMark = true,
	className,
}: Readonly<FactFieldProps>) {
	const descriptionId = React.useId()
	const framed =
		status === 'filled' || status === 'stale' || status === 'confirmed'
	const description = describe(status, source)
	const described =
		description !== '' && (status !== 'edited' || showEditedMark)
	const canConfirm = onConfirm && (status === 'filled' || status === 'stale')

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
		'data-fact-status': status,
	} as Record<string, unknown>)

	const mark = (() => {
		switch (status) {
			case 'filled':
				return <FactLabel source={source} />
			case 'stale':
				return (
					<FactLabel
						className='border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200 dark:hover:bg-amber-900'
						source={source}
						suffix='要確認'
					/>
				)
			case 'confirmed':
				// 確かめた後は地を背景の色にして、静かな見た目にする。出典は残す。
				return (
					<FactLabel
						className='bg-background text-teal-700 hover:bg-teal-50 dark:bg-background dark:text-teal-300 dark:hover:bg-teal-950'
						source={source}
						suffix={
							<span className='inline-flex items-center gap-0.5'>
								<Check aria-hidden className='size-2.5' />
								確認済み
							</span>
						}
					/>
				)
			case 'edited':
				return showEditedMark ? (
					<span className='inline-flex items-center rounded-full border border-border bg-background px-1.5 text-muted-foreground'>
						直した
					</span>
				) : null
			default:
				return null
		}
	})()

	return (
		<div
			className={cn('relative w-full', className)}
			data-fact-status={status}
			onInput={onEdit}
		>
			<div
				className={cn(
					'rounded-md border border-transparent',
					status === 'filled' &&
						'border-teal-600/70 bg-teal-500/[0.06] dark:border-teal-400/60 dark:bg-teal-400/[0.07]',
					status === 'stale' &&
						'border-amber-500/80 border-dashed bg-amber-500/[0.06] dark:border-amber-400/70',
					status === 'confirmed' &&
						'border-teal-600/30 dark:border-teal-400/30',
				)}
			>
				{field}
			</div>
			{mark || canConfirm ? (
				<div className='absolute -top-2 right-2 flex items-center gap-1 font-medium text-[10px] leading-4'>
					{mark ? (
						<span aria-hidden={status === 'edited' ? true : undefined}>
							{mark}
						</span>
					) : null}
					{canConfirm ? (
						<button
							aria-label='データ基盤の値を確かめた'
							className='grid size-4 place-items-center rounded-full border border-teal-600/50 bg-background text-teal-700 transition-colors duration-fast hover:bg-teal-600 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 dark:border-teal-400/50 dark:text-teal-300 dark:hover:bg-teal-500 dark:hover:text-white'
							onClick={onConfirm}
							title='データ基盤の値を確かめた'
							type='button'
						>
							<Check aria-hidden className='size-2.5' />
						</button>
					) : null}
				</div>
			) : null}
			{described ? (
				<span className='sr-only' id={descriptionId}>
					{description}
				</span>
			) : null}
		</div>
	)
}

interface FactPanelProps {
	/** 見出し。既定は「データ基盤の値」。 */
	title?: string
	/** 見出しの下の説明。 */
	description?: React.ReactNode
	/** まとまり全体の出典。見出しの右に印として出る。 */
	source?: FactSource
	/** 値や候補の並び。 */
	children: React.ReactNode
	className?: string
}

/** データ基盤から来た値や候補のまとまりの囲み。`AiSuggestion` の事実版。 */
function FactPanel({
	title = 'データ基盤の値',
	description,
	source,
	children,
	className,
}: Readonly<FactPanelProps>) {
	return (
		<section
			aria-label={source ? `${title}。${sourceSentence(source)}` : title}
			className={cn(
				'overflow-hidden rounded-lg border border-teal-600/40 bg-background shadow-sm dark:border-teal-400/35',
				className,
			)}
		>
			<div className='flex items-start gap-2 border-teal-600/20 border-b bg-teal-500/[0.07] px-3 py-2 dark:border-teal-400/20 dark:bg-teal-400/[0.08]'>
				<span className='mt-0.5 grid size-5 shrink-0 place-items-center rounded-md bg-teal-600 text-white dark:bg-teal-500'>
					<Database aria-hidden className='size-3' />
				</span>
				<div className='min-w-0 flex-1'>
					<p className='font-semibold text-sm text-teal-800 dark:text-teal-200'>
						{title}
					</p>
					{description ? (
						<p className='text-muted-foreground text-xs'>{description}</p>
					) : null}
					{source ? (
						<FactLabel className='mt-1' showAsOf source={source} />
					) : null}
				</div>
			</div>
			{children}
		</section>
	)
}

export {
	FactField,
	type FactFieldProps,
	type FactFieldStatus,
	FactLabel,
	type FactLabelProps,
	FactPanel,
	type FactPanelProps,
	type FactSource,
	FactSourceDetails,
}
