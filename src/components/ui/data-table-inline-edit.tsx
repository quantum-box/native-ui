import { Check, Loader2 } from 'lucide-react'
import {
	type ReactNode,
	useCallback,
	useEffect,
	useId,
	useRef,
	useState,
} from 'react'

import { cn } from '../../lib/utils'
import { Input, type InputProps } from './input'

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

/** 保存中・保存できたの印。読み上げにも伝える。 */
export function DataTableInlineEditStatusIcon({
	status,
}: {
	status: DataTableInlineEditStatus
}) {
	return (
		<span className='w-4 shrink-0 text-muted-foreground' role='status'>
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
			) : null}
		</span>
	)
}

/** 失敗や確かめの文言。 */
export function DataTableInlineEditError({ error }: { error: string | null }) {
	return error ? (
		<p className='px-5 pb-2 text-destructive text-xs' role='alert'>
			{error}
		</p>
	) : null
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
		<div className={cn('min-w-0', className)}>
			{edit.editing ? (
				<div
					className='flex min-h-[52px] items-center px-3 py-2'
					onKeyDownCapture={event => {
						if (event.key === 'Enter' || event.key === 'Escape')
							restoreFocus.current = true
					}}
					onBlur={() => {
						restoreFocus.current = false
					}}
				>
					{renderEditor(edit)}
				</div>
			) : (
				<button
					ref={trigger}
					type='button'
					aria-label={ariaLabel}
					aria-busy={edit.saving}
					aria-disabled={edit.disabled || edit.saving}
					disabled={edit.disabled}
					onClick={edit.startEditing}
					className={cn(
						'flex min-h-[52px] w-full items-center gap-2 px-5 py-2 text-left outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent',
						align === 'end' && 'flex-row-reverse text-right',
					)}
				>
					<span
						className={cn(
							'min-w-0 flex-1 truncate',
							align === 'end' && 'tabular-nums',
						)}
					>
						{renderValue(edit.value)}
					</span>
					<DataTableInlineEditStatusIcon status={edit.status} />
				</button>
			)}
			{edit.editing ? null : <DataTableInlineEditError error={edit.error} />}
		</div>
	)
}

export type DataTableInputEditorProps<T> = Omit<
	InputProps,
	'value' | 'defaultValue' | 'onChange' | 'onBlur' | 'onKeyDown'
> & {
	edit: DataTableInlineEdit<T>
	/** 編集を始めたときの文字。 */
	initialText: string
	/** 入れた文字を値に直す。だめなら `{ error }` を返す。 */
	parse: (text: string) => { value: T } | { error: string }
}

/**
 * 1 行の入力欄で編集する。Enter で保存、Esc でやめる。
 * ほかへ移ったとき（Tab など）も保存する。確かめで止まったら元の値のまま理由を出す。
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
	const errorId = useId()
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
		<div className='w-full'>
			<Input
				autoFocus
				{...props}
				value={text}
				aria-invalid={edit.error ? true : undefined}
				aria-describedby={edit.error ? errorId : undefined}
				className={cn('h-8', className)}
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
			{edit.error ? (
				<p id={errorId} className='mt-1 text-destructive text-xs' role='alert'>
					{edit.error}
				</p>
			) : null}
		</div>
	)
}
