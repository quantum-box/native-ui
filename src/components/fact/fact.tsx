'use client'

import { Check, Database, ExternalLink } from 'lucide-react'
import * as React from 'react'

import { useHoverOpen } from '../../lib/use-hover-open'
import { cn } from '../../lib/utils'
import { Popover, PopoverContent, PopoverTrigger } from '../overlays/popover'

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
			<p className='flex items-center gap-1.5 font-medium text-sm text-fact-foreground'>
				<Database aria-hidden className='size-3.5' />
				データ基盤の値
			</p>
			{/*
			 * 値に URL のような切れ目の無い長い文字があっても、枠からはみ出さず、
			 * 見出しの列もつぶれないようにする（見出しは折り返さず、値は途中で折り返す）。
			 */}
			<dl className='grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1 [&>dd]:[overflow-wrap:anywhere] [&>dt]:whitespace-nowrap [&>dt]:text-muted-foreground'>
				<dt>出典</dt>
				<dd>{source.name}</dd>
				{source.asOf ? (
					<>
						<dt>時点</dt>
						<dd>{source.asOf}</dd>
					</>
				) : null}
				{source.basis ? (
					<>
						<dt>基にした値</dt>
						<dd>{source.basis}</dd>
					</>
				) : null}
			</dl>
			{source.url ? (
				<a
					className='inline-flex w-fit items-center gap-1 text-fact-foreground underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50'
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

// 地は透けない色にする。入力欄の枠に重ねても、枠線が印の上に透けて見えないように。
// 幅には上限を付け、長い出典名は「…」で省く（全部の名前は詳しい中身と読み上げで分かる）。
const factLabelClass =
	'inline-flex min-w-0 max-w-[14rem] shrink-0 items-center gap-0.5 whitespace-nowrap rounded-full border border-fact-border bg-fact-subtle px-1.5 align-middle font-medium text-[10px] text-fact-foreground leading-4'

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
					'cursor-pointer transition-colors duration-fast hover:border-fact focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
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

interface FactValueProps {
	/** 値そのもの。例「380 円」。 */
	children: React.ReactNode
	/** 出典。渡すと、触れる・押すと出典の詳しい中身が開く。 */
	source?: FactSource
	/** データが古いとき。点線と絵が橙になり、読み上げで「要確認」と伝える。 */
	stale?: boolean
	className?: string
}

/**
 * 文の中に置く控えめな形。札は出さず、値そのものを青緑の文字と点線の下線にし、
 * 後ろに小さな円柱の絵を付ける。文の高さや行の間は変えない。
 * 触れる・押す・キーボードで選んで Enter で、出典の詳しい中身が開く。
 */
function FactValue({
	children,
	source,
	stale = false,
	className,
}: Readonly<FactValueProps>) {
	const { open, setOpen, hover } = useHoverOpen()
	const classes = cn(
		'inline text-fact-foreground underline decoration-dotted decoration-1 underline-offset-[3px]',
		stale
			? 'decoration-amber-500 dark:decoration-amber-400'
			: 'decoration-fact/70',
		className,
	)
	const icon = (
		<Database
			aria-hidden
			className={cn(
				'ml-0.5 inline size-[0.75em] align-baseline',
				stale ? 'text-amber-600 dark:text-amber-400' : 'opacity-70',
			)}
		/>
	)
	const spoken = `（データ基盤の値。${source ? sourceSentence(source) : ''}${
		stale ? 'データが古い可能性があります。要確認。' : ''
	}）`

	if (!source) {
		return (
			<span className={classes}>
				{children}
				{icon}
				<span className='sr-only'>{spoken}</span>
			</span>
		)
	}

	return (
		<Popover onOpenChange={setOpen} open={open}>
			<PopoverTrigger
				className={cn(
					classes,
					'cursor-pointer rounded-sm bg-transparent p-0 text-left leading-[inherit] hover:decoration-solid focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
				)}
				type='button'
				{...hover}
			>
				{children}
				{icon}
				<span className='sr-only'>{spoken}</span>
			</PopoverTrigger>
			<PopoverContent align='start' className='w-64' {...hover}>
				<FactSourceDetails source={source} />
				{stale ? (
					<p className='mt-2 text-amber-700 text-xs dark:text-amber-300'>
						データが古い可能性があります。確かめてから使ってください。
					</p>
				) : null}
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
						className='bg-background text-fact-foreground hover:bg-fact-subtle dark:bg-background'
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
					status === 'filled' && 'border-fact/70 bg-fact/[0.06]',
					status === 'stale' &&
						'border-amber-500/80 border-dashed bg-amber-500/[0.06] dark:border-amber-400/70',
					status === 'confirmed' && 'border-fact/30',
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
							className='grid size-4 place-items-center rounded-full border border-fact/50 bg-background text-fact-foreground transition-colors duration-fast hover:bg-fact hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 dark:hover:text-white'
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
				'overflow-hidden rounded-lg border border-fact/40 bg-background shadow-sm',
				className,
			)}
		>
			<div className='flex items-start gap-2 border-fact/20 border-b bg-fact/[0.07] px-3 py-2'>
				<span className='mt-0.5 grid size-5 shrink-0 place-items-center rounded-md bg-fact text-white'>
					<Database aria-hidden className='size-3' />
				</span>
				<div className='min-w-0 flex-1'>
					<p className='font-semibold text-sm text-fact-foreground'>{title}</p>
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
	FactValue,
	type FactValueProps,
}
