import { Check, CircleAlert, Loader2, Pencil, RotateCcw } from 'lucide-react'
import {
	type ButtonHTMLAttributes,
	type HTMLAttributes,
	type InputHTMLAttributes,
	type ReactNode,
	createContext,
	useContext,
	useCallback,
	forwardRef,
	useEffect,
	useId,
	useMemo,
	useRef,
	useState,
} from 'react'

import { cn } from '../../lib/utils'
import { Button } from './button'
import {
	type DataTableDensity,
	dataTableDensityStyles,
	useDataTableDensity,
	useDataTableDensityStyles,
} from './data-table-density'
import { Popover, PopoverAnchor, PopoverContent } from './popover'

/** その場で直すセルの今の様子。 */
export type DataTableInlineEditStatus = 'idle' | 'saving' | 'saved'

/** その場で直すセルに共通の引数。 */
export type DataTableInlineEditOptions<T> = {
	/** 今の値。使う側が持ち、保存できたら新しい値を渡し直す。 */
	value: T
	/**
	 * 保存する。終わる前に使う側の値を新しい値にしておく。
	 * 失敗したら例外を投げる（表示は元の値に戻り、`formatError` の文言が出る）。
	 */
	onSave: (value: T) => Promise<void>
	/** 保存の前に確かめる。だめなら理由の文言を返す（保存しない）。 */
	validate?: (value: T) => string | null
	/** 保存に失敗したときの文言。 */
	formatError?: (error: unknown) => string
	/** 直せないようにする。 */
	disabled?: boolean
	/** 同じ値か。同じなら保存しない。既定は `Object.is`。 */
	equals?: (a: T, b: T) => boolean
}

const defaultFormatError = () =>
	'保存できませんでした。もう一度試してください。'

/**
 * 「表示 → 編集 → 保存中 → 保存できた／失敗」の流れを持つ。
 * 欄の種類ごとのセルはこの上に作る。自分でセルを作るときにも使える。
 */
export function useDataTableInlineEdit<T>({
	value,
	onSave,
	validate,
	formatError = defaultFormatError,
	disabled = false,
	equals = Object.is,
}: DataTableInlineEditOptions<T>) {
	const [editing, setEditing] = useState(false)
	const [pending, setPending] = useState<{ value: T } | null>(null)
	const [status, setStatus] = useState<DataTableInlineEditStatus>('idle')
	const [error, setError] = useState<string | null>(null)
	const [failure, setFailure] = useState<DataTableInlineEditFailure<T> | null>(
		null,
	)
	const [resumeValue, setResumeValue] = useState<{ value: T } | null>(null)
	const failures = useRef(0)
	const saving = useRef(false)

	/** 編集を始める。直せないときや保存中は何もしない。 */
	const startEditing = useCallback(() => {
		if (disabled || saving.current) return false
		setError(null)
		setFailure(null)
		setEditing(true)
		return true
	}, [disabled])

	/** 編集をやめる（保存しない）。 */
	const cancel = useCallback(() => {
		setEditing(false)
		setResumeValue(null)
	}, [])

	/** 確かめの文言を出す（編集は続ける）。 */
	const reject = useCallback((message: string) => {
		setError(message)
	}, [])

	/**
	 * 保存する。確かめで止まったら false を返し、編集を続ける。
	 * 同じ値なら保存せずに編集を終える。
	 */
	const save = useCallback(
		async (next: T) => {
			if (disabled || saving.current) return false
			if (equals(next, value)) {
				setError(null)
				setEditing(false)
				return true
			}
			const failure = validate?.(next)
			if (failure) {
				setError(failure)
				return false
			}
			saving.current = true
			setEditing(false)
			setResumeValue(null)
			setPending({ value: next })
			setStatus('saving')
			setError(null)
			setFailure(null)
			try {
				await onSave(next)
				setStatus('saved')
			} catch (cause) {
				setStatus('idle')
				setError(formatError(cause))
				failures.current += 1
				setFailure({ attempted: next, kept: value, count: failures.current })
			} finally {
				setPending(null)
				saving.current = false
			}
			return true
		},
		[disabled, equals, formatError, onSave, validate, value],
	)

	/** 失敗した値で、もう一度保存する。 */
	const retry = useCallback(async () => {
		if (!failure) return false
		return save(failure.attempted)
	}, [failure, save])

	/** 失敗した値を入れたまま、編集に戻る（直してから保存し直す）。 */
	const resume = useCallback(() => {
		if (!failure) return false
		const attempted = failure.attempted
		if (!startEditing()) return false
		setResumeValue({ value: attempted })
		return true
	}, [failure, startEditing])

	return {
		/** 表示する値。保存中は新しい値を先に見せる。 */
		value: pending ? pending.value : value,
		/** 編集を始めるときの値。「直す」で戻ったときは、失敗した値。 */
		editValue: resumeValue ? resumeValue.value : value,
		editing,
		status,
		/** 失敗や確かめの理由。 */
		error,
		/** 保存に失敗したときの様子（何を保存しようとして、何のままか）。確かめで止まったときは null。 */
		failure,
		saving: status === 'saving',
		disabled,
		startEditing,
		cancel,
		reject,
		save,
		retry,
		resume,
	}
}

/** 保存に失敗したときの様子。 */
export type DataTableInlineEditFailure<T> = {
	/** 保存しようとした値。 */
	attempted: T
	/** 元に戻した値（今の値）。 */
	kept: T
	/** 何度目の失敗か（同じ失敗の知らせを 1 度だけ出すのに使う）。 */
	count: number
}

export type DataTableInlineEdit<T> = ReturnType<
	typeof useDataTableInlineEdit<T>
>

/**
 * その場で直すセルの箱。表示・編集中・保存中・保存できた・失敗のどれでも、
 * 高さ・余白・文字の位置が同じになるように、どのセルもこの形を使う。
 */
export function dataTableInlineEditCellClassName(
	density: DataTableDensity = 'default',
) {
	const size = dataTableDensityStyles[density]
	return cn(
		'flex w-full items-center text-left text-sm outline-none',
		size.box,
		size.x,
		size.gap,
	)
}

/** 押せるセル（表示のとき）の見た目。触れると背景が変わり、フォーカスの線はセルの内側に 1 本。 */
export function dataTableInlineEditTriggerClassName(
	density: DataTableDensity = 'default',
) {
	return cn(
		dataTableInlineEditCellClassName(density),
		'cursor-pointer hover:bg-muted focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent',
	)
}

/** 失敗したセルの印（赤い線を内側に 1 本）。 */
export const dataTableInlineEditErrorClassName =
	'ring-1 ring-inset ring-destructive'

/**
 * 保存中・保存できた・失敗の印。どの種類のセルでも、いつも右端の同じ場所に出す
 * （右揃えの金額の列でも、印は文字の右に出す）。印が無いときも場所は空けておく。
 */
export function DataTableInlineEditStatusIcon({
	status,
	error = null,
}: {
	status: DataTableInlineEditStatus
	error?: string | null
}) {
	const size = useDataTableDensityStyles()
	return (
		<span
			className={cn(
				'flex shrink-0 justify-end text-muted-foreground',
				size.slot,
			)}
			role='status'
		>
			{status === 'saving' ? (
				<>
					<Loader2 aria-hidden className={cn(size.icon, 'animate-spin')} />
					<span className='sr-only'>保存中</span>
				</>
			) : status === 'saved' ? (
				<>
					<Check aria-hidden className={size.icon} />
					<span className='sr-only'>保存済み</span>
				</>
			) : error ? (
				<CircleAlert
					aria-hidden
					className={cn(size.icon, 'text-destructive')}
				/>
			) : null}
		</span>
	)
}

const ErrorIdContext = createContext<string | undefined>(undefined)

/** セルの中から、理由の文言の ID を読む（`aria-describedby` に使う）。 */
export function useDataTableInlineEditErrorId() {
	return useContext(ErrorIdContext)
}

// ---- 失敗の一覧（表の側で任意に付ける） ---------------------------------------

type FailedCell = {
	id: string
	title: string
	focus: () => void
	element: () => HTMLElement | null
}

type FailuresRegistry = {
	cells: readonly FailedCell[]
	register: (cell: FailedCell) => void
	unregister: (id: string) => void
}

const FailuresContext = createContext<FailuresRegistry | null>(null)

/**
 * 表の中で保存に失敗したセルを集める。`DataTableInlineEditFailureSummary` と一緒に、表の外側に置く（任意）。
 */
export function DataTableInlineEditFailuresProvider({
	children,
}: {
	children: ReactNode
}) {
	const [cells, setCells] = useState<readonly FailedCell[]>([])
	const register = useCallback((cell: FailedCell) => {
		setCells(current => [...current.filter(item => item.id !== cell.id), cell])
	}, [])
	const unregister = useCallback((id: string) => {
		setCells(current => current.filter(item => item.id !== id))
	}, [])
	const value = useMemo(
		() => ({ cells, register, unregister }),
		[cells, register, unregister],
	)
	return (
		<FailuresContext.Provider value={value}>
			{children}
		</FailuresContext.Provider>
	)
}

/**
 * 「3 件を保存できませんでした」と出し、押すとそのセルへ移る。失敗が無いときは何も出さない。
 * `DataTableInlineEditFailuresProvider` の中で、表の上か下に置く。
 */
export function DataTableInlineEditFailureSummary({
	className,
}: {
	className?: string
}) {
	const registry = useContext(FailuresContext)
	const cells = useMemo(() => {
		// 表の中の並び順（上から、左から）にそろえる。
		return [...(registry?.cells ?? [])].sort((a, b) => {
			const left = a.element()
			const right = b.element()
			if (!left || !right) return 0
			return left.compareDocumentPosition(right) &
				Node.DOCUMENT_POSITION_FOLLOWING
				? -1
				: 1
		})
	}, [registry?.cells])
	if (!cells.length) return null
	return (
		<div
			role='region'
			aria-label='保存できなかったセル'
			className={cn(
				'flex flex-wrap items-center gap-x-2 gap-y-1 rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm',
				className,
			)}
		>
			<CircleAlert aria-hidden className='h-4 w-4 shrink-0 text-destructive' />
			<span className='font-medium text-destructive'>
				{cells.length}件を保存できませんでした
			</span>
			<span className='text-muted-foreground text-xs'>
				押すとそのセルへ移ります
			</span>
			<span className='flex flex-wrap gap-1'>
				{cells.map((cell, index) => (
					<button
						key={cell.id}
						type='button'
						onClick={cell.focus}
						className='max-w-80 truncate rounded-sm px-1.5 py-0.5 text-left text-destructive text-xs underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
					>
						{index + 1}. {cell.title}
					</button>
				))}
			</span>
		</div>
	)
}

// ---- 失敗の吹き出し -----------------------------------------------------------

const FOCUSABLE =
	'button:not([disabled]), a[href], input, [tabindex]:not([tabindex="-1"])'

export type DataTableInlineEditShellProps<T> = {
	edit: Pick<
		DataTableInlineEdit<T>,
		'error' | 'editing' | 'failure' | 'saving' | 'retry' | 'resume'
	>
	/** 何の値か（例「公開」「単価」）。失敗の見出しに使う。 */
	label?: string
	/** 値を人が読む文字にする（例 true →「公開」、1200 →「¥1,200」）。 */
	formatValue?: (value: T) => string
	/** 失敗の見出し。既定は「{label}を「{値}」にできませんでした」。 */
	describeFailure?: (attempted: string) => string
	/** 「直す」（編集に戻る）を出す。既定は true。 */
	canResume?: boolean
	className?: string
	children: ReactNode
}

/**
 * その場で直すセルの外側。失敗をセルの大きさを変えずに知らせる。
 *
 * - 失敗したセルは外周が赤い線になり、右端に赤い「!」が出る（中のセルが出す）。
 * - 理由はセルに付く吹き出しで出す。失敗した直後は 1 度だけ自分で開き、外を押すか数秒で閉じる。
 *   そのあとは、セルに触れる・フォーカスすると開く。
 * - 吹き出しには、何が失敗したか・理由・元に戻した値と、「もう一度」「直す」を出す。
 * - キーボードでは、セルで ↓ を押すと吹き出しの「もう一度」へ移り、Esc で戻る。
 * - 読み上げには、失敗と理由をすぐ伝える。
 * - 確かめで止まったとき（編集中）は、吹き出しに理由だけを出す。
 */
export function DataTableInlineEditShell<T>({
	edit,
	label,
	formatValue = value => String(value ?? ''),
	describeFailure,
	canResume = true,
	className,
	children,
}: DataTableInlineEditShellProps<T>) {
	const errorId = useId()
	const cellId = useId()
	const anchor = useRef<HTMLDivElement>(null)
	const content = useRef<HTMLDivElement>(null)
	const [hovered, setHovered] = useState(false)
	const [focused, setFocused] = useState(false)
	const [inside, setInside] = useState(false)
	const [fresh, setFresh] = useState(false)
	const [dismissed, setDismissed] = useState(false)
	const focusOnOpen = useRef(false)
	const leaveTimer = useRef<ReturnType<typeof setTimeout>>()
	const registry = useContext(FailuresContext)
	const { failure, error, editing } = edit

	const shown = (value: T) => formatValue(value) || '空欄'
	const attempted = failure ? shown(failure.attempted) : ''
	const title = failure
		? (describeFailure?.(attempted) ??
			(label
				? `${label}を「${attempted}」にできませんでした`
				: `「${attempted}」を保存できませんでした`))
		: ''
	const kept = failure ? `「${shown(failure.kept)}」のままです。` : ''
	const message = failure
		? [`${title}。`, error, kept].filter(Boolean).join(' ')
		: (error ?? '')

	// 失敗した直後は 1 度だけ自分で開き、数秒で閉じる。
	const count = failure?.count
	useEffect(() => {
		if (!count) return
		setFresh(true)
		setDismissed(false)
		const id = setTimeout(() => setFresh(false), 5000)
		return () => clearTimeout(id)
	}, [count])
	useEffect(() => () => clearTimeout(leaveTimer.current), [])

	// 表の側の一覧に知らせる。
	const register = registry?.register
	const unregister = registry?.unregister
	useEffect(() => {
		if (!failure || !register || !unregister) return
		register({
			id: cellId,
			title,
			element: () => anchor.current,
			focus: () => {
				const target = anchor.current?.querySelector<HTMLElement>(FOCUSABLE)
				target?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' })
				target?.focus()
				setDismissed(false)
			},
		})
		return () => unregister(cellId)
	}, [failure, register, unregister, cellId, title])

	const open = editing
		? !!error
		: !!failure &&
			!edit.saving &&
			!dismissed &&
			(fresh || hovered || focused || inside)

	function focusFirst() {
		content.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus()
	}
	function enter() {
		setDismissed(false)
		setFresh(true)
		if (content.current) focusFirst()
		else focusOnOpen.current = true
	}
	function back() {
		setDismissed(true)
		setInside(false)
		anchor.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus()
	}
	function leaveSoon() {
		clearTimeout(leaveTimer.current)
		leaveTimer.current = setTimeout(() => {
			setHovered(false)
			setInside(false)
		}, 150)
	}

	return (
		<ErrorIdContext.Provider value={error ? errorId : undefined}>
			<Popover
				open={open}
				onOpenChange={next => {
					// 外を押したら閉じる。
					if (!next && !editing) {
						setFresh(false)
						setDismissed(true)
					}
				}}
			>
				<PopoverAnchor asChild>
					<div
						ref={anchor}
						className={cn('relative min-w-0', className)}
						onPointerEnter={event => {
							if (event.pointerType !== 'mouse') return
							clearTimeout(leaveTimer.current)
							setDismissed(false)
							setHovered(true)
						}}
						onPointerLeave={event => {
							if (event.pointerType === 'mouse') leaveSoon()
						}}
						onFocus={() => setFocused(true)}
						onBlur={event => {
							const next = event.relatedTarget as Node | null
							if (next && event.currentTarget.contains(next)) return
							setFocused(false)
							if (!(next && content.current?.contains(next)))
								setDismissed(false)
						}}
						onKeyDown={event => {
							if (failure && !editing && event.key === 'ArrowDown') {
								event.preventDefault()
								enter()
							} else if (open && event.key === 'Escape') {
								event.preventDefault()
								setDismissed(true)
							}
						}}
					>
						{children}
						{error ? (
							<span id={errorId} className='sr-only'>
								{message}
								{failure ? ' 下矢印キーで、もう一度・直すへ移ります。' : null}
							</span>
						) : null}
						{error ? (
							// 失敗・確かめの理由をすぐ読み上げる（失敗するたびに読み直す）。
							<span
								key={failure ? failure.count : error}
								role='alert'
								className='sr-only'
							>
								{message}
							</span>
						) : null}
					</div>
				</PopoverAnchor>
				{error ? (
					<PopoverContent
						ref={content}
						side='bottom'
						align='start'
						sideOffset={2}
						className={cn(
							'border-destructive/40 p-0',
							failure ? 'w-72' : 'w-auto max-w-72',
						)}
						aria-label={failure ? title : error}
						onOpenAutoFocus={event => {
							event.preventDefault()
							if (focusOnOpen.current) focusFirst()
							focusOnOpen.current = false
						}}
						onCloseAutoFocus={event => event.preventDefault()}
						onEscapeKeyDown={event => {
							event.preventDefault()
							back()
						}}
						onPointerEnter={() => {
							clearTimeout(leaveTimer.current)
							setInside(true)
						}}
						onPointerLeave={leaveSoon}
						onFocus={() => setInside(true)}
						onBlur={event => {
							const next = event.relatedTarget as Node | null
							if (!(next && event.currentTarget.contains(next)))
								setInside(false)
						}}
						onKeyDown={event => {
							if (event.key !== 'Tab') return
							const list = Array.from(
								content.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [],
							)
							const active = document.activeElement
							if (
								(event.shiftKey && active === list[0]) ||
								(!event.shiftKey && active === list[list.length - 1])
							) {
								event.preventDefault()
								back()
							}
						}}
					>
						{failure ? (
							<div className='space-y-1.5 p-3 text-sm'>
								<p className='flex items-start gap-1.5 font-medium text-destructive'>
									<CircleAlert
										aria-hidden
										className='mt-0.5 h-4 w-4 shrink-0'
									/>
									{title}
								</p>
								{error ? (
									<p className='text-foreground text-xs'>{error}</p>
								) : null}
								<p className='text-muted-foreground text-xs'>{kept}</p>
								<div className='flex gap-2 pt-1.5'>
									<Button
										type='button'
										size='sm'
										variant='primary'
										onClick={() => {
											setDismissed(true)
											setInside(false)
											anchor.current
												?.querySelector<HTMLElement>(FOCUSABLE)
												?.focus()
											void edit.retry()
										}}
									>
										<RotateCcw aria-hidden />
										もう一度
									</Button>
									{canResume ? (
										<Button
											type='button'
											size='sm'
											variant='secondary'
											onClick={() => {
												setInside(false)
												edit.resume()
											}}
										>
											<Pencil aria-hidden />
											直す
										</Button>
									) : null}
								</div>
							</div>
						) : (
							<p className='flex items-center gap-1.5 px-2.5 py-1.5 text-destructive text-xs'>
								<CircleAlert aria-hidden className='h-3.5 w-3.5 shrink-0' />
								{error}
							</p>
						)}
					</PopoverContent>
				) : null}
			</Popover>
		</ErrorIdContext.Provider>
	)
}

/** 失敗や確かめの文言（セルの下に行を足して出す。セルの外で使うとき向け）。 */
export function DataTableInlineEditError({ error }: { error: string | null }) {
	return error ? (
		<p className='px-5 pb-2 text-destructive text-xs' role='alert'>
			{error}
		</p>
	) : null
}

/**
 * 編集中のセル。セルそのものが入力欄になる（表計算のように、枠や余白は足さず、外周の内側に線を 1 本）。
 * 文字の位置と大きさは表示のときと同じ。右端に印の場所を空けておくので、直し始めても文字が動かない。
 */
export const DataTableEditingCell = forwardRef<
	HTMLDivElement,
	HTMLAttributes<HTMLDivElement> & {
		error?: string | null
		align?: 'start' | 'end'
		/**
		 * 表示のときの中身。見えないまま同じ場所に置き、列の幅を表示のときと同じに保つ。
		 * 入力欄そのものは列の幅に効かないので、編集に入っても出ても、列の幅とほかの列の位置が動かない。
		 */
		sizer?: ReactNode
	}
>(function DataTableEditingCell(
	{ error = null, align = 'start', sizer, children, className, ...props },
	ref,
) {
	const density = useDataTableDensity()
	const size = dataTableDensityStyles[density]
	return (
		<div
			{...props}
			ref={ref}
			className={cn(
				dataTableInlineEditCellClassName(density),
				'relative bg-background ring-2 ring-inset',
				error ? 'ring-destructive' : 'ring-ring',
				className,
			)}
		>
			{sizer !== undefined ? (
				// 表示のときと同じ形（同じ文字を見えないまま置く）にして、表の列の幅の決まり方を変えない。
				// 入力欄はその上に重ねるので、列の幅には効かない。
				<span
					className={cn(
						'min-w-0 flex-1 truncate',
						align === 'end' && 'text-right tabular-nums',
					)}
				>
					<span aria-hidden className='invisible'>
						{sizer}
					</span>
					<span
						className={cn(
							// セルの文字の場所に重ねる（左は余白の内側。右揃えは表示の文字の右端にそろえる）。
							// 左揃えの入力欄は、編集中は空いている右端の印の場所まで使う（文字の左端は動かない）。
							'absolute inset-y-0 flex items-center',
							size.overlayLeft,
							align === 'end'
								? cn(
										size.overlayRightEnd,
										'justify-end text-right tabular-nums',
									)
								: size.overlayRight,
						)}
					>
						{children}
					</span>
				</span>
			) : (
				<span
					className={cn(
						'flex min-w-0 flex-1',
						align === 'end' && 'justify-end text-right tabular-nums',
					)}
				>
					{children}
				</span>
			)}
			<DataTableInlineEditStatusIcon status='idle' />
		</div>
	)
})

export type DataTableEditableCellProps<T> = DataTableInlineEditOptions<T> & {
	/** セルを押す所の読み上げ名（例「商品Aの品名を変更」）。 */
	ariaLabel: string
	/** 表示のときの中身。 */
	renderValue: (value: T) => ReactNode
	/** 編集のときの中身。`save` で保存し、`cancel` でやめる。 */
	renderEditor: (editor: DataTableInlineEdit<T>) => ReactNode
	/** 値を右に寄せる（数・金額など）。 */
	align?: 'start' | 'end'
	/** 何の値か（例「品目名」「単価」）。失敗の知らせの見出しに使う。 */
	label?: string
	/** 値を人が読む文字にする。失敗の知らせに使う。 */
	formatValue?: (value: T) => string
	className?: string
}

/**
 * 押すと編集に変わるセルの土台。保存の流れは `useDataTableInlineEdit` が持つ。
 * 編集中はセルそのものが入力欄になり、高さ・文字の位置は表示のときと変わらない。
 * 編集を Enter・Esc で終えたら、セルにフォーカスを戻す（キーボードだけで続けて直せる）。
 */
export function DataTableEditableCell<T>({
	ariaLabel,
	renderValue,
	renderEditor,
	align = 'start',
	label,
	formatValue,
	className,
	...options
}: DataTableEditableCellProps<T>) {
	const edit = useDataTableInlineEdit(options)
	const trigger = useRef<HTMLButtonElement>(null)
	const wasEditing = useRef(false)
	// Enter・Esc で終えたときだけセルにフォーカスを戻す。Tab やクリックでほかへ移ったときは戻さない。
	const restoreFocus = useRef(false)
	useEffect(() => {
		if (wasEditing.current && !edit.editing && restoreFocus.current)
			trigger.current?.focus()
		if (!edit.editing) restoreFocus.current = false
		wasEditing.current = edit.editing
	}, [edit.editing])

	return (
		<DataTableInlineEditShell
			edit={edit}
			label={label}
			formatValue={formatValue}
			className={className}
		>
			{edit.editing ? (
				<DataTableEditingCell
					error={edit.error}
					align={align}
					sizer={renderValue(edit.value)}
					onKeyDownCapture={event => {
						if (event.key === 'Enter' || event.key === 'Escape')
							restoreFocus.current = true
					}}
					onBlur={() => {
						restoreFocus.current = false
					}}
				>
					{renderEditor(edit)}
				</DataTableEditingCell>
			) : (
				<DataTableInlineEditTrigger
					ref={trigger}
					aria-label={ariaLabel}
					status={edit.status}
					error={edit.error}
					saving={edit.saving}
					disabled={edit.disabled}
					align={align}
					onClick={edit.startEditing}
				>
					{renderValue(edit.value)}
				</DataTableInlineEditTrigger>
			)}
		</DataTableInlineEditShell>
	)
}

/**
 * 表示のときのセル（押すと編集・候補が開く）。中身は左、印はいつも右端。
 * 候補が開いている間（`data-state=open`）も、外周の内側に線を 1 本出す。
 */
export const DataTableInlineEditTrigger = forwardRef<
	HTMLButtonElement,
	ButtonHTMLAttributes<HTMLButtonElement> & {
		status: DataTableInlineEditStatus
		error?: string | null
		saving?: boolean
		align?: 'start' | 'end'
	}
>(function DataTableInlineEditTrigger(
	{
		status,
		error = null,
		saving = false,
		align = 'start',
		disabled,
		className,
		children,
		...props
	},
	ref,
) {
	const errorId = useDataTableInlineEditErrorId()
	const density = useDataTableDensity()
	return (
		<button
			ref={ref}
			type='button'
			aria-busy={saving}
			aria-disabled={disabled || saving}
			aria-describedby={errorId}
			disabled={disabled}
			{...props}
			className={cn(
				dataTableInlineEditTriggerClassName(density),
				'data-[state=open]:ring-2 data-[state=open]:ring-inset data-[state=open]:ring-ring',
				error && dataTableInlineEditErrorClassName,
				className,
			)}
		>
			<span
				className={cn(
					'min-w-0 flex-1 truncate',
					align === 'end' && 'text-right tabular-nums',
				)}
			>
				{children}
			</span>
			<DataTableInlineEditStatusIcon status={status} error={error} />
		</button>
	)
})

export type DataTableInputEditorProps<T> = Omit<
	InputHTMLAttributes<HTMLInputElement>,
	'value' | 'defaultValue' | 'onChange' | 'onBlur' | 'onKeyDown'
> & {
	edit: DataTableInlineEdit<T>
	/** 編集を始めたときの文字。 */
	initialText: string
	/** 入れた文字を値に直す。だめなら `{ error }` を返す。 */
	parse: (text: string) => { value: T } | { error: string }
	/** 入れている文字が変わるたびに呼ばれる（直す前に、何が変わるかを見せるときなど）。 */
	onTextChange?: (text: string) => void
}

/**
 * 1 行の入力欄で編集する。枠や余白の無い入力欄で、セルそのものに打ち込む見た目になる。
 * Enter で保存、Esc でやめる。ほかへ移ったとき（Tab など）も保存する。確かめで止まったら元の値のまま理由を出す。
 */
export function DataTableInputEditor<T>({
	edit,
	initialText,
	parse,
	onTextChange,
	className,
	...props
}: DataTableInputEditorProps<T>) {
	const [text, setText] = useState(initialText)
	useEffect(() => {
		onTextChange?.(initialText)
		// 始めたときの文字を 1 度だけ知らせる。
	}, [])
	const done = useRef(false)
	const errorId = useDataTableInlineEditErrorId()
	async function commit(leaving: boolean) {
		const parsed = parse(text)
		if ('error' in parsed) {
			edit.reject(parsed.error)
			if (leaving) edit.cancel()
			return
		}
		done.current = true
		const accepted = await edit.save(parsed.value)
		if (!accepted) {
			done.current = false
			if (leaving) edit.cancel()
		}
	}
	return (
		<input
			// biome-ignore lint/a11y/noAutofocus: セルを押して編集を始めたら、すぐ打ち込めるようにするため
			autoFocus
			{...props}
			value={text}
			aria-invalid={edit.error ? true : undefined}
			aria-describedby={edit.error ? errorId : props['aria-describedby']}
			className={cn(
				'h-5 w-full min-w-0 border-0 bg-transparent p-0 text-foreground text-sm leading-5 outline-none placeholder:text-subtle-foreground',
				className,
			)}
			onFocus={event => event.currentTarget.select()}
			onChange={event => {
				setText(event.target.value)
				onTextChange?.(event.target.value)
			}}
			onKeyDown={event => {
				if (event.key === 'Enter') {
					event.preventDefault()
					void commit(false)
				} else if (event.key === 'Escape') {
					event.preventDefault()
					event.stopPropagation()
					done.current = true
					edit.cancel()
				}
			}}
			onBlur={() => {
				if (!done.current) void commit(true)
			}}
		/>
	)
}
