'use client'

import * as React from 'react'
import {
	Controller,
	type ControllerProps,
	type FieldPath,
	type FieldValues,
	FormProvider,
	useFormContext,
} from 'react-hook-form'

import { Slot } from '../../lib/slot'
import { cn } from '../../lib/utils'
import { Label } from '../basics/label'

const Form = FormProvider

type FormFieldContextValue<
	TFieldValues extends FieldValues = FieldValues,
	TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
	name: TName
}

const FormFieldContext = React.createContext<FormFieldContextValue | undefined>(
	undefined,
)

const FormField = <
	TFieldValues extends FieldValues = FieldValues,
	TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>(
	props: ControllerProps<TFieldValues, TName>,
) => (
	<FormFieldContext.Provider value={{ name: props.name }}>
		<Controller {...props} />
	</FormFieldContext.Provider>
)
FormField.displayName = 'FormField'

type FormItemContextValue = {
	id: string
}

const FormItemContext = React.createContext<FormItemContextValue | undefined>(
	undefined,
)

const useFormField = () => {
	const fieldContext = React.useContext(FormFieldContext)
	const itemContext = React.useContext(FormItemContext)
	const { getFieldState, formState } = useFormContext()

	if (!fieldContext) {
		throw new Error('useFormField must be used within <FormField>')
	}
	if (!itemContext) {
		throw new Error('useFormField must be used within <FormItem>')
	}

	const fieldState = getFieldState(fieldContext.name, formState)
	const { id } = itemContext

	return {
		id,
		name: fieldContext.name,
		formItemId: `${id}-form-item`,
		formDescriptionId: `${id}-form-item-description`,
		formMessageId: `${id}-form-item-message`,
		...fieldState,
	}
}

/**
 * 1 つの欄の箱（ラベル・入力欄・説明・エラーの順）。
 *
 * - 親の grid の行の高さまで引き伸ばされても、中身は上に寄せる（content-start）。
 *   引き伸ばされた分がラベルの段に入って、入力欄が下がることが無い。
 * - 縮められる（min-w-0）。入力欄が箱の外へはみ出さない。
 * - 説明（FormDescription）とエラー（FormMessage）は、1 つの段にまとめる。
 *   FieldGroup の中に置くと、Field と同じく、同じ行の欄の「ラベルの段・入力欄の段・
 *   説明の段」がそろう。
 */
const FormItem = React.forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
	const id = React.useId()
	const items = React.Children.toArray(children)
	const isNote = (child: React.ReactNode) =>
		React.isValidElement(child) &&
		(child.type === FormDescription || child.type === FormMessage)
	const notes = items.filter(isNote)
	const rest = items.filter(child => !isNote(child))

	return (
		<FormItemContext.Provider value={{ id }}>
			<div
				ref={ref}
				data-slot='field'
				// 段の間は gap でなく余白で空け、説明もエラーも無いときは入力欄の下に空きを作らない
				className={cn(
					'grid min-w-0 content-start gap-0 [&>label]:pb-1.5',
					className,
				)}
				{...props}
			>
				{rest}
				{notes.length > 0 ? (
					<div data-slot='field-note' className='grid min-w-0 gap-1 pt-1'>
						{notes}
					</div>
				) : null}
			</div>
		</FormItemContext.Provider>
	)
})
FormItem.displayName = 'FormItem'

const FormLabel = React.forwardRef<
	React.ElementRef<typeof Label>,
	React.ComponentPropsWithoutRef<typeof Label>
>(({ className, ...props }, ref) => {
	const { error, formItemId } = useFormField()

	return (
		<Label
			ref={ref}
			htmlFor={formItemId}
			className={cn(error && 'text-destructive', className)}
			{...props}
		/>
	)
})
FormLabel.displayName = 'FormLabel'

const FormControl = React.forwardRef<
	React.ElementRef<typeof Slot>,
	React.ComponentPropsWithoutRef<typeof Slot>
>(({ ...props }, ref) => {
	const { error, formItemId, formDescriptionId, formMessageId } = useFormField()

	return (
		<Slot
			ref={ref}
			id={formItemId}
			aria-describedby={
				error ? `${formDescriptionId} ${formMessageId}` : formDescriptionId
			}
			aria-invalid={error ? true : undefined}
			{...props}
		/>
	)
})
FormControl.displayName = 'FormControl'

const FormDescription = React.forwardRef<
	HTMLParagraphElement,
	React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
	const { formDescriptionId } = useFormField()

	return (
		<p
			ref={ref}
			id={formDescriptionId}
			className={cn('text-xs text-muted-foreground', className)}
			{...props}
		/>
	)
})
FormDescription.displayName = 'FormDescription'

const FormMessage = React.forwardRef<
	HTMLParagraphElement,
	React.HTMLAttributes<HTMLParagraphElement>
>(({ className, children, ...props }, ref) => {
	const { error, formMessageId } = useFormField()
	const body = error ? String(error.message ?? '') : children

	if (!body) {
		return null
	}

	return (
		<p
			ref={ref}
			id={formMessageId}
			className={cn('text-xs font-medium text-destructive', className)}
			role='alert'
			{...props}
		>
			{body}
		</p>
	)
})
FormMessage.displayName = 'FormMessage'

export {
	useFormField,
	Form,
	FormItem,
	FormLabel,
	FormControl,
	FormDescription,
	FormMessage,
	FormField,
}
