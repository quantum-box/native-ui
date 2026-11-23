import type { Meta, StoryObj } from '@storybook/react-vite'
import * as React from 'react'

import { type ChatAttachment, PromptInput } from './chat-prompt-input'

/**
 * AI に問いを送る欄。Enter で送り、Shift+Enter で改行する（変換中の Enter では送らない）。
 * 答えが届いている途中は「止める」に変わる。ファイルは置く・貼る・クリップで選ぶ、で足せる。
 */
const meta = {
	title: 'Components/AI のチャット/PromptInput（送る欄）',
	parameters: { layout: 'padded' },
} satisfies Meta

export default meta
type Story = StoryObj

/** 見本の画像（小さな四角）。 */
const SAMPLE_IMAGE =
	'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect width="24" height="24" fill="%23a78bfa"/><rect x="4" y="12" width="16" height="8" fill="%23fbbf24"/></svg>'

const SAMPLE: ChatAttachment[] = [
	{
		id: '0',
		name: '店の写真.png',
		size: 84_000,
		type: 'image/png',
		previewUrl: SAMPLE_IMAGE,
	},
	{ id: '1', name: '領収書_11月.pdf', size: 248_000, type: 'application/pdf' },
	{
		id: '2',
		name: 'レシート.jpg',
		size: 1_200_000,
		type: 'image/jpeg',
		status: 'uploading',
	},
	{
		id: '3',
		name: 'とても長い名前の取引先一覧_2026年度_最新版.csv',
		size: 32_000,
		type: 'text/csv',
	},
	{
		id: '4',
		name: '大きすぎる動画.mov',
		type: 'video/quicktime',
		status: 'error',
		error: '32MB を超えています',
	},
]

function Frame({ children }: Readonly<{ children: React.ReactNode }>) {
	return <div className='mx-auto w-full max-w-xl'>{children}</div>
}

export const 空: Story = {
	render: () => (
		<Frame>
			<PromptInput onSubmit={() => {}} />
		</Frame>
	),
}

export const 文字数の目安: Story = {
	render: () => (
		<Frame>
			<PromptInput
				defaultValue={
					'先月の売上を店ごとに出して、\n前の月と比べて増えた店と減った店を教えて。'
				}
				maxLength={60}
				onSubmit={() => {}}
			/>
		</Frame>
	),
}

export const 添付あり: Story = {
	render: () => (
		<Frame>
			<PromptInput
				attachments={SAMPLE}
				defaultValue='この領収書を仕訳にして'
				maxAttachments={10}
				onAddFiles={() => {}}
				onRemoveAttachment={() => {}}
				onSubmit={() => {}}
			/>
		</Frame>
	),
}

export const 届いている途中: Story = {
	render: () => (
		<Frame>
			<PromptInput busy onStop={() => {}} onSubmit={() => {}} />
		</Frame>
	),
}

/** 送る・止める・添付を実際に試す。送った物は下に出る。 */
export const 触って試す: Story = {
	render: function Render() {
		const [attachments, setAttachments] = React.useState<ChatAttachment[]>([])
		const [busy, setBusy] = React.useState(false)
		const [sent, setSent] = React.useState<string[]>([])
		const timer = React.useRef<ReturnType<typeof setTimeout>>()
		return (
			<Frame>
				<div className='grid gap-3'>
					<PromptInput
						accept='image/*,.pdf,.csv,.txt'
						attachments={attachments}
						busy={busy}
						maxAttachments={5}
						maxLength={2000}
						onAddFiles={files =>
							setAttachments(previous => [
								...previous,
								...files.map(file => ({
									id: `${file.name}-${file.lastModified}-${Math.random()}`,
									name: file.name,
									size: file.size,
									type: file.type,
								})),
							])
						}
						onRemoveAttachment={id =>
							setAttachments(previous => previous.filter(a => a.id !== id))
						}
						onStop={() => {
							clearTimeout(timer.current)
							setBusy(false)
							setSent(previous => [...previous, '（止めました）'])
						}}
						onSubmit={({ text, attachments: files }) => {
							setSent(previous => [
								...previous,
								`${text}${files.length ? `（添付 ${files.length} 件）` : ''}`,
							])
							setAttachments([])
							setBusy(true)
							timer.current = setTimeout(() => setBusy(false), 3000)
						}}
					/>
					<ul className='grid gap-1 text-muted-foreground text-xs'>
						{sent.map((text, index) => (
							// 送った順に並べるだけ
							<li key={`${index}-${text}`}>送った: {text}</li>
						))}
					</ul>
				</div>
			</Frame>
		)
	},
}
