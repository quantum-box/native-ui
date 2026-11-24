import type { Meta, StoryObj } from '@storybook/react-vite'
import { BarChart3, Receipt } from 'lucide-react'
import * as React from 'react'

import { Bubble, BubbleContent } from './bubble'
import { ApprovalRequest, type ApprovalStatus } from './chat-approval'
import { type ChatSource, CitationMark, SourceList } from './chat-citations'
import { ChatEmptyState } from './chat-empty-state'
import { MessageActions, type MessageFeedback } from './chat-message-actions'
import { PromptInput } from './chat-prompt-input'
import {
	StreamingText,
	ThinkingBlock,
	ThinkingIndicator,
} from './chat-streaming'
import { ToolCall, type ToolCallStatus } from './chat-tool-call'
import { Message, MessageContent } from './message'
import {
	MessageScroller,
	MessageScrollerButton,
	MessageScrollerContent,
	MessageScrollerItem,
	MessageScrollerProvider,
	MessageScrollerViewport,
} from './message-scroller'
import { Trace } from './trace'

/**
 * ひと通りの会話。問い → 考える → 道具を使う → 承認 → 返事（出典つき）→ よい・よくない。
 * 候補を選ぶか問いを送ると、AI の動きを順に見せる。承認で止まるので、承認か却下を押す。
 */
const meta = {
	title: 'AI チャット/ChatConversation',
	parameters: { layout: 'fullscreen' },
} satisfies Meta

export default meta
type Story = StoryObj

const SOURCES: ChatSource[] = [
	{
		id: '1',
		title: '売上伝票（2026年10月）',
		kind: '集計',
		excerpt: '1,284 件。渋谷 412 万円・新宿 389 万円・池袋 251 万円。',
		href: '#sales',
	},
	{
		id: '2',
		title: '池袋店 客数の推移',
		kind: '分析',
		excerpt: '平日 11〜14 時の客数が 9 月から 18% 減。',
		href: '#ikebukuro',
	},
	{
		id: '3',
		title: 'レポート「10月の店別売上」',
		kind: '書類',
		href: '#report',
		changed: true,
	},
]

/** 返事の文。cite があれば、その部分が流れ終わったあとに出典の印を出す。 */
const ANSWER: Array<{ text: string; cite?: ChatSource }> = [
	{
		text: '先月の売上は、渋谷店が 412 万円、新宿店が 389 万円、池袋店が 251 万円でした。',
		cite: SOURCES[0],
	},
	{
		text: '前の月と比べると渋谷店が 8% 増え、池袋店は 5% 減っています。池袋店は平日の昼の客数が減っています。',
		cite: SOURCES[1],
	},
	{ text: 'まとめた表は、レポート「10月の店別売上」として保存しました。' },
]
const ANSWER_LENGTH = ANSWER.reduce((sum, part) => sum + part.text.length, 0)

const THOUGHT = `「先月」は 2026年10月。店ごとに売上伝票を足し、9 月とも比べる。
池袋店だけ減っているので、客数も見ておく。
結果を残しておけるよう、レポートとして保存してよいか確かめる。`

type Phase =
	| 'empty'
	| 'waiting'
	| 'thinking'
	| 'tool'
	| 'approval'
	| 'answering'
	| 'done'
	| 'stopped'

function Answer({ shown }: Readonly<{ shown: number }>) {
	let rest = shown
	return (
		<>
			{ANSWER.map(part => {
				const take = Math.max(0, Math.min(part.text.length, rest))
				rest -= take
				if (take === 0) return null
				return (
					<React.Fragment key={part.text}>
						{part.text.slice(0, take)}
						{take === part.text.length && part.cite ? (
							<CitationMark source={part.cite} />
						) : null}
					</React.Fragment>
				)
			})}
		</>
	)
}

function Conversation() {
	const [phase, setPhase] = React.useState<Phase>('empty')
	const [question, setQuestion] = React.useState('')
	const [toolStatus, setToolStatus] = React.useState<ToolCallStatus>('pending')
	const [approval, setApproval] = React.useState<ApprovalStatus>('pending')
	const [shown, setShown] = React.useState(0)
	const [feedback, setFeedback] = React.useState<MessageFeedback>(null)
	const timers = React.useRef<Array<ReturnType<typeof setTimeout>>>([])
	const later = (ms: number, run: () => void) => {
		timers.current.push(setTimeout(run, ms))
	}
	React.useEffect(() => () => timers.current.forEach(clearTimeout), [])

	const ask = (text: string) => {
		timers.current.forEach(clearTimeout)
		setQuestion(text)
		setToolStatus('pending')
		setApproval('pending')
		setShown(0)
		setFeedback(null)
		setPhase('waiting')
		later(900, () => setPhase('thinking'))
		later(2600, () => {
			setPhase('tool')
			setToolStatus('running')
		})
		later(4200, () => {
			setToolStatus('done')
			setPhase('approval')
		})
	}

	// 承認のあと、返事を少しずつ流す。
	React.useEffect(() => {
		if (phase !== 'answering') return
		if (shown >= ANSWER_LENGTH) {
			setPhase('done')
			return
		}
		const timer = setTimeout(() => setShown(shown + 3), 30)
		return () => clearTimeout(timer)
	}, [phase, shown])

	const decide = (next: ApprovalStatus) => {
		setApproval(next)
		setPhase(next === 'approved' ? 'answering' : 'done')
	}

	const busy =
		phase === 'waiting' ||
		phase === 'thinking' ||
		phase === 'tool' ||
		phase === 'answering'
	const answerText = ANSWER.map(part => part.text).join('')

	return (
		<div className='mx-auto flex h-[100dvh] max-w-2xl flex-col gap-3 p-4'>
			<MessageScrollerProvider autoScroll>
				<MessageScroller className='min-h-0 flex-1 rounded-lg border border-border'>
					<MessageScrollerViewport>
						<MessageScrollerContent
							aria-label='会話'
							className='gap-4 p-4'
							role='log'
						>
							{phase === 'empty' ? (
								<ChatEmptyState
									description='売上・経費・仕訳・取引先のことを聞けます。'
									onSelect={ask}
									suggestions={[
										{
											label: '先月の売上を店ごとに',
											icon: <BarChart3 aria-hidden />,
										},
										{
											label: '未払いの請求書を出して',
											icon: <Receipt aria-hidden />,
										},
									]}
								/>
							) : (
								<MessageScrollerItem messageId='turn-1' scrollAnchor>
									<div className='grid gap-4'>
										<Message align='end'>
											<MessageContent>
												<Bubble align='end' variant='muted'>
													<BubbleContent>{question}</BubbleContent>
												</Bubble>
												<MessageActions copyText={question} onEdit={() => {}} />
											</MessageContent>
										</Message>
										<Message>
											<MessageContent>
												{phase === 'waiting' ? <ThinkingIndicator /> : null}
												{phase !== 'waiting' ? (
													<ThinkingBlock
														durationSeconds={2}
														thinking={phase === 'thinking'}
													>
														{THOUGHT}
													</ThinkingBlock>
												) : null}
												{toolStatus !== 'pending' ? (
													<Trace>
														<ToolCall
															description={
																toolStatus === 'done' ? '1.6 秒' : undefined
															}
															input={{ 期間: '2026年10月', 分け方: '店' }}
															name='売上伝票を店ごとに足す'
															output={
																toolStatus === 'done'
																	? {
																			渋谷店: 4120000,
																			新宿店: 3890000,
																			池袋店: 2510000,
																		}
																	: undefined
															}
															status={toolStatus}
														/>
													</Trace>
												) : null}
												{phase === 'approval' ||
												phase === 'answering' ||
												phase === 'done' ? (
													<ApprovalRequest
														changes={[
															{ label: '名前', after: '10月の店別売上' },
															{ label: '置き場所', after: 'レポート / 売上' },
														]}
														description='まとめた表を、あとで見返せるよう保存します。'
														onApprove={() => decide('approved')}
														onReject={() => decide('rejected')}
														status={approval}
														title='レポートを 1 件作ります'
													/>
												) : null}
												{shown > 0 ? (
													<StreamingText streaming={phase === 'answering'}>
														<Answer shown={shown} />
													</StreamingText>
												) : null}
												{phase === 'done' && approval === 'rejected' ? (
													<p className='text-muted-foreground text-sm'>
														保存はやめました。表は上の実行履歴から見られます。
													</p>
												) : null}
												{phase === 'stopped' ? (
													<p className='text-muted-foreground text-sm'>
														止めました。
													</p>
												) : null}
												{phase === 'done' && approval === 'approved' ? (
													<>
														<SourceList sources={SOURCES} />
														<MessageActions
															copyText={answerText}
															feedback={feedback}
															onFeedback={setFeedback}
															onRegenerate={() => ask(question)}
														/>
													</>
												) : null}
											</MessageContent>
										</Message>
									</div>
								</MessageScrollerItem>
							)}
						</MessageScrollerContent>
					</MessageScrollerViewport>
					<MessageScrollerButton />
				</MessageScroller>
			</MessageScrollerProvider>
			<PromptInput
				busy={busy}
				onStop={() => {
					timers.current.forEach(clearTimeout)
					setPhase('stopped')
				}}
				onSubmit={({ text }) => ask(text)}
			/>
		</div>
	)
}

export const ひと通りの会話: Story = {
	render: () => <Conversation />,
}
