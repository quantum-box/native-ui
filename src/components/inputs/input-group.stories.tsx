import type { Meta, StoryObj } from '@storybook/react-vite'
import { ArrowUp, AtSign, Paperclip, Search, X } from 'lucide-react'
import * as React from 'react'

import { Button } from '../basics/button'
import { Kbd } from '../basics/kbd'
import {
	InputGroup,
	InputGroupAddon,
	InputGroupButton,
	InputGroupInput,
	InputGroupText,
	InputGroupTextarea,
} from './input-group'

/**
 * 入力欄に、ボタンや印や文字を付ける囲み。使い方は shadcn の InputGroup と同じ。
 */
const meta = {
	title: '入力/InputGroup',
	component: InputGroup,
} satisfies Meta<typeof InputGroup>

export default meta
type Story = StoryObj<typeof meta>

function Examples() {
	const [query, setQuery] = React.useState('倉庫')
	return (
		<div className='grid w-96 gap-4'>
			<InputGroup>
				<InputGroupAddon>
					<Search />
				</InputGroupAddon>
				<InputGroupInput
					aria-label='検索'
					placeholder='商品を検索'
					value={query}
					onChange={event => setQuery(event.target.value)}
				/>
				<InputGroupAddon align='inline-end'>
					<Kbd>⌘K</Kbd>
					{query ? (
						<InputGroupButton
							size='icon-xs'
							aria-label='消す'
							onClick={() => setQuery('')}
						>
							<X />
						</InputGroupButton>
					) : null}
				</InputGroupAddon>
			</InputGroup>

			<InputGroup>
				<InputGroupAddon>
					<InputGroupText>¥</InputGroupText>
				</InputGroupAddon>
				<InputGroupInput aria-label='金額' defaultValue='3,200' />
				<InputGroupAddon align='inline-end'>
					<InputGroupText>税込</InputGroupText>
				</InputGroupAddon>
			</InputGroup>

			<InputGroup>
				<InputGroupAddon>
					<AtSign />
				</InputGroupAddon>
				<InputGroupInput
					aria-label='メール'
					defaultValue='taro@'
					aria-invalid
				/>
			</InputGroup>

			<InputGroup>
				<InputGroupInput
					aria-label='読むだけ'
					readOnly
					defaultValue='tn_01hacme'
				/>
				<InputGroupAddon align='inline-end'>
					<InputGroupButton>写す</InputGroupButton>
				</InputGroupAddon>
			</InputGroup>

			<InputGroup>
				<InputGroupInput
					aria-label='無効'
					disabled
					placeholder='いまは書けません'
				/>
			</InputGroup>

			<Composer />
		</div>
	)
}

/** チャットの送る欄のような形。下の帯にボタンを並べる */
function Composer() {
	const [text, setText] = React.useState('')
	return (
		<InputGroup>
			<InputGroupTextarea
				aria-label='質問'
				placeholder='データの傾向や、次の施策を相談する…'
				maxRows={6}
				value={text}
				onChange={event => setText(event.target.value)}
			/>
			<InputGroupAddon align='block-end'>
				<InputGroupButton size='icon-xs' aria-label='ファイルを添付'>
					<Paperclip />
				</InputGroupButton>
				<span className='ml-auto text-xs'>⌘Enter で送信</span>
				<InputGroupButton
					size='icon-xs'
					variant='default'
					type='submit'
					aria-label='送る'
					disabled={!text.trim()}
				>
					<ArrowUp />
				</InputGroupButton>
			</InputGroupAddon>
		</InputGroup>
	)
}

/** 種類と状態の一覧。ライトとダークを並べる */
export const 状態の一覧: Story = {
	render: () => (
		<div className='grid grid-cols-2 gap-4'>
			{(['light', 'dark'] as const).map(theme => (
				<div
					key={theme}
					className={`${theme === 'dark' ? 'dark' : ''} rounded-lg border border-border bg-background p-4 text-foreground`}
				>
					<Examples />
				</div>
			))}
		</div>
	),
}

/** 送る欄。Field の AI に聞く欄と同じ書き方（align='block-end'・size='icon-sm' など） */
export const 送る欄: Story = {
	render: function Render() {
		const [question, setQuestion] = React.useState('')
		return (
			<form
				className='w-[28rem]'
				onSubmit={event => {
					event.preventDefault()
					setQuestion('')
				}}
			>
				<InputGroup className='h-auto flex-col items-stretch overflow-hidden rounded-2xl bg-muted/20 shadow-sm'>
					<InputGroupTextarea
						aria-label='質問'
						className='max-h-40 min-h-14 px-4 pt-4 pb-2 leading-relaxed'
						placeholder='データの傾向や、次の施策を相談する…'
						value={question}
						onChange={event => setQuestion(event.target.value)}
						onKeyDown={event => {
							if (
								event.key === 'Enter' &&
								event.metaKey &&
								!event.nativeEvent.isComposing
							) {
								event.preventDefault()
								event.currentTarget.form?.requestSubmit()
							}
						}}
					/>
					<InputGroupAddon
						align='block-end'
						className='flex-wrap justify-end px-3 pt-0 pb-3'
					>
						<Button type='button' variant='secondary'>
							分析を取り消す
						</Button>
						<InputGroupButton
							aria-label='質問する'
							className='size-9 rounded-full'
							disabled={!question.trim()}
							type='submit'
							variant='default'
							size='icon-sm'
						>
							<ArrowUp />
						</InputGroupButton>
					</InputGroupAddon>
				</InputGroup>
			</form>
		)
	},
}
