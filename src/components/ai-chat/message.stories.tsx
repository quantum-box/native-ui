import type { Meta, StoryObj } from '@storybook/react-vite'
import { Search } from 'lucide-react'

import { Bubble, BubbleContent } from './bubble'
import {
	Message,
	MessageAvatar,
	MessageContent,
	MessageFooter,
	MessageGroup,
	MessageHeader,
} from './message'
import {
	Trace,
	TraceCollapsible,
	TraceCollapsibleContent,
	TraceCollapsibleTrigger,
	TraceIcon,
	TraceLine,
	TraceTitle,
} from './trace'

/** AI とのやりとりの 1 件分。自分の発言は右、AI の答えは左に並ぶ。 */
const meta = {
	title: 'AI チャット/Message',
	component: Message,
} satisfies Meta<typeof Message>

export default meta
type Story = StoryObj<typeof meta>

export const やりとり: Story = {
	render: () => (
		<MessageGroup className='w-[32rem] gap-4'>
			<Message align='end'>
				<MessageContent>
					<Bubble align='end' variant='muted'>
						<BubbleContent>先月の売上を店ごとに教えて</BubbleContent>
					</Bubble>
				</MessageContent>
			</Message>
			<Message>
				<MessageContent>
					<Trace>
						<TraceCollapsible>
							<TraceCollapsibleTrigger>
								<TraceLine>
									<TraceIcon>
										<Search />
									</TraceIcon>
									<TraceTitle>売上の表を調べました</TraceTitle>
								</TraceLine>
							</TraceCollapsibleTrigger>
							<TraceCollapsibleContent>
								2026年10月の売上伝票 1,284 件を店ごとに足しました。
							</TraceCollapsibleContent>
						</TraceCollapsible>
					</Trace>
					<Bubble variant='ghost'>
						<BubbleContent>
							先月の売上は、渋谷店が 412 万円、新宿店が 389 万円、池袋店が 251
							万円でした。渋谷店は前の月より 8% 増えています。
						</BubbleContent>
					</Bubble>
				</MessageContent>
			</Message>
			<Message align='end'>
				<MessageContent>
					<Bubble align='end' variant='muted'>
						<BubbleContent>池袋店が減った理由は分かる？</BubbleContent>
					</Bubble>
				</MessageContent>
			</Message>
		</MessageGroup>
	),
}

export const 顔と見出し: Story = {
	render: () => (
		<MessageGroup className='w-[32rem] gap-4'>
			<Message>
				<MessageAvatar>AI</MessageAvatar>
				<MessageContent>
					<MessageHeader>アシスタント</MessageHeader>
					<Bubble variant='secondary'>
						<BubbleContent>請求書を 3 件見つけました。</BubbleContent>
					</Bubble>
					<MessageFooter>10:42</MessageFooter>
				</MessageContent>
			</Message>
			<Message align='end'>
				<MessageAvatar>山</MessageAvatar>
				<MessageContent>
					<MessageHeader>山田</MessageHeader>
					<Bubble align='end'>
						<BubbleContent>いちばん古いものを開いて</BubbleContent>
					</Bubble>
					<MessageFooter>10:43</MessageFooter>
				</MessageContent>
			</Message>
		</MessageGroup>
	),
}
