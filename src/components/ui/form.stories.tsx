import { zodResolver } from '@hookform/resolvers/zod'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { Button } from './button'
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
	title: 'Components/Form',
	component: ExampleForm,
} satisfies Meta<typeof ExampleForm>

export default meta
type Story = StoryObj<typeof meta>

export const ZodValidation: Story = {
	render: () => <ExampleForm />,
}
