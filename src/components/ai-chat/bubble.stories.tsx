import type { Meta, StoryObj } from '@storybook/react-vite'

import { Bubble, BubbleContent, BubbleGroup, BubbleReactions } from './bubble'

/** 発言の吹き出し。色は 7 通り。押せる吹き出しは `asChild` でボタンを渡す。 */
const meta = {
	title: 'AI チャット/Bubble',
	id: 'bubble',
	component: Bubble,
} satisfies Meta<typeof Bubble>

export default meta
type Story = StoryObj<typeof meta>

const VARIANTS = [
	'default',
	'secondary',
	'muted',
	'tinted',
	'outline',
	'ghost',
	'destructive',
] as const

export const 色: Story = {
	render: () => (
		<BubbleGroup className='w-[28rem]'>
			{VARIANTS.map(variant => (
				<Bubble key={variant} variant={variant}>
					<BubbleContent>{variant}: 明日の予定を教えて</BubbleContent>
				</Bubble>
			))}
		</BubbleGroup>
	),
}

export const 右寄せと反応: Story = {
	render: () => (
		<BubbleGroup className='w-[28rem] gap-6'>
			<Bubble variant='muted'>
				<BubbleContent>見積書を作りました。</BubbleContent>
				<BubbleReactions>👍</BubbleReactions>
			</Bubble>
			<Bubble align='end'>
				<BubbleContent>ありがとう</BubbleContent>
			</Bubble>
		</BubbleGroup>
	),
}

export const 押せる吹き出し: Story = {
	render: () => (
		<BubbleGroup className='w-[28rem]'>
			<Bubble variant='outline'>
				<BubbleContent asChild>
					<button type='button'>今月の経費をまとめて</button>
				</BubbleContent>
			</Bubble>
			<Bubble variant='outline'>
				<BubbleContent asChild>
					<button type='button'>未払いの請求書を出して</button>
				</BubbleContent>
			</Bubble>
		</BubbleGroup>
	),
}
