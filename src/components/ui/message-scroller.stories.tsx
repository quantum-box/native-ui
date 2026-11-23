import type { Meta, StoryObj } from '@storybook/react-vite'
import * as React from 'react'

import { Bubble, BubbleContent } from './bubble'
import { Button } from './button'
import { Message, MessageContent, MessageGroup } from './message'
import {
	MessageScroller,
	MessageScrollerButton,
	MessageScrollerContent,
	MessageScrollerItem,
	MessageScrollerProvider,
	MessageScrollerViewport,
} from './message-scroller'

/**
 * 会話の流れをスクロールして見せる枠。開くと最新の発言を見せ、上へ戻ると
 * 下端へ戻るボタンが出る。新しい質問を足すと、その質問が枠の上端に来る。
 */
const meta = {
	title: 'Components/AI のチャット/MessageScroller',
	component: MessageScrollerProvider,
} satisfies Meta<typeof MessageScrollerProvider>

export default meta
type Story = StoryObj<typeof meta>

interface Turn {
	id: string
	question: string
	answer: string
}

const makeTurns = (count: number): Turn[] =>
	Array.from({ length: count }, (_, index) => ({
		id: `turn-${index + 1}`,
		question: `質問 ${index + 1}: 先月の店ごとの売上は？`,
		answer: `答え ${index + 1}: 渋谷店が 412 万円、新宿店が 389 万円、池袋店が 251 万円でした。前の月と比べると、渋谷店が 8% 増え、池袋店が 5% 減っています。`,
	}))

function TurnView({ turn }: Readonly<{ turn: Turn }>) {
	return (
		<MessageGroup className='gap-3'>
			<Message align='end'>
				<MessageContent>
					<Bubble align='end' variant='muted'>
						<BubbleContent>{turn.question}</BubbleContent>
					</Bubble>
				</MessageContent>
			</Message>
			<Message>
				<MessageContent>
					<Bubble variant='ghost'>
						<BubbleContent>{turn.answer}</BubbleContent>
					</Bubble>
				</MessageContent>
			</Message>
		</MessageGroup>
	)
}

function Conversation({
	initial,
	autoScroll,
}: Readonly<{ initial: number; autoScroll?: boolean }>) {
	const [turns, setTurns] = React.useState(() => makeTurns(initial))
	return (
		<div className='flex h-[28rem] w-[32rem] flex-col overflow-hidden rounded-lg border border-border bg-background'>
			<MessageScrollerProvider autoScroll={autoScroll}>
				<MessageScroller className='min-h-0 flex-1'>
					<MessageScrollerViewport>
						<MessageScrollerContent
							aria-label='会話'
							className='gap-4 p-4'
							role='log'
						>
							{turns.map(turn => (
								<MessageScrollerItem
									key={turn.id}
									messageId={turn.id}
									scrollAnchor
								>
									<TurnView turn={turn} />
								</MessageScrollerItem>
							))}
						</MessageScrollerContent>
					</MessageScrollerViewport>
					<MessageScrollerButton />
				</MessageScroller>
			</MessageScrollerProvider>
			<div className='flex justify-end border-border border-t p-2'>
				<Button
					size='sm'
					variant='primary'
					onClick={() =>
						setTurns(previous => [
							...previous,
							...makeTurns(previous.length + 1).slice(previous.length),
						])
					}
				>
					質問を足す
				</Button>
			</div>
		</div>
	)
}

export const 数件のやりとり: Story = {
	args: { children: null },
	render: () => <Conversation initial={2} />,
}

export const 長い会話: Story = {
	args: { children: null },
	render: () => <Conversation initial={20} />,
}

export const 答えに付いていく: Story = {
	args: { children: null },
	render: () => <Conversation autoScroll initial={20} />,
}
