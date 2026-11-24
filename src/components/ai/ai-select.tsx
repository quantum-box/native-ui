'use client'

import * as React from 'react'

import { Select, type SelectProps, SelectTrigger } from '../inputs/select'
import { AiField, type AiFieldProps } from './ai-field'

/*
 * AI が値を選んだ選択欄。`Select` と同じ使い方で、`SelectTrigger` の代わりに
 * `AiSelectTrigger` を置く。
 *
 *   <AiSelect
 *     status={status}
 *     onEdit={() => setStatus('edited')}
 *     onConfirm={() => setStatus('confirmed')}
 *     value={store}
 *     onValueChange={setStore}
 *   >
 *     <AiSelectTrigger><SelectValue /></AiSelectTrigger>
 *     <SelectContent>…</SelectContent>
 *   </AiSelect>
 *
 * `AiField` は文字を打ったとき（input の出来事）だけ `onEdit` を呼ぶので、
 * 選択欄を `AiField` で包むだけでは、選び直しても「直した」にならない。
 * ここでは、人が別の項目を選んだときに `onEdit` を呼ぶ。同じ項目を選び直した
 * ときは呼ばない。
 */

type AiSelectMark = Omit<AiFieldProps, 'children' | 'className'>

const AiSelectContext = React.createContext<AiSelectMark | null>(null)

interface AiSelectProps extends SelectProps, AiSelectMark {}

function AiSelect({
	status,
	onEdit,
	onConfirm,
	labels,
	showEditedMark,
	reasoning,
	value,
	defaultValue,
	onValueChange,
	children,
	...props
}: AiSelectProps) {
	// 今の値。外で持つ形なら外の値に従い、中で持つ形なら選んだ値を覚える。
	const current = React.useRef(value ?? defaultValue ?? '')
	if (value !== undefined) current.current = value
	const mark = React.useMemo(
		() => ({ status, onConfirm, labels, showEditedMark, reasoning }),
		[status, onConfirm, labels, showEditedMark, reasoning],
	)
	return (
		<Select
			defaultValue={defaultValue}
			onValueChange={next => {
				const changed = next !== current.current
				current.current = next
				onValueChange?.(next)
				if (changed) onEdit?.()
			}}
			value={value}
			{...props}
		>
			<AiSelectContext.Provider value={mark}>
				{children}
			</AiSelectContext.Provider>
		</Select>
	)
}

interface AiSelectTriggerProps
	extends React.ComponentPropsWithoutRef<typeof SelectTrigger> {
	/** 外側の包み（枠と印を持つ箱）のクラス。幅や並びはここで決める。 */
	fieldClassName?: string
}

/** `AiSelect` の中に置く、AI の枠と印が付いた `SelectTrigger`。 */
const AiSelectTrigger = React.forwardRef<
	HTMLButtonElement,
	AiSelectTriggerProps
>(({ fieldClassName, ...props }, ref) => {
	const mark = React.useContext(AiSelectContext)
	return (
		<AiField className={fieldClassName} status='none' {...mark}>
			<SelectTrigger ref={ref} {...props} />
		</AiField>
	)
})
AiSelectTrigger.displayName = 'AiSelectTrigger'

export {
	AiSelect,
	type AiSelectProps,
	AiSelectTrigger,
	type AiSelectTriggerProps,
}
