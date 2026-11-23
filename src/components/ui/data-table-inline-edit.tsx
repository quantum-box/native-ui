import { Check, CircleAlert, Loader2 } from 'lucide-react'
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
	useRef,
	useState,
} from 'react'

import { cn } from '../../lib/utils'
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from './tooltip'

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
	const saving = useRef(false)

	/** 編集を始める。直せないときや保存中は何もしない。 */
	const startEditing = useCallback(() => {
		if (disabled || saving.current) return false
		setError(null)
		setEditing(true)
		return true
	}, [disabled])

	/** 編集をやめる（保存しない）。 */
	const cancel = useCallback(() => {
		setEditing(false)
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
			setPending({ value: next })
			setStatus('saving')
			setError(null)
			try {
				await onSave(next)
				setStatus('saved')
			} catch (cause) {
				setStatus('idle')
				setError(formatError(cause))
			} finally {
				setPending(null)
				saving.current = false
			}
			return true
		},
		[disabled, equals, formatError, onSave, validate, value],
	)

	return {
		/** 表示する値。保存中は新しい値を先に見せる。 */
		value: pending ? pending.value : value,
		editing,
		status,
		error,
		saving: status === 'saving',
		disabled,
		startEditing,
		cancel,
		reject,
		save,
	}
}

export type DataTableInlineEdit<T> = ReturnType<
	typeof useDataTableInlineEdit<T>
>

/**
 * その場で直すセルの箱。表示・編集中・保存中・保存できた・失敗のどれでも、
 * 高さ・余白・文字の位置が同じになるように、どのセルもこの形を使う。
 */
export const dataTableInlineEditCellClassName =
	'flex min-h-[52px] w-full items-center gap-2 px-5 py-2 text-left text-sm outline-none'

/** 押せるセル（表示のとき）の見た目。フォーカスの線はセルの内側に 1 本。 */
export const dataTableInlineEditTriggerClassName = `${dataTableInlineEditCellClassName} hover:bg-muted focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent`

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
	return (
		<span
			className='flex w-4 shrink-0 justify-end text-muted-foreground'
			role='status'
		>
			{status === 'saving' ? (
				<>
					<Loader2 aria-hidden className='h-3.5 w-3.5 animate-spin' />
					<span className='sr-only'>保存中</span>
				</>
			) : status === 'saved' ? (
				<>
					<Check aria-hidden className='h-3.5 w-3.5' />
					<span className='sr-only'>保存済み</span>
				</>
			) : error ? (
				<CircleAlert aria-hidden className='h-3.5 w-3.5 text-destructive' />
			) : null}
		</span>
	)
}

const ErrorIdContext = createContext<string | undefined>(undefined)

/** セルの中から、理由の文言の ID を読む（`aria-describedby` に使う）。 */
export function useDataTableInlineEditErrorId() {
	return useContext(ErrorIdContext)
}

/**
 * セルの外側。失敗や確かめの理由を、セルの大きさを変えずに出す。
 * 理由はセルの下に小さな吹き出しで出す（触れる・フォーカスする・編集中のとき）。読み上げにはすぐ伝える。
 */
export function DataTableInlineEditShell({
	error,
	editing = false,
	className,
	children,
}: {
	error: string | null
	editing?: boolean
	className?: string
	children: ReactNode
}) {
	const errorId = useId()
	const [hovered, setHovered] = useState(false)
	const [focused, setFocused] = useState(false)
	const open = !!error && (hovered || focused || editing)
	return (
		<ErrorIdContext.Provider value={error ? errorId : undefined}>
			<TooltipProvider delayDuration={0}>
				<Tooltip open={open}>
					<TooltipTrigger asChild>
						<div
							className={cn('relative min-w-0', className)}
							onPointerEnter={() => setHovered(true)}
							onPointerLeave={() => setHovered(false)}
							onFocus={() => setFocused(true)}
							onBlur={event => {
								if (!event.currentTarget.contains(event.relatedTarget as Node))
									setFocused(false)
							}}
						>
							{children}
							{error ? (
								<span id={errorId} role='alert' className='sr-only'>
									{error}
								</span>
							) : null}
						</div>
					</TooltipTrigger>
					{error ? (
						<TooltipContent
							side='bottom'
							align='start'
							sideOffset={2}
							aria-hidden
							className='max-w-72 bg-destructive text-destructive-foreground'
						>
							{error}
						</TooltipContent>
					) : null}
				</Tooltip>
			</TooltipProvider>
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
export function DataTableEditingCell({
	error = null,
	align = 'start',
	children,
	className,
	...props
}: HTMLAttributes<HTMLDivElement> & {
	error?: string | null
	align?: 'start' | 'end'
}) {
	return (
		<div
			{...props}
			className={cn(
				dataTableInlineEditCellClassName,
				'bg-background ring-2 ring-inset',
				error ? 'ring-destructive' : 'ring-ring',
				className,
			)}
		>
			<span
				className={cn(
					'flex min-w-0 flex-1',
					align === 'end' && 'justify-end text-right tabular-nums',
				)}
			>
				{children}
			</span>
			<DataTableInlineEditStatusIcon status='idle' />
		</div>
	)
}

export type DataTableEditableCellProps<T> = DataTableInlineEditOptions<T> & {
	/** セルを押す所の読み上げ名（例「商品Aの品名を変更」）。 */
	ariaLabel: string
	/** 表示のときの中身。 */
	renderValue: (value: T) => ReactNode
	/** 編集のときの中身。`save` で保存し、`cancel` でやめる。 */
	renderEditor: (editor: DataTableInlineEdit<T>) => ReactNode
	/** 値を右に寄せる（数・金額など）。 */
	align?: 'start' | 'end'
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
			error={edit.error}
			editing={edit.editing}
			className={className}
		>
			{edit.editing ? (
				<DataTableEditingCell
					error={edit.error}
					align={align}
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
				dataTableInlineEditTriggerClassName,
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
}

/**
 * 1 行の入力欄で編集する。枠や余白の無い入力欄で、セルそのものに打ち込む見た目になる。
 * Enter で保存、Esc でやめる。ほかへ移ったとき（Tab など）も保存する。確かめで止まったら元の値のまま理由を出す。
 */
export function DataTableInputEditor<T>({
	edit,
	initialText,
	parse,
	className,
	...props
}: DataTableInputEditorProps<T>) {
	const [text, setText] = useState(initialText)
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
			aria-describedby={edit.error ? errorId : undefined}
			className={cn(
				'h-5 w-full min-w-0 border-0 bg-transparent p-0 text-foreground text-sm leading-5 outline-none placeholder:text-subtle-foreground',
				className,
			)}
			onFocus={event => event.currentTarget.select()}
			onChange={event => setText(event.target.value)}
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
