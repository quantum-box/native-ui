import { Lock, PenLine, RotateCcw, Sigma } from 'lucide-react'
import {
	type ReactNode,
	forwardRef,
	useEffect,
	useId,
	useRef,
	useState,
} from 'react'

import { cn } from '../../lib/utils'
import { Button } from './button'
import {
	useDataTableDensity,
	useDataTableDensityStyles,
} from './data-table-density'
import {
	DataTableEditingCell,
	DataTableInlineEditShell,
	DataTableInlineEditTrigger,
	DataTableInputEditor,
	dataTableInlineEditCellClassName,
	useDataTableInlineEdit,
} from './data-table-inline-edit'
import {
	type DataTableNumberFormat,
	formatDataTableNumber,
	parseDataTableNumber,
} from './data-table-number-cell'
import { HoverPeek, type HoverPeekTriggerProps } from './hover-peek'
import { Popover, PopoverAnchor, PopoverContent } from './popover'

// ---- 式 ---------------------------------------------------------------------

/** 式の中の項目（例 単価 ¥380）。 */
export type DataTableFormulaTerm = {
	/** 項目の名前（例「単価」）。 */
	label: string
	value: number
	/** 数の出し方（`¥`・`個`・小数の桁）。 */
	format?: DataTableNumberFormat
	/** 押すと移るセルの読み上げ名（そのセルの `ariaLabel`）。渡すと、式の中の項目を押してそのセルへ移れる。 */
	cellLabel?: string
}
export type DataTableFormulaOperator = '×' | '÷' | '+' | '−'
/** 項目と演算の並び。例 `[{ label: '単価', value: 380, format: { prefix: '¥' } }, '×', { label: '数量', value: 24, format: { suffix: '個' } }]`。 */
export type DataTableFormula = readonly (
	| DataTableFormulaTerm
	| DataTableFormulaOperator
)[]

const isTerm = (
	part: DataTableFormulaTerm | DataTableFormulaOperator,
): part is DataTableFormulaTerm => typeof part === 'object'

/** 式を計算する（× ÷ を先に）。 */
export function evaluateDataTableFormula(formula: DataTableFormula) {
	const values: number[] = []
	const ops: DataTableFormulaOperator[] = []
	for (const part of formula) {
		if (isTerm(part)) {
			const last = ops[ops.length - 1]
			if (last === '×' || last === '÷') {
				ops.pop()
				const left = values.pop() ?? 0
				values.push(last === '×' ? left * part.value : left / part.value)
			} else values.push(part.value)
		} else ops.push(part)
	}
	let total = values[0] ?? 0
	for (let index = 0; index < ops.length; index += 1)
		total =
			ops[index] === '+' ? total + values[index + 1] : total - values[index + 1]
	return total
}

/** 端数の扱い。 */
export type DataTableRounding = 'round' | 'floor' | 'ceil'

/** 小数の桁にそろえる（端数の扱いを選べる）。 */
export function roundDataTableNumber(
	value: number,
	fractionDigits = 0,
	rounding: DataTableRounding = 'round',
) {
	const scale = 10 ** fractionDigits
	// 小数の誤差（例 1.005 × 100 = 100.4999…）をならしてから丸める。
	const scaled = Number((value * scale).toFixed(8))
	const rounded =
		rounding === 'floor'
			? Math.floor(scaled)
			: rounding === 'ceil'
				? Math.ceil(scaled)
				: Math.round(scaled)
	return rounded / scale
}

const ROUNDING_TEXT: Record<DataTableRounding, string> = {
	round: '四捨五入して',
	floor: '切り捨てて',
	ceil: '切り上げて',
}

function termText(term: DataTableFormulaTerm) {
	return formatDataTableNumber(term.value, term.format)
}

/** 式を 1 行の文にする（読み上げ用）。例「単価 ¥380 × 数量 24個 = ¥9,120」。 */
export function formulaText(
	formula: DataTableFormula,
	result: string,
	withLabels = true,
) {
	return `${formula
		.map(part =>
			isTerm(part)
				? withLabels
					? `${part.label} ${termText(part)}`
					: termText(part)
				: part,
		)
		.join(' ')} = ${result}`
}

/** 式を出す。項目に `cellLabel` があれば、押すとそのセルへ移る。 */
function FormulaLine({
	formula,
	result,
	onJump,
}: {
	formula: DataTableFormula
	result: string
	onJump: (cellLabel: string) => void
}) {
	return (
		<p className='flex flex-wrap items-end gap-x-1.5 gap-y-1 tabular-nums'>
			{formula.map((part, index) =>
				isTerm(part) ? (
					<span
						// 式の並びは変わらないので、場所を見分けに使う。
						key={index}
						className='inline-flex flex-col items-start leading-tight'
					>
						<span className='text-[11px] text-muted-foreground'>
							{part.label}
						</span>
						{part.cellLabel ? (
							<button
								type='button'
								className='rounded-sm font-medium text-primary underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
								aria-label={`${part.label} ${termText(part)}（そのセルへ移る）`}
								onClick={() => part.cellLabel && onJump(part.cellLabel)}
							>
								{termText(part)}
							</button>
						) : (
							<span className='font-medium'>{termText(part)}</span>
						)}
					</span>
				) : (
					<span key={index} className='pb-px text-muted-foreground'>
						{part}
					</span>
				),
			)}
			<span className='pb-px text-muted-foreground'>=</span>
			<span className='pb-px font-semibold'>{result}</span>
		</p>
	)
}

// ---- 読むだけのセル ------------------------------------------------------------

/** 読むだけのセルの箱。触れても背景は変わらず、押せる形（カーソル）にもならない。 */
const ReadOnlyBox = forwardRef<
	HTMLSpanElement,
	Omit<Partial<HoverPeekTriggerProps>, 'ref'> & {
		align?: 'start' | 'end'
		icon?: ReactNode
		children: ReactNode
		className?: string
		tabIndex?: number
		'aria-label'?: string
		role?: string
	}
>(function ReadOnlyBox(
	{ align = 'end', icon, children, className, ...props },
	ref,
) {
	const density = useDataTableDensity()
	const size = useDataTableDensityStyles()
	return (
		<span
			{...props}
			ref={ref}
			className={cn(
				dataTableInlineEditCellClassName(density),
				'cursor-default text-muted-foreground focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring',
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
			<span className={cn('flex shrink-0 justify-end', size.slot)} aria-hidden>
				{icon}
			</span>
		</span>
	)
})

export type DataTableReadOnlyCellProps = {
	/** セルの読み上げ名（例「L-1の金額」）。 */
	ariaLabel: string
	/** 出す値。 */
	children: ReactNode
	/** 直せない理由（例「直す権限がありません」）。触れると出る。 */
	reason: string
	align?: 'start' | 'end'
	className?: string
}

/**
 * 直せないセル（権限が無いなど）。直せるセルと違い、触れても背景は変わらず、押せる形にもならない。
 * 右端に鍵の印を出し、触れる・フォーカスすると理由が出る。
 */
export function DataTableReadOnlyCell({
	ariaLabel,
	children,
	reason,
	align = 'start',
	className,
}: DataTableReadOnlyCellProps) {
	const size = useDataTableDensityStyles()
	return (
		<HoverPeek
			label={`${ariaLabel}: ${reason}`}
			hint={reason}
			width='w-64'
			renderTrigger={props => (
				<ReadOnlyBox
					{...props}
					role='group'
					tabIndex={0}
					aria-label={`${ariaLabel}（直せません）`}
					align={align}
					className={className}
					icon={<Lock className={size.icon} />}
				>
					{children}
				</ReadOnlyBox>
			)}
		>
			<p className='flex items-start gap-1.5 p-3 text-sm'>
				<Lock aria-hidden className='mt-0.5 h-3.5 w-3.5 shrink-0' />
				{reason}
			</p>
		</HoverPeek>
	)
}

// ---- 計算した値のセル ----------------------------------------------------------

/** 逆算: 計算した値を直すと、決めた項目を計算し直す（例 金額を直すと単価を計算し直す）。 */
export type DataTableComputedReverse = {
	/** 計算し直す項目（式の中の項目の順番。0 から数える）。 */
	term: number
	/** 計算した値から、その項目の値を出す（例 `total => total / 数量`）。 */
	solve: (total: number) => number
	/** 割り切れないときの端数の扱い。既定は四捨五入。桁は項目の `format.fractionDigits`。 */
	rounding?: DataTableRounding
	/** 計算し直した項目の値を保存する。失敗したら例外を投げる。 */
	onSave: (value: number) => Promise<void>
}

/** 上書き: 計算をやめて、値を手で決める。`null` を保存すると計算に戻す。 */
export type DataTableComputedOverride = {
	/** 手で決めた値。計算のままなら `null`。 */
	value: number | null
	onSave: (value: number | null) => Promise<void>
}

export type DataTableComputedCellProps = {
	/** セルの読み上げ名（例「L-1の金額」）。 */
	ariaLabel: string
	/** 何の値か（例「金額」）。 */
	label?: string
	/** 計算した値。 */
	value: number | null
	/** 値の出し方（`¥`・小数の桁など）。式の結果にも使う。 */
	format?: DataTableNumberFormat
	/** 式。触れると、実際の数を入れた式を出す。 */
	formula?: DataTableFormula
	/** 一言の注意（端数の扱い・税込み／税抜きなど）。 */
	note?: string
	/** なぜ直せない・どう変わるかの説明。既定は式から作る。 */
	reason?: string
	/** 逆算で直せるようにする。 */
	reverse?: DataTableComputedReverse
	/** 上書きで直せるようにする。 */
	override?: DataTableComputedOverride
	formatError?: (error: unknown) => string
	/** 空のときの表示。 */
	emptyLabel?: string
	className?: string
}

function termsOf(formula: DataTableFormula | undefined) {
	return (formula ?? []).filter(isTerm)
}

function jumpTo(from: HTMLElement | null, cellLabel: string) {
	const scope = from?.closest('table') ?? document
	const target = scope.querySelector<HTMLElement>(
		`[aria-label="${CSS.escape(cellLabel)}"]`,
	)
	target?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' })
	target?.focus()
}

/**
 * 計算した値を出すセル（例 金額 = 単価 × 数量）。
 *
 * - 値の左に「計算」の印（Σ）を出す。触れる・フォーカスすると、実際の数を入れた式
 *   （例「¥380 × 24個 = ¥9,120」）と、一言の注意が出る。式の中の項目を押すと、その列のセルへ移る。
 * - 何も渡さなければ読むだけ。触れても背景は変わらず、押せる形にもならない。
 * - `reverse` を渡すと、値を直すと決めた項目を計算し直す（逆算）。
 * - `override` を渡すと、計算をやめて手で値を決められる（「手入力」の印。式の枠の「計算に戻す」で戻せる）。
 * - 直している間は、何が変わるかを先に見せる（例「単価が ¥380 → ¥400 になります」）。
 */
export function DataTableComputedCell(props: DataTableComputedCellProps) {
	return props.reverse || props.override ? (
		<EditableComputedCell {...props} />
	) : (
		<ReadOnlyComputedCell {...props} />
	)
}

function useComputedTexts({
	label,
	value,
	format,
	formula,
	note,
	reason,
	reverse,
	override,
	emptyLabel = '—',
}: DataTableComputedCellProps) {
	const terms = termsOf(formula)
	const names = terms.map(term => term.label)
	const computed = formula ? evaluateDataTableFormula(formula) : value
	const shown = override?.value ?? value
	const result =
		computed === null ? emptyLabel : formatDataTableNumber(computed, format)
	const target = reverse ? terms[reverse.term] : undefined
	const explanation =
		reason ??
		(reverse && target
			? `${label ?? 'この値'}を直すと、${target.label}を計算し直します。`
			: override
				? `${label ?? 'この値'}を直すと、計算をやめて手で決めた値になります。`
				: names.length
					? `${names.join('と')}から計算しています。${names.join('か')}を直すと変わります。`
					: '計算した値です。')
	const spoken = formula
		? `${formulaText(formula, result)}。${note ?? ''}`
		: explanation
	return {
		terms,
		target,
		computed,
		shown,
		result,
		explanation,
		spoken,
		text: shown === null ? emptyLabel : formatDataTableNumber(shown, format),
	}
}

function FormulaCard({
	props,
	texts,
	anchor,
	onRevert,
}: {
	props: DataTableComputedCellProps
	texts: ReturnType<typeof useComputedTexts>
	anchor: { current: HTMLElement | null }
	onRevert?: () => void
}) {
	const manual = props.override && props.override.value !== null
	return (
		<div className='space-y-2 p-3 text-sm'>
			<p className='flex items-center gap-1.5 text-muted-foreground text-xs'>
				<Sigma aria-hidden className='h-3.5 w-3.5' />
				{props.label ? `${props.label}は計算した値です` : '計算した値です'}
				{manual ? (
					<span className='rounded-sm bg-warning/15 px-1 text-[11px] text-foreground'>
						手入力
					</span>
				) : null}
			</p>
			{props.formula ? (
				<FormulaLine
					formula={props.formula}
					result={texts.result}
					onJump={cellLabel => jumpTo(anchor.current, cellLabel)}
				/>
			) : null}
			{manual ? (
				<p className='text-xs'>
					手で決めた値（{texts.text}）を出しています。計算では {texts.result}{' '}
					です。
				</p>
			) : null}
			{props.note ? (
				<p className='text-muted-foreground text-xs'>※ {props.note}</p>
			) : null}
			<p className='text-muted-foreground text-xs'>{texts.explanation}</p>
			{manual && onRevert ? (
				<Button type='button' size='sm' variant='secondary' onClick={onRevert}>
					<RotateCcw aria-hidden />
					計算に戻す
				</Button>
			) : null}
		</div>
	)
}

function ReadOnlyComputedCell(props: DataTableComputedCellProps) {
	const texts = useComputedTexts(props)
	const anchor = useRef<HTMLElement | null>(null)
	const size = useDataTableDensityStyles()
	return (
		<HoverPeek
			label={`${props.ariaLabel}の式`}
			hint={`${texts.spoken} 下矢印キーで、式の項目へ移ります。`}
			width='w-72'
			renderTrigger={triggerProps => (
				<ReadOnlyBox
					{...triggerProps}
					ref={node => {
						anchor.current = node
						triggerProps.ref(node)
					}}
					role='group'
					tabIndex={0}
					aria-label={`${props.ariaLabel}（計算した値・直せません）`}
					className={props.className}
				>
					<span className='inline-flex items-center gap-1.5'>
						<Sigma aria-hidden className={cn(size.icon, 'shrink-0')} />
						{texts.text}
					</span>
				</ReadOnlyBox>
			)}
		>
			<FormulaCard props={props} texts={texts} anchor={anchor} />
		</HoverPeek>
	)
}

function EditableComputedCell(props: DataTableComputedCellProps) {
	const { reverse, override, format, label } = props
	const texts = useComputedTexts(props)
	const anchor = useRef<HTMLElement | null>(null)
	const size = useDataTableDensityStyles()
	const previewId = useId()
	const [typed, setTyped] = useState('')
	const wasEditing = useRef(false)
	const target = texts.target
	const fractionDigits = target?.format?.fractionDigits ?? 0

	const edit = useDataTableInlineEdit<number | null>({
		value: texts.shown,
		formatError: props.formatError,
		onSave: async next => {
			if (override) return override.onSave(next)
			if (reverse && next !== null)
				return reverse.onSave(
					roundDataTableNumber(
						reverse.solve(next),
						fractionDigits,
						reverse.rounding,
					),
				)
		},
	})

	// 編集を Enter・Esc で終えてフォーカスが消えたら、セルに戻す（続けて ↓ で式へ移れる）。
	useEffect(() => {
		if (wasEditing.current && !edit.editing) {
			const active = document.activeElement
			if (!active || active === document.body) anchor.current?.focus()
		}
		wasEditing.current = edit.editing
	}, [edit.editing])

	// 直している間に、何が変わるかを先に見せる。
	let preview: string | null = null
	const parsed = typed
		? parseDataTableNumber(typed, { ...format, allowEmpty: true })
		: null
	if (edit.editing && parsed && 'value' in parsed && parsed.value !== null) {
		const next = parsed.value
		if (reverse && target && props.formula) {
			const solved = roundDataTableNumber(
				reverse.solve(next),
				fractionDigits,
				reverse.rounding,
			)
			const recomputed = evaluateDataTableFormula(
				props.formula.map(part =>
					part === target ? { ...target, value: solved } : part,
				),
			)
			const rounded = roundDataTableNumber(
				recomputed,
				format?.fractionDigits ?? 0,
				'round',
			)
			preview = `${target.label}が ${termText(target)} → ${formatDataTableNumber(solved, target.format)} になります。`
			if (rounded !== next)
				preview += ` 割り切れないため${ROUNDING_TEXT[reverse.rounding ?? 'round']}、${label ?? '計算した値'}は ${formatDataTableNumber(rounded, format)} になります。`
		} else if (override) {
			preview =
				override.value === null
					? `計算（${texts.result}）をやめて、${formatDataTableNumber(next, format)} を手で決めます。`
					: `手で決めた値を ${formatDataTableNumber(next, format)} にします（計算では ${texts.result}）。`
		}
	}

	const manual = override && override.value !== null
	const icon = manual ? (
		<PenLine aria-label='手入力' className={cn(size.icon, 'text-foreground')} />
	) : (
		<Sigma aria-hidden className={size.icon} />
	)
	const display = (
		<span className='inline-flex min-w-0 items-center justify-end gap-1.5'>
			{manual ? (
				<span className='rounded-sm bg-warning/15 px-1 text-[11px] text-foreground leading-4'>
					手入力
				</span>
			) : (
				<span aria-hidden className='text-muted-foreground'>
					{icon}
				</span>
			)}
			<span className='truncate'>{texts.text}</span>
		</span>
	)

	return (
		<DataTableInlineEditShell
			edit={edit}
			label={label}
			formatValue={value =>
				value === null ? texts.result : formatDataTableNumber(value, format)
			}
			className={props.className}
		>
			{edit.editing ? (
				<Popover open={!!preview && !edit.error}>
					<PopoverAnchor asChild>
						<DataTableEditingCell
							align='end'
							sizer={display}
							error={edit.error}
						>
							<DataTableInputEditor
								edit={edit}
								aria-label={props.ariaLabel}
								aria-describedby={preview ? previewId : undefined}
								inputMode={format?.fractionDigits ? 'decimal' : 'numeric'}
								className='text-right tabular-nums'
								initialText={formatDataTableNumber(edit.editValue, format)}
								onTextChange={setTyped}
								parse={text => parseDataTableNumber(text, format)}
							/>
						</DataTableEditingCell>
					</PopoverAnchor>
					<PopoverContent
						side='bottom'
						align='end'
						sideOffset={2}
						className='w-auto max-w-80 px-3 py-2 text-xs'
						onOpenAutoFocus={event => event.preventDefault()}
						onCloseAutoFocus={event => event.preventDefault()}
					>
						<p id={previewId} aria-live='polite'>
							{preview}
						</p>
					</PopoverContent>
				</Popover>
			) : edit.failure ? (
				<DataTableInlineEditTrigger
					aria-label={props.ariaLabel}
					status={edit.status}
					error={edit.error}
					saving={edit.saving}
					align='end'
					onClick={() => {
						setTyped('')
						edit.startEditing()
					}}
				>
					{display}
				</DataTableInlineEditTrigger>
			) : (
				<HoverPeek
					label={`${props.ariaLabel}の式`}
					hint={`${texts.spoken} 押すと直せます。下矢印キーで、式へ移ります。`}
					width='w-72'
					renderTrigger={triggerProps => (
						<DataTableInlineEditTrigger
							{...triggerProps}
							ref={node => {
								anchor.current = node
								triggerProps.ref(node)
							}}
							aria-label={props.ariaLabel}
							status={edit.status}
							error={edit.error}
							saving={edit.saving}
							align='end'
							onClick={() => {
								setTyped('')
								edit.startEditing()
							}}
						>
							{display}
						</DataTableInlineEditTrigger>
					)}
				>
					<FormulaCard
						props={props}
						texts={texts}
						anchor={anchor}
						onRevert={
							manual
								? () => {
										void edit.save(null)
									}
								: undefined
						}
					/>
				</HoverPeek>
			)}
		</DataTableInlineEditShell>
	)
}
