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
	/** 入力欄の id。省くと作る。 */
	controlId?: string
	/** ラベルの横に「必須」を出す。 */
	required?: boolean
	/** 入力欄。1 つの要素（Input・Select・Textarea・それらを横に並べた箱など）。 */
	children: React.ReactNode
}

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
		const control = child
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
					// 余りの高さは下に寄せる（既定の stretch だと、余りがラベルの段に入って入力欄が下がる）
					'grid min-w-0 content-start gap-1',
					className,
				)}
				{...props}
			>
				<Label htmlFor={id} className='leading-snug text-muted-foreground'>
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
						<p id={noteId} role='alert' className='text-xs text-destructive'>
							{error}
						</p>
					) : description ? (
						<p id={noteId} className='text-xs text-muted-foreground'>
							{description}
						</p>
					) : null}
				</div>
			</div>
		)
	},
)
Field.displayName = 'Field'

/**
 * 欄を横に並べる箱。同じ行の欄どうしで、ラベル・入力欄・説明の段の高さを共有する
 * （CSS の subgrid）。列の数は className で決める（例: `sm:grid-cols-2 lg:grid-cols-4`）。
 * 何も決めないと、狭い画面では 1 列、広がると 12rem ずつ並ぶ。
 *
 * 欄でない物（ボタンなど）を並べるときは `col-span-full` などで 1 行を使う。
 */
const FieldGroup = React.forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
	<div
		ref={ref}
		data-slot='field-group'
		className={cn(
			'grid min-w-0 grid-cols-[repeat(auto-fill,minmax(min(100%,12rem),1fr))] gap-x-3 gap-y-3',
			'[&>[data-slot=field]]:row-span-3 [&>[data-slot=field]]:grid-rows-subgrid [&>[data-slot=field]]:gap-y-1',
			className,
		)}
		{...props}
	/>
))
FieldGroup.displayName = 'FieldGroup'

export { Field, FieldGroup }
