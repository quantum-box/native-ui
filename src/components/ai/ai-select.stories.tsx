import type { Meta, StoryObj } from '@storybook/react-vite'
import * as React from 'react'

import { Button } from '../basics/button'
import { Label } from '../basics/label'
import { Input } from '../inputs/input'
import { SelectContent, SelectItem, SelectValue } from '../inputs/select'
import { AiField, type AiFieldStatus } from './ai-field'
import { AiSelect, AiSelectTrigger } from './ai-select'

/**
 * AI が値を選んだ選択欄。`Select` と同じ使い方で、`SelectTrigger` の代わりに
 * `AiSelectTrigger` を置く。人が別の項目を選ぶと `onEdit` が呼ばれ、
 * ✓ を押すと `onConfirm` が呼ばれる。
 */
const meta = {
	title: 'AI/AiSelect',
	id: 'ai-select',
	component: AiSelect,
} satisfies Meta<typeof AiSelect>

export default meta
type Story = StoryObj<typeof meta>

const items = (
	<SelectContent>
		<SelectItem value='shibuya'>渋谷店</SelectItem>
		<SelectItem value='shinjuku'>新宿店</SelectItem>
		<SelectItem value='ikebukuro'>池袋店</SelectItem>
	</SelectContent>
)

const STATUSES: Array<{ status: AiFieldStatus; title: string }> = [
	{ status: 'filled', title: 'AI が選んだまま' },
	{ status: 'filling', title: 'AI が選んでいる途中' },
	{ status: 'uncertain', title: '確からしさが低い' },
	{ status: 'confirmed', title: '人が確かめた' },
	{ status: 'edited', title: '人が選び直した' },
	{ status: 'none', title: 'AI は関わっていない' },
]

export const 状態ごと: Story = {
	args: { status: 'filled' },
	render: () => (
		<div className='grid w-[20rem] gap-5'>
			{STATUSES.map(({ status, title }) => (
				<div className='grid gap-1.5' key={status}>
					<Label htmlFor={`state-${status}`}>{title}</Label>
					<AiSelect defaultValue='shibuya' onConfirm={() => {}} status={status}>
						<AiSelectTrigger id={`state-${status}`}>
							<SelectValue />
						</AiSelectTrigger>
						{items}
					</AiSelect>
				</div>
			))}
		</div>
	),
}

/** 別の項目を選ぶと「直した」に、✓ を押すと「確認済み」に変わる。印に触れると理由が開く。 */
export const 状態の移り変わり: Story = {
	args: { status: 'filled' },
	render: function Render() {
		const [store, setStore] = React.useState('shibuya')
		const [status, setStatus] = React.useState<AiFieldStatus>('filled')
		return (
			<div className='grid w-[20rem] gap-4'>
				<div className='grid gap-1.5'>
					<Label htmlFor='try-store'>店</Label>
					<AiSelect
						onConfirm={() => setStatus('confirmed')}
						onEdit={() => setStatus('edited')}
						onValueChange={setStore}
						reasoning={{
							reason: '領収書の住所が渋谷区のため。',
							inputs: '領収書の画像',
							unverified: status !== 'confirmed',
						}}
						status={status}
						value={store}
					>
						<AiSelectTrigger id='try-store'>
							<SelectValue />
						</AiSelectTrigger>
						{items}
					</AiSelect>
				</div>
				<Button
					className='justify-self-start'
					onClick={() => {
						setStore('shibuya')
						setStatus('filled')
					}}
					size='sm'
				>
					元に戻す
				</Button>
			</div>
		)
	},
}

/** 文字の欄（AiField）と横に並べても、枠の高さと上端がそろう。 */
export const 入力欄と並べる: Story = {
	args: { status: 'filled' },
	render: () => (
		<div className='flex w-[26rem] items-center gap-2'>
			<AiSelect defaultValue='shibuya' onConfirm={() => {}} status='filled'>
				<AiSelectTrigger aria-label='店' fieldClassName='min-w-0 flex-1'>
					<SelectValue />
				</AiSelectTrigger>
				{items}
			</AiSelect>
			<AiField className='w-24 shrink-0' onConfirm={() => {}} status='filled'>
				<Input aria-label='数量' defaultValue='5' inputMode='decimal' />
			</AiField>
		</div>
	),
}
