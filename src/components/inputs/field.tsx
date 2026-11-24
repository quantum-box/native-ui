'use client'

import * as React from 'react'

import { cn } from '../../lib/utils'
import { Label } from '../basics/label'

/**
 * 1 つの欄。ラベル・入力欄・説明・エラーを、上から決まった順に並べる。
 *
 * - 入力欄（children）には id と aria-describedby を付ける（付いていればそのまま使う）。
 * - 欄の箱は縮められる（min-w-0）。入力欄は箱の幅いっぱいで、箱の外へはみ出さない。
 * - FieldGroup の中に置くと、同じ行の欄の「ラベルの段・入力欄の段・説明の段」がそろう。
 *   ラベルが折り返したり、説明の有る欄と無い欄が並んだりしても、入力欄の上端がそろう。
 */
export interface FieldProps
	extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
	/** 欄の名前。 */
	label: React.ReactNode
	/** 入力欄の下に出す説明。 */
	description?: React.ReactNode
	/** 入力の誤り。出すと入力欄に aria-invalid を付け、説明の代わりに赤く出す。 */
	error?: React.ReactNode
	/** 入力欄の id。省くと作る。入力欄を div などで包んで渡すときは、中の入力欄にこの id を付ける。 */
	controlId?: string
	/** ラベルの横に「必須」を出す。 */
	required?: boolean
	/** 入力欄。1 つの要素（Input・Select・Textarea・それらを横に並べた箱など）。 */
	children: React.ReactNode
}

const CONTAINERS = new Set(['div', 'span', 'fieldset', 'section'])

type ControlProps = {
	id?: string
	'aria-describedby'?: string
	'aria-invalid'?: boolean | 'true' | 'false'
}

const Field = React.forwardRef<HTMLDivElement, FieldProps>(
	(
		{
			label,
			description,
			error,
			controlId,
			required,
			className,
			children,
			...props
		},
		ref,
	) => {
		const generated = React.useId()
		const only = React.Children.count(children) === 1
		const child =
			only && React.isValidElement<ControlProps>(children) ? children : null
		const id = controlId ?? child?.props.id ?? `${generated}-control`
		const noteId = `${id}-note`
		const hasNote = Boolean(error || description)
		const describedBy = [child?.props['aria-describedby'], hasNote && noteId]
			.filter(Boolean)
			.join(' ')
		// 入力欄を横に並べる箱（div など）を渡されたときは、箱に id を付けない。
		// 付けると中の入力欄の id と重なり、ラベルが箱を指してしまう。
		// 中の入力欄に controlId と同じ id を付けておけば、ラベルはそちらを指す。
		const container =
			typeof child?.type === 'string' && CONTAINERS.has(child.type)
		const control =
			child && !container
				? React.cloneElement(child, {
						id,
						'aria-describedby': describedBy || undefined,
						...(error ? { 'aria-invalid': true } : {}),
					})
				: children
		return (
			<div
				ref={ref}
				data-slot='field'
				data-invalid={error ? '' : undefined}
				className={cn(
					// 余りの高さは下に寄せる（既定の stretch だと、余りがラベルの段に入って入力欄が下がる）。
					// 段の間は gap でなく余白で空ける。説明もエラーも無い欄の下に空きを作らず、
					// 横に並べたボタンと入力欄の下端がそろうようにする
					'grid min-w-0 content-start gap-0',
					className,
				)}
				{...props}
			>
				<Label htmlFor={id} className='pb-1 leading-snug text-muted-foreground'>
					{label}
					{required ? (
						<span className='ml-1 text-destructive'>必須</span>
					) : null}
				</Label>
				<div data-slot='field-control' className='flex min-w-0 flex-col'>
					{control}
				</div>
				<div data-slot='field-note' className='min-w-0'>
					{error ? (
						<p
							id={noteId}
							role='alert'
							className='pt-1 text-xs text-destructive'
						>
							{error}
						</p>
					) : description ? (
						<p id={noteId} className='pt-1 text-xs text-muted-foreground'>
							{description}
						</p>
					) : null}
				</div>
			</div>
		)
	},
)
Field.displayName = 'Field'

export interface FieldGroupProps extends React.HTMLAttributes<HTMLDivElement> {
	/**
	 * いちばん多いときの列の数。箱が狭くなると（右の詳細の中など）、1 列が
	 * minColumnWidth を下回らないよう列を減らし、もっと狭ければ 1 列にする。
	 * 画面の幅ではなく、箱の幅で決まる。省くと、12rem ずつ入るだけ並べる。
	 */
	columns?: number
	/** 1 列のいちばん狭い幅（CSS の長さ）。既定は 10rem */
	minColumnWidth?: string
}

/**
 * 欄を横に並べる箱。同じ行の欄どうしで、ラベル・入力欄・説明の段の高さを共有する
 * （CSS の subgrid）。Field と FormItem のどちらを並べてもよい。
 *
 * 列の数は `columns` で決める（または className で `sm:grid-cols-2` などを決める）。
 * 欄でない物（ボタンの並びなど）は FieldActions に入れると、最後の 1 行を使う。
 */
const FieldGroup = React.forwardRef<HTMLDivElement, FieldGroupProps>(
	({ className, style, columns, minColumnWidth = '10rem', ...props }, ref) => (
		<div
			ref={ref}
			data-slot='field-group'
			className={cn(
				'grid min-w-0 gap-x-3 gap-y-3',
				columns === undefined &&
					'grid-cols-[repeat(auto-fill,minmax(min(100%,12rem),1fr))]',
				'[&>[data-slot=field]]:row-span-3 [&>[data-slot=field]]:grid-rows-subgrid [&>[data-slot=field]]:gap-y-0',
				className,
			)}
			style={
				columns === undefined
					? style
					: {
							// 広ければ columns 列ちょうど、狭ければ minColumnWidth を下回らない数、
							// もっと狭ければ 1 列（min(100%, …)）。列の間は gap-x-3（0.75rem）
							gridTemplateColumns: `repeat(auto-fill, minmax(min(100%, max(${minColumnWidth}, calc((100% - ${columns - 1} * 0.75rem) / ${columns}))), 1fr))`,
							...style,
						}
			}
			{...props}
		/>
	),
)
FieldGroup.displayName = 'FieldGroup'

/**
 * FieldGroup の最後に置くボタンの並び（保存・やめる など）。1 行を使い、右へ寄せる。
 * 狭い箱では折り返し、箱の外へはみ出さない。
 */
const FieldActions = React.forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
	<div
		ref={ref}
		data-slot='field-actions'
		className={cn(
			'col-span-full flex min-w-0 flex-wrap items-center justify-end gap-2',
			className,
		)}
		{...props}
	/>
))
FieldActions.displayName = 'FieldActions'

export interface InlineFieldProps
	extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
	/** 欄の名前。 */
	label: React.ReactNode
	/** 入力欄。1 つの要素。 */
	children: React.ReactNode
	/** 入力欄の id。省くと作る。入力欄を div などで包んで渡すときは、中の入力欄にこの id を付ける。 */
	controlId?: string
	/** 入力欄の後ろに置く物（「枚」「人」などの単位や、小さいチェック）。 */
	suffix?: React.ReactNode
	/** 小さい文字で詰めて出す（表の行の中、絞り込みの帯）。 */
	dense?: boolean
	/**
	 * 名前の列の幅（CSS の長さ。例 `12rem`）。渡すと名前の列の幅がそろう
	 * （設定の行を縦に何行も並べるとき）。狭い画面では名前を上、入力欄を下に積む。
	 */
	labelWidth?: string
}

/**
 * 横 1 行の欄。名前を左、入力欄を右に置く（「対象月 [　　]」「写真 [ 3 ] 枚」）。
 * 絞り込みの帯や、表の行の中の小さい欄に使う。縦に並べる欄は Field。
 *
 * 入力欄には id を付けて名前と結び付ける（付いていればそのまま使う）。欄は縮められ、
 * 入力欄が箱の外へはみ出さない。
 */
const InlineField = React.forwardRef<HTMLDivElement, InlineFieldProps>(
	(
		{
			label,
			children,
			controlId,
			suffix,
			dense = false,
			labelWidth,
			className,
			style,
			...props
		},
		ref,
	) => {
		const generated = React.useId()
		const only = React.Children.count(children) === 1
		const child =
			only && React.isValidElement<ControlProps>(children) ? children : null
		const id = controlId ?? child?.props.id ?? `${generated}-control`
		// 入力欄を並べる箱（div など）には id を付けない（中の入力欄の id と重なる）
		const container =
			typeof child?.type === 'string' && CONTAINERS.has(child.type)
		const control =
			child && !container ? React.cloneElement(child, { id }) : children
		return (
			<div
				ref={ref}
				data-slot='inline-field'
				className={cn(
					'min-w-0',
					labelWidth
						? 'grid gap-x-3 gap-y-1 sm:grid-cols-[var(--inline-field-label)_minmax(0,1fr)] sm:items-center'
						: ['flex items-center', dense ? 'gap-1.5' : 'gap-2'],
					dense ? 'text-xs' : 'text-sm',
					className,
				)}
				style={
					labelWidth
						? ({
								'--inline-field-label': labelWidth,
								...style,
							} as React.CSSProperties)
						: style
				}
				{...props}
			>
				<Label
					htmlFor={id}
					className={cn(
						'shrink-0 font-normal leading-snug text-muted-foreground',
						dense ? 'text-xs' : 'text-sm',
					)}
				>
					{label}
				</Label>
				{suffix == null ? (
					control
				) : (
					<div
						className={cn(
							'flex min-w-0 items-center',
							dense ? 'gap-1.5' : 'gap-2',
						)}
					>
						{control}
						<span className='shrink-0'>{suffix}</span>
					</div>
				)}
			</div>
		)
	},
)
InlineField.displayName = 'InlineField'

export { Field, FieldActions, FieldGroup, InlineField }
