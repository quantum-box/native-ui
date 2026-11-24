import { zodResolver } from '@hookform/resolvers/zod'
import type { Meta, StoryObj } from '@storybook/react-vite'
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
