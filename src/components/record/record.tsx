import {
	ArrowUpRight,
	CircleAlert,
	CircleSlash,
	Copy,
	ExternalLink,
	Lock,
} from 'lucide-react'
import {
	type CSSProperties,
	type ComponentType,
	type MouseEvent,
	type KeyboardEvent,
	type ReactElement,
	type ReactNode,
	createContext,
	useContext,
	useEffect,
	useId,
	useMemo,
	useRef,
	useState,
} from 'react'

import { cn } from '../../lib/utils'
import { Button } from '../basics/button'
import { HoverPeek, type HoverPeekTriggerProps } from '../overlays/hover-peek'

/** 記録の様子。 */
export type RecordStatus =
	| 'ready'
	| 'loading'
	| 'missing'
	| 'forbidden'
	| 'unavailable'

/** 要点の枠の下に出す操作。 */
export type RecordAction = {
	label: string
	icon?: ComponentType<{ className?: string }>
	/** 移る先。`newTab` でなければアプリの画面の移動の仕組みで移る。 */
	href?: string
	/** 新しいタブで開く。 */
	newTab?: boolean
	/** 押したときの動き（コピーなど）。 */
	onSelect?: () => void | Promise<void>
	/** `onSelect` が終わった後に少しの間出す文言（例「コピーしました」）。 */
	doneLabel?: string
}

/** よく使う操作を作る。 */
export const recordActions = {
	/** 新しいタブで開く。 */
	newTab: (href: string, label = '新しいタブで開く'): RecordAction => ({
		label,
		icon: ExternalLink,
		href,
		newTab: true,
	}),
	/** 文字をコピーする（ID など）。 */
	copy: (text: string, label = 'ID をコピー'): RecordAction => ({
		label,
		icon: Copy,
		doneLabel: 'コピーしました',
		onSelect: () => navigator.clipboard?.writeText(text),
	}),
}

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
	/**
	 * どのシステムの記録か。`RecordKindProvider` の `systems` のキー（登録が無ければそのまま名前として出す）。
	 * 例「商品管理」「顧客管理」「会計」。要点の枠の上に、システムの絵・名前・色の印で出す。
	 */
	system?: string
	/** 詳細の画面の場所。あれば押すとそこへ移り、要点の枠に「{システム}で開く」が出る。 */
	getHref?: (record: T) => string | undefined
	/** 「{システム}で開く」の文言を変える。 */
	openLabel?: string
	/** 触れると出る要点の中身。 */
	renderPreview?: (record: T) => ReactNode
	/** 要点の枠の下に足す操作（新しいタブで開く・ID をコピー・関係する一覧を見るなど）。 */
	getActions?: (record: T) => readonly RecordAction[]
	/** 付け替えの候補の枠の下に出す、元のシステムへ移る道筋（新しく作る・一覧を開くなど）。 */
	pickerActions?: readonly RecordAction[]
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

/** システムの色の印。どのシステムの記録かを、帯・線・開くボタンの色で見分ける。 */
export type RecordSystemTone =
	| 'blue'
	| 'green'
	| 'amber'
	| 'violet'
	| 'rose'
	| 'teal'
	| 'slate'

/** システムごとの決まり（商品管理・顧客管理・会計など）。 */
export type RecordSystemDefinition = {
	/** システムの名前（例「商品管理」）。 */
	name: string
	/** システムの絵。 */
	icon?: ComponentType<{ className?: string }>
	/** 色の印。既定は `slate`。 */
	tone?: RecordSystemTone
}

type RecordKindRegistry = {
	kinds: Readonly<Record<string, AnyRecordKindDefinition>>
	systems: Readonly<Record<string, RecordSystemDefinition>>
	currentSystem?: string
	navigate?: (href: string) => void
}

const RecordKindContext = createContext<RecordKindRegistry>({
	kinds: {},
	systems: {},
})

export type RecordKindProviderProps = {
	/** 種類の名前ごとの決まり。例 `{ customer: customerKind, product: productKind }`。 */
	kinds: Readonly<Record<string, AnyRecordKindDefinition>>
	/** システムごとの決まり。種類の `system` にこのキーを書く。例 `{ catalog: { name: '商品管理', icon: Package, tone: 'amber' } }`。 */
	systems?: Readonly<Record<string, RecordSystemDefinition>>
	/**
	 * 今の画面がどのシステムか（`systems` のキー）。同じシステムの記録は、ふつうの枠で出す。
	 * 違うシステムの記録は、別のシステムをのぞいていると分かる枠で出す。
	 */
	currentSystem?: string
	/**
	 * 詳細へ移る方法（アプリの画面の移動の仕組み）。
	 * 渡さなければふつうのリンクとして移る。新しいタブで開く操作はいつもリンクのまま。
	 */
	navigate?: (href: string) => void
	children: ReactNode
}

const NO_SYSTEMS = {}

/** 記録の種類とシステムの決まりを登録する。アプリの外側に 1 つ置く。 */
export function RecordKindProvider({
	kinds,
	systems = NO_SYSTEMS,
	currentSystem,
	navigate,
	children,
}: RecordKindProviderProps) {
	const value = useMemo(
		() => ({ kinds, systems, currentSystem, navigate }),
		[kinds, systems, currentSystem, navigate],
	)
	return (
		<RecordKindContext.Provider value={value}>
			{children}
		</RecordKindContext.Provider>
	)
}

/** 種類が属するシステムの決まりと、今の画面から見て別のシステムかを読む。 */
export function useRecordSystem(
	definition: Pick<RecordKindDefinition, 'system'>,
) {
	const { systems, currentSystem } = useContext(RecordKindContext)
	if (!definition.system) return null
	const system = systems[definition.system]
	return {
		key: definition.system,
		name: system?.name ?? definition.system,
		icon: system?.icon,
		tone: system?.tone ?? ('slate' as RecordSystemTone),
		/** 今の画面と違うシステムの記録か。 */
		external: definition.system !== currentSystem,
	}
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
	/** 別のシステムの記録なら、絵をシステムの色にする（付け替えの候補など）。 */
	toned?: boolean
	/**
	 * 見た目。`chip`（既定）は表・一覧向けの形。`inline` は文の中で使う控えめな形で、
	 * まわりの文字の大きさのまま、小さな絵と点線の下線で記録だと分かるようにする。
	 */
	variant?: 'chip' | 'inline'
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

/** 押したとき、⌘・Ctrl などを押していなければアプリの方法で移る。 */
function linkProps(href: string, navigate?: (href: string) => void) {
	return {
		href,
		onClick: (event: MouseEvent) => {
			// 行を押したときの動きと重ならないようにする。
			event.stopPropagation()
			if (navigate && isPlainLeftClick(event)) {
				event.preventDefault()
				navigate(href)
			}
		},
	}
}

/** 開く操作の文言。既定は、別のシステムなら「{システム}で開く」、同じなら「{名前}を開く」。 */
export function recordOpenLabel(
	definition: Pick<RecordKindDefinition, 'name' | 'openLabel'>,
	system?: { name: string; external: boolean } | null,
) {
	return (
		definition.openLabel ??
		(system?.external ? `${system.name}で開く` : `${definition.name}を開く`)
	)
}

/** 要点の枠・候補の枠の下に出す操作のボタン。 */
export function RecordActionButton({
	action,
	navigate,
}: {
	action: RecordAction
	navigate?: (href: string) => void
}) {
	const [done, setDone] = useState(false)
	useEffect(() => {
		if (!done) return
		const id = setTimeout(() => setDone(false), 1500)
		return () => clearTimeout(id)
	}, [done])
	const Icon = action.icon
	const body = (
		<>
			{Icon ? <Icon aria-hidden /> : null}
			<span aria-live='polite'>
				{done && action.doneLabel ? action.doneLabel : action.label}
			</span>
		</>
	)
	if (action.href)
		return (
			<Button asChild size='sm' variant='ghost'>
				<a
					{...(action.newTab
						? {
								href: action.href,
								target: '_blank',
								rel: 'noreferrer',
								onClick: (event: MouseEvent) => event.stopPropagation(),
							}
						: linkProps(action.href, navigate))}
				>
					{body}
				</a>
			</Button>
		)
	return (
		<Button
			type='button'
			size='sm'
			variant='ghost'
			onClick={async event => {
				event.stopPropagation()
				await action.onSelect?.()
				setDone(true)
			}}
		>
			{body}
		</Button>
	)
}

/** システムの色の印を、中の要素が `hsl(var(--record-tone))` で使えるようにする。 */
export function recordToneStyle(tone: RecordSystemTone): CSSProperties {
	return { '--record-tone': `var(--nui-tone-${tone})` } as CSSProperties
}

/**
 * 別のシステムの記録だと分かる帯。システムの絵・名前・色と、何の記録かを出す。
 * 要点の枠と付け替えの候補の枠で同じ物を使う（色の印は `recordToneStyle` を付けた親から取る）。
 */
export function RecordSystemBand({
	system,
	children,
	trailing = (
		<>
			別のシステムの記録
			<ArrowUpRight aria-hidden className='h-3 w-3' />
		</>
	),
}: {
	system: { name: string; icon?: ComponentType<{ className?: string }> }
	/** システム名の横に出す、何の記録か（例「商品」「店から選ぶ」）。 */
	children?: ReactNode
	/** 右に出す物。 */
	trailing?: ReactNode
}) {
	const Icon = system.icon
	return (
		<div className='flex items-center gap-1.5 border-border border-b bg-[hsl(var(--record-tone)/0.1)] px-3 py-2 text-xs'>
			{Icon ? (
				<Icon
					aria-hidden
					className='h-3.5 w-3.5 shrink-0 text-[hsl(var(--record-tone))]'
				/>
			) : null}
			<span className='shrink-0 whitespace-nowrap font-semibold text-[hsl(var(--record-tone))]'>
				{system.name}
			</span>
			{children ? (
				<span className='min-w-0 truncate text-muted-foreground'>
					· {children}
				</span>
			) : null}
			{trailing ? (
				<span className='ml-auto inline-flex shrink-0 items-center gap-0.5 text-[11px] text-muted-foreground'>
					{trailing}
				</span>
			) : null}
		</div>
	)
}

/**
 * 要点の枠の中身。
 *
 * 別のシステムの記録では、上にシステムの色の帯（絵・名前・「別のシステムの記録 ↗」）、左に同じ色の線を付け、
 * 中身は読むだけの地に、下の「{システム}で開く」も同じ色にする。今の画面と同じシステムの記録は、ふつうの枠で出す。
 * 消えた・見る権限が無い・読み込めない記録では、開けないことと理由を出す。
 */
export function RecordCard<T = unknown>({
	kind,
	record,
	status = record ? 'ready' : 'missing',
}: {
	kind: string
	record?: T | null
	status?: Exclude<RecordStatus, 'loading'>
}) {
	const { definition, navigate } = useRecordKind<T>(kind)
	const system = useRecordSystem(definition)
	const external = !!system?.external
	const reasonId = useId()
	const KindIcon = definition.icon
	const SystemIcon = system?.icon ?? KindIcon
	const ready = status === 'ready' && record
	const href = ready ? definition.getHref?.(record) : undefined
	const actions = ready ? (definition.getActions?.(record) ?? []) : []
	const openLabel = recordOpenLabel(definition, system)
	const reason =
		status === 'forbidden'
			? '見る権限が無いので開けません。'
			: status === 'unavailable'
				? '読み込めなかったので開けません。'
				: '削除されているので開けません。'
	const tone = external && system ? recordToneStyle(system.tone) : undefined
	return (
		<div
			style={tone}
			data-external={external || undefined}
			className={cn(
				'text-sm',
				external && 'border-l-[3px] border-l-[hsl(var(--record-tone))]',
			)}
		>
			{external && system ? (
				<RecordSystemBand system={{ name: system.name, icon: SystemIcon }}>
					{definition.name}
				</RecordSystemBand>
			) : (
				<div className='flex items-center gap-1.5 border-border border-b px-3 py-2 text-xs'>
					{KindIcon ? (
						<KindIcon
							aria-hidden
							className='h-3.5 w-3.5 text-muted-foreground'
						/>
					) : null}
					<span className='font-medium text-foreground'>{definition.name}</span>
				</div>
			)}
			<div className={cn('px-3 py-2.5', external && 'bg-surface')}>
				{ready ? (
					definition.renderPreview ? (
						definition.renderPreview(record)
					) : (
						<p className='font-medium'>{definition.getLabel(record)}</p>
					)
				) : (
					<p className='text-muted-foreground'>
						{status === 'forbidden'
							? `${definition.name}（${recordKindText(definition, 'forbidden')}）`
							: recordKindText(
									definition,
									status === 'ready' ? 'missing' : status,
								)}
					</p>
				)}
			</div>
			{ready && !href && !actions.length ? null : (
				<div className='flex flex-wrap items-center gap-1 border-border border-t p-2'>
					{href ? (
						<Button
							asChild
							size='sm'
							variant='primary'
							className={cn(
								external &&
									'bg-[hsl(var(--record-tone))] text-white hover:bg-[hsl(var(--record-tone)/0.9)] active:bg-[hsl(var(--record-tone)/0.8)] dark:text-[hsl(var(--nui-background))]',
							)}
						>
							<a {...linkProps(href, navigate)}>
								{external && SystemIcon ? <SystemIcon aria-hidden /> : null}
								{openLabel}
								<ArrowUpRight aria-hidden />
							</a>
						</Button>
					) : !ready ? (
						<>
							<Button
								type='button'
								size='sm'
								variant='secondary'
								aria-disabled='true'
								aria-describedby={reasonId}
								className='cursor-not-allowed opacity-50'
								onClick={event => event.preventDefault()}
							>
								{openLabel}
							</Button>
							<span id={reasonId} className='text-muted-foreground text-xs'>
								{reason}
							</span>
						</>
					) : null}
					{actions.map(action => (
						<RecordActionButton
							key={action.label}
							action={action}
							navigate={navigate}
						/>
					))}
				</div>
			)}
		</div>
	)
}

/**
 * 別の業務の記録を 1 つ出す。見た目と動きは、登録した種類の決まりで決まる。
 * 押すと詳細へ移る。触れる・フォーカスすると、種類とシステム・要点・開く操作の枠が出る（↓ で操作へ移れる）。
 * 読み込み中・消えた・見る権限が無い・読み込めないときも決まりどおりに出す。
 */
export function RecordChip<T = unknown>({
	kind,
	record,
	status = record ? 'ready' : 'missing',
	interactive = true,
	showDescription = false,
	toned = false,
	variant = 'chip',
	className,
}: RecordChipProps<T>) {
	const { definition, navigate } = useRecordKind<T>(kind)
	const system = useRecordSystem(definition)
	const inline = variant === 'inline'
	const toneStyle =
		(toned || inline) && system?.external
			? recordToneStyle(system.tone)
			: undefined
	const base = cn(
		inline
			? 'inline-flex max-w-full items-baseline gap-1 align-baseline'
			: 'inline-flex min-w-0 max-w-full items-center gap-1.5 align-middle text-sm',
		className,
	)
	const iconSize = inline ? 'h-[0.85em] w-[0.85em] self-center' : 'h-3.5 w-3.5'
	const focusRing =
		'rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'

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
		const chip = (props?: HoverPeekTriggerProps) => (
			<span
				{...props}
				role={props ? 'button' : undefined}
				tabIndex={props ? 0 : undefined}
				className={cn(base, 'text-muted-foreground', props && focusRing)}
				title={props ? undefined : shown}
			>
				<Icon aria-hidden className={cn(iconSize, 'shrink-0')} />
				<span className={cn('truncate', state === 'missing' && 'line-through')}>
					{shown}
				</span>
			</span>
		)
		if (!interactive) return chip()
		return (
			<HoverPeek label={`${definition.name}: ${shown}`} renderTrigger={chip}>
				<RecordCard kind={kind} status={state} />
			</HoverPeek>
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
			{/* 文の中では、記録ごとの絵（顔など）より控えめな種類の絵を使う。 */}
			{definition.renderAvatar && !(inline && Icon) ? (
				<span aria-hidden className='inline-flex shrink-0'>
					{definition.renderAvatar(record)}
				</span>
			) : Icon ? (
				<span
					aria-hidden
					style={toneStyle}
					className={cn('inline-flex shrink-0', inline && 'self-center')}
				>
					<Icon
						className={cn(
							iconSize,
							toneStyle
								? 'text-[hsl(var(--record-tone))]'
								: 'text-muted-foreground',
						)}
					/>
				</span>
			) : null}
			<span className='truncate' title={interactive ? undefined : label}>
				{label}
			</span>
			{description ? (
				<span className='shrink-0 text-muted-foreground text-xs'>
					{description}
				</span>
			) : null}
		</>
	)
	if (!interactive) return <span className={base}>{content}</span>

	const trigger = (props: HoverPeekTriggerProps) =>
		href ? (
			<a
				{...props}
				{...linkProps(href, navigate)}
				className={cn(
					base,
					focusRing,
					inline
						? 'font-medium text-foreground underline decoration-muted-foreground/60 decoration-dotted underline-offset-4 hover:decoration-solid'
						: 'text-foreground underline-offset-2 hover:underline',
				)}
			>
				{content}
			</a>
		) : (
			<span
				{...props}
				role='button'
				tabIndex={0}
				className={cn(
					base,
					focusRing,
					inline &&
						'cursor-default font-medium underline decoration-muted-foreground/60 decoration-dotted underline-offset-4',
				)}
			>
				{content}
			</span>
		)
	return (
		<HoverPeek
			label={`${definition.name}「${label}」の要点`}
			renderTrigger={trigger}
		>
			<RecordCard kind={kind} record={record} />
		</HoverPeek>
	)
}

/** 記録へのリンク（`RecordChip` と同じ物）。表の外の一覧などで、名前を分かりやすくしたいときに使う。 */
export const RecordLink = RecordChip

/**
 * 文の中の記録（控えめな形）。まわりの文字の大きさのまま、小さな絵と点線の下線で記録だと分かる。
 * 触れる・フォーカスすると、表のセルと同じ要点のカードが出る。例「{RecordMention}の請求書を見直しました」。
 */
export function RecordMention<T = unknown>(
	props: Omit<RecordChipProps<T>, 'variant' | 'showDescription'>,
) {
	return <RecordChip {...props} variant='inline' />
}
