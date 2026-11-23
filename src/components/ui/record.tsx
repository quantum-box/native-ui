import { CircleAlert, CircleSlash, Lock } from 'lucide-react'
import {
	type ComponentType,
	type MouseEvent,
	type ReactNode,
	createContext,
	useContext,
	useMemo,
} from 'react'

import { cn } from '../../lib/utils'
import { HoverCard, HoverCardContent, HoverCardTrigger } from './hover-card'

/** 記録の様子。 */
export type RecordStatus =
	| 'ready'
	| 'loading'
	| 'missing'
	| 'forbidden'
	| 'unavailable'

/**
 * 記録の種類ごとの決まり（取引先・商品・担当者など）。アプリが 1 か所で決めて登録する。
 * native-ui は種類の名前を知らず、ここに書かれた決まりどおりに出すだけ。
 */
export type RecordKindDefinition<T = unknown> = {
	/** 種類の名前（例「取引先」）。読み上げや、消えた・見られないときの文言に使う。 */
	name: string
	/** 記録を見分ける ID。付け替えるときの値に使う。 */
	getId: (record: T) => string
	/** 記録の名前。 */
	getLabel: (record: T) => string
	/** 名前の横に薄く出す補足（コード・番号など）。 */
	getDescription?: (record: T) => string | undefined
	/** 種類の絵。 */
	icon?: ComponentType<{ className?: string }>
	/** 記録ごとの絵（担当者の顔など）。あれば `icon` の代わりに出す。 */
	renderAvatar?: (record: T) => ReactNode
	/** 詳細の画面の場所。あれば押すとそこへ移る。 */
	getHref?: (record: T) => string | undefined
	/** 触れると出る要点。 */
	renderPreview?: (record: T) => ReactNode
	/** 検索に使う言葉（読み仮名・コードなど）。 */
	getKeywords?: (record: T) => string[]
	/** 付け替えるときの候補を出す（アプリのデータを読むフックでもよい）。 */
	useCandidates?: () => {
		records: readonly T[]
		loading?: boolean
	}
	/** 消えた記録の文言。既定は「削除された{名前}」。 */
	missingText?: string
	/** 見る権限が無い記録の文言。既定は「見る権限がありません」。 */
	forbiddenText?: string
	/** 読み込めなかったときの文言。既定は「{名前}を読み込めませんでした」。 */
	unavailableText?: string
	/** 読み込み中の読み上げ。既定は「{名前}を読み込んでいます」。 */
	loadingText?: string
}

/** 種類の決まりを型付きで書くための入れ物（中身はそのまま返す）。 */
export function defineRecordKind<T>(definition: RecordKindDefinition<T>) {
	return definition
}

/** どの種類の決まりでも入る型（種類ごとに記録の型が違うため）。 */
// biome-ignore lint/suspicious/noExplicitAny: 型の違う決まりを 1 つの登録にまとめるため
export type AnyRecordKindDefinition = RecordKindDefinition<any>

type RecordKindRegistry = {
	kinds: Readonly<Record<string, AnyRecordKindDefinition>>
	navigate?: (href: string) => void
}

const RecordKindContext = createContext<RecordKindRegistry>({ kinds: {} })

export type RecordKindProviderProps = {
	/** 種類の名前ごとの決まり。例 `{ customer: customerKind, product: productKind }`。 */
	kinds: Readonly<Record<string, AnyRecordKindDefinition>>
	/**
	 * 詳細へ移る方法（アプリの画面の移動の仕組み）。
	 * 渡さなければふつうのリンクとして移る。新しいタブで開く操作はいつもリンクのまま。
	 */
	navigate?: (href: string) => void
	children: ReactNode
}

/** 記録の種類の決まりを登録する。アプリの外側に 1 つ置く。 */
export function RecordKindProvider({
	kinds,
	navigate,
	children,
}: RecordKindProviderProps) {
	const value = useMemo(() => ({ kinds, navigate }), [kinds, navigate])
	return (
		<RecordKindContext.Provider value={value}>
			{children}
		</RecordKindContext.Provider>
	)
}

/** 登録した種類の決まりを読む。登録が無ければ知らせる。 */
export function useRecordKind<T = unknown>(kind: string) {
	const { kinds, navigate } = useContext(RecordKindContext)
	const definition = kinds[kind] as RecordKindDefinition<T> | undefined
	if (!definition)
		throw new Error(
			`記録の種類「${kind}」が登録されていません。RecordKindProvider の kinds に足してください。`,
		)
	return { definition, navigate }
}

/** 記録の名前を出す（決まりどおり）。 */
export function recordKindText<T>(
	definition: RecordKindDefinition<T>,
	status: Exclude<RecordStatus, 'ready'>,
) {
	if (status === 'missing')
		return definition.missingText ?? `削除された${definition.name}`
	if (status === 'forbidden')
		return definition.forbiddenText ?? '見る権限がありません'
	if (status === 'unavailable')
		return (
			definition.unavailableText ?? `${definition.name}を読み込めませんでした`
		)
	return definition.loadingText ?? `${definition.name}を読み込んでいます`
}

export type RecordChipProps<T = unknown> = {
	/** 登録した種類の名前。 */
	kind: string
	/** 記録。無ければ `status` の出し方になる。 */
	record?: T | null
	/** 記録の様子。既定は、記録があれば `ready`、無ければ `missing`。 */
	status?: RecordStatus
	/** 押して詳細へ移る・触れて要点を出す。既定は true。 */
	interactive?: boolean
	/** 補足（コードなど）も出す。既定は false。 */
	showDescription?: boolean
	className?: string
}

function isPlainLeftClick(event: MouseEvent) {
	return (
		event.button === 0 &&
		!event.metaKey &&
		!event.ctrlKey &&
		!event.shiftKey &&
		!event.altKey
	)
}

/**
 * 別の業務の記録を 1 つ出す。見た目と動きは、登録した種類の決まりで決まる。
 * 押すと詳細へ移り、触れると要点が出る。読み込み中・消えた・見る権限が無いときも決まりどおりに出す。
 */
export function RecordChip<T = unknown>({
	kind,
	record,
	status = record ? 'ready' : 'missing',
	interactive = true,
	showDescription = false,
	className,
}: RecordChipProps<T>) {
	const { definition, navigate } = useRecordKind<T>(kind)
	const base = cn(
		'inline-flex min-w-0 max-w-full items-center gap-1.5 align-middle text-sm',
		className,
	)

	if (status === 'loading') {
		return (
			<span className={base} aria-busy='true'>
				<span
					aria-hidden
					className='h-4 w-4 shrink-0 animate-pulse rounded-full bg-muted'
				/>
				<span
					aria-hidden
					className='h-3 w-20 animate-pulse rounded-sm bg-muted'
				/>
				<span className='sr-only'>{recordKindText(definition, 'loading')}</span>
			</span>
		)
	}

	if (status !== 'ready' || !record) {
		const state = status === 'ready' ? 'missing' : status
		const Icon =
			state === 'forbidden'
				? Lock
				: state === 'unavailable'
					? CircleAlert
					: CircleSlash
		const text = recordKindText(definition, state)
		// 見る権限が無いときは、何の記録かが分かるように種類の名前を付ける。
		const shown = state === 'forbidden' ? `${definition.name}（${text}）` : text
		return (
			<span className={cn(base, 'text-muted-foreground')} title={shown}>
				<Icon aria-hidden className='h-3.5 w-3.5 shrink-0' />
				<span className={cn('truncate', state === 'missing' && 'line-through')}>
					{shown}
				</span>
			</span>
		)
	}

	const Icon = definition.icon
	const label = definition.getLabel(record)
	const description = showDescription
		? definition.getDescription?.(record)
		: undefined
	const href = interactive ? definition.getHref?.(record) : undefined
	const content = (
		<>
			{definition.renderAvatar ? (
				<span aria-hidden className='inline-flex shrink-0'>
					{definition.renderAvatar(record)}
				</span>
			) : Icon ? (
				<Icon
					aria-hidden
					className='h-3.5 w-3.5 shrink-0 text-muted-foreground'
				/>
			) : null}
			<span className='truncate' title={label}>
				{label}
			</span>
			{description ? (
				<span className='shrink-0 text-muted-foreground text-xs'>
					{description}
				</span>
			) : null}
		</>
	)
	const anchor = href ? (
		<a
			href={href}
			className={cn(
				base,
				'rounded-sm text-foreground underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
			)}
			onClick={event => {
				// 行を押したときの動きと重ならないようにする。
				event.stopPropagation()
				if (navigate && isPlainLeftClick(event)) {
					event.preventDefault()
					navigate(href)
				}
			}}
		>
			{content}
		</a>
	) : (
		<span
			className={base}
			tabIndex={interactive && definition.renderPreview ? 0 : undefined}
		>
			{content}
		</span>
	)

	if (!interactive || !definition.renderPreview) return anchor
	return (
		<HoverCard openDelay={400} closeDelay={100}>
			<HoverCardTrigger asChild>{anchor}</HoverCardTrigger>
			<HoverCardContent aria-label={`${definition.name}「${label}」の要点`}>
				{definition.renderPreview(record)}
			</HoverCardContent>
		</HoverCard>
	)
}
