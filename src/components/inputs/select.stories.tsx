import type { Meta, StoryObj } from '@storybook/react-vite'

import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
} from './select'

const meta = {
	title: '入力/Select',
	component: Select,
} satisfies Meta<typeof Select>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
	render: () => (
		<Select defaultValue='backlog'>
			<SelectTrigger className='w-44'>
				<SelectValue placeholder='Status' />
			</SelectTrigger>
			<SelectContent>
				<SelectGroup>
					<SelectLabel>Status</SelectLabel>
					<SelectItem value='backlog'>Backlog</SelectItem>
					<SelectItem value='todo'>Todo</SelectItem>
					<SelectItem value='in-progress'>In progress</SelectItem>
					<SelectItem value='done'>Done</SelectItem>
					<SelectItem value='canceled'>Canceled</SelectItem>
				</SelectGroup>
			</SelectContent>
		</Select>
	),
}

/** 二つ並べた Select。続けて開いても、一覧はいつもひとつだけ出る */
export const 二つ並べる: Story = {
	render: () => (
		<div className='flex flex-col gap-3'>
			<div className='flex gap-3'>
				{(['状態', '担当'] as const).map(label => (
					<Select key={label}>
						<SelectTrigger aria-label={label} className='w-44'>
							<SelectValue placeholder={`${label}を選ぶ`} />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value='a'>{label}: 一つ目</SelectItem>
							<SelectItem value='b'>{label}: 二つ目</SelectItem>
							<SelectItem value='c'>{label}: 三つ目</SelectItem>
						</SelectContent>
					</Select>
				))}
			</div>
			{/* 一覧が出る場所。閉じたあとは、開く前と同じ見た目に戻るはず */}
			<div data-testid='below' className='mt-1 h-40 w-[23rem]' />
		</div>
	),
}
