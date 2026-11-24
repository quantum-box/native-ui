import { zodResolver } from '@hookform/resolvers/zod'
import type { Meta, StoryObj } from '@storybook/react-vite'
import * as React from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { Button } from '../basics/button'
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from './form'
import { FieldActions, FieldGroup } from './field'
import { Input } from './input'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from './select'

const schema = z.object({
	name: z.string().min(2, 'Name must contain at least 2 characters.'),
})

const ExampleForm = () => {
	const form = useForm<z.infer<typeof schema>>({
		resolver: zodResolver(schema),
		defaultValues: { name: '' },
	})

	return (
		<Form {...form}>
			<form
				onSubmit={form.handleSubmit(() => undefined)}
				className='flex w-72 flex-col gap-4'
			>
				<FormField
					control={form.control}
					name='name'
					render={({ field }) => (
						<FormItem>
							<FormLabel>Tenant name</FormLabel>
							<FormControl>
								<Input placeholder='Acme Inc.' {...field} />
							</FormControl>
							<FormDescription>
								Shown to every member of the tenant.
							</FormDescription>
							<FormMessage />
						</FormItem>
					)}
				/>
				<Button type='submit' variant='primary' className='self-end'>
					Save
				</Button>
			</form>
		</Form>
	)
}

const meta = {
	title: '入力/Form',
	id: 'form',
	component: ExampleForm,
} satisfies Meta<typeof ExampleForm>

export default meta
type Story = StoryObj<typeof meta>

export const ZodValidation: Story = {
	render: () => <ExampleForm />,
}

const locations = [
	{ id: 'warehouse', name: '倉庫 1' },
	{ id: 'destination', name: '移動先倉庫 1' },
	{ id: 'store', name: '店舗拠点 1' },
]

/** 在庫移動のような、FormControl の中の Select を二つ並べた入力 */
const TransferForm = () => {
	const form = useForm<{ from: string; to: string }>({
		defaultValues: { from: '', to: '' },
	})
	const values = form.watch()
	return (
		<Form {...form}>
			<form
				onSubmit={form.handleSubmit(() => undefined)}
				className='flex w-72 flex-col gap-4'
			>
				{(['from', 'to'] as const).map(name => (
					<FormField
						key={name}
						control={form.control}
						name={name}
						render={({ field }) => (
							<FormItem>
								<FormLabel>{name === 'from' ? '移動元' : '移動先'}</FormLabel>
								<Select onValueChange={field.onChange} value={field.value}>
									<FormControl>
										<SelectTrigger>
											<SelectValue
												placeholder={`${name === 'from' ? '移動元' : '移動先'}を選択`}
											/>
										</SelectTrigger>
									</FormControl>
									<SelectContent>
										{locations.map(location => (
											<SelectItem key={location.id} value={location.id}>
												{location.name}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								<FormMessage />
							</FormItem>
						)}
					/>
				))}
				<p className='text-xs text-muted-foreground' data-testid='values'>
					{`移動元: ${values.from || 'なし'} / 移動先: ${values.to || 'なし'}`}
				</p>
			</form>
		</Form>
	)
}

/** FormControl の中の Select。値は react-hook-form が持つ */
export const SelectInForm: Story = {
	name: 'Select を中に置く',
	render: () => <TransferForm />,
}

/** FormItem を FieldGroup に並べる。説明・エラー・長いラベルが混ざっても入力欄の上端がそろう */
const PackageItemsForm = () => {
	const form = useForm<{
		name: string
		count: string
		jan: string
		note: string
	}>({
		defaultValues: { name: '有機トマト', count: '12', jan: '4901', note: '' },
	})
	React.useEffect(() => {
		form.setError('jan', { message: '13 桁の数字で入れてください。' })
	}, [form])
	return (
		<Form {...form}>
			<form
				onSubmit={form.handleSubmit(() => undefined)}
				className='w-[60rem] min-w-0 max-w-full rounded-md border border-border p-4'
			>
				<FieldGroup columns={4}>
					<FormField
						control={form.control}
						name='name'
						render={({ field }) => (
							<FormItem>
								<FormLabel>商品名</FormLabel>
								<FormControl>
									<Input {...field} />
								</FormControl>
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name='count'
						render={({ field }) => (
							<FormItem>
								<FormLabel>入数</FormLabel>
								<FormControl>
									<Input inputMode='numeric' {...field} />
								</FormControl>
								<FormDescription>1 箱に入っている数</FormDescription>
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name='jan'
						render={({ field }) => (
							<FormItem>
								<FormLabel>JAN コード</FormLabel>
								<FormControl>
									<Input inputMode='numeric' {...field} />
								</FormControl>
								<FormDescription>商品の箱のバーコード</FormDescription>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name='note'
						render={({ field }) => (
							<FormItem>
								<FormLabel>
									仕入れ先への伝え方（電話・メール・発注書の備考など）
								</FormLabel>
								<FormControl>
									<Input {...field} />
								</FormControl>
							</FormItem>
						)}
					/>
					<FieldActions>
						<Button type='submit' variant='primary'>
							保存
						</Button>
					</FieldActions>
				</FieldGroup>
			</form>
		</Form>
	)
}

/** FormItem（react-hook-form）を FieldGroup に並べる */
export const FormItemを並べる: Story = {
	name: 'FormItem を並べる',
	render: () => <PackageItemsForm />,
}
