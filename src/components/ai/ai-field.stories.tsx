import type { Meta, StoryObj } from '@storybook/react-vite'
import * as React from 'react'

import { AiField, type AiFieldStatus } from './ai-field'
import { Button } from '../basics/button'
import { Input } from '../inputs/input'
import { Label } from '../basics/label'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '../inputs/select'

/**
 * AI が値を入れた入力欄を、入力欄そのものの見た目で分かるようにする包み。
 * `AiSuggestion` と同じグラデーションの枠と薄い地を使う。
 * 人が直すと AI の見た目は消え、「直した」の印に変わる。
 */
const meta = {
	title: 'AI/AiField',
	component: AiField,
} satisfies Meta<typeof AiField>

export default meta
type Story = StoryObj<typeof meta>

/** native-ui にはまだ Textarea が無いので、Input と同じ見た目の textarea を使う。 */
const textareaClass =
	'flex min-h-16 w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm text-foreground transition-colors duration-fast placeholder:text-subtle-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/25'

const STATUSES: Array<{ status: AiFieldStatus; title: string; note: string }> =
	[
		{
			status: 'filled',
			title: 'AI が入れたまま',
			note: 'まだ人が見ていない。右上の ✓ で「これでよい」にできる。',
		},
		{
			status: 'filling',
			title: '処理中',
			note: 'AI が入れている途中。枠の色が流れる。',
		},
		{
			status: 'uncertain',
			title: '確からしさが低い',
			note: 'AI の判断・要確認。橙の混ざった枠にする。',
		},
		{
			status: 'confirmed',
			title: '確かめた後',
			note: '人が「これでよい」とした。枠は薄くなり、確認済みの印が付く。',
		},
		{
			status: 'edited',
			title: '人が直した',
			note: 'AI の見た目は消え、小さく「直した」と残る。',
		},
		{ status: 'none', title: 'AI は関わっていない', note: '普通の入力欄。' },
	]

export const 状態の一覧: Story = {
	args: { status: 'filled', children: <Input /> },
	render: () => (
		<div className='grid w-[36rem] gap-5'>
			{STATUSES.map(({ status, title, note }) => (
				<div
					className='grid grid-cols-[9rem_1fr] items-start gap-3'
					key={status}
				>
					<div>
						<p className='font-medium text-sm'>{title}</p>
						<p className='text-muted-foreground text-xs'>{note}</p>
					</div>
					<AiField onConfirm={() => {}} status={status}>
						<Input
							aria-label={title}
							defaultValue={
								status === 'filling' ? '株式会社サン…' : '株式会社サンプル商事'
							}
						/>
					</AiField>
				</div>
			))}
		</div>
	),
}

/** 入力欄の種類ごと。文字・選択・長い文・日付・金額。 */
export const 入力欄の種類: Story = {
	args: { status: 'filled', children: <Input /> },
	render: () => (
		<div className='grid w-[24rem] gap-4'>
			<div className='grid gap-1.5'>
				<Label htmlFor='kind-text'>支払先</Label>
				<AiField status='filled'>
					<Input defaultValue='株式会社サンプル商事' id='kind-text' />
				</AiField>
			</div>
			<div className='grid gap-1.5'>
				<Label htmlFor='kind-select'>店</Label>
				<Select defaultValue='shibuya'>
					<AiField status='filled'>
						<SelectTrigger id='kind-select'>
							<SelectValue />
						</SelectTrigger>
					</AiField>
					<SelectContent>
						<SelectItem value='shibuya'>渋谷店</SelectItem>
						<SelectItem value='shinjuku'>新宿店</SelectItem>
						<SelectItem value='ikebukuro'>池袋店</SelectItem>
					</SelectContent>
				</Select>
			</div>
			<div className='grid gap-1.5'>
				<Label htmlFor='kind-textarea'>摘要</Label>
				<AiField status='uncertain'>
					<textarea
						className={textareaClass}
						defaultValue='打ち合わせの飲食代（4 名）。参加者は請求書から読み取れなかったため推測。'
						id='kind-textarea'
					/>
				</AiField>
			</div>
			<div className='grid grid-cols-2 gap-3'>
				<div className='grid gap-1.5'>
					<Label htmlFor='kind-date'>日付</Label>
					<AiField status='filled'>
						<Input defaultValue='2026-11-04' id='kind-date' type='date' />
					</AiField>
				</div>
				<div className='grid gap-1.5'>
					<Label htmlFor='kind-amount'>金額（円）</Label>
					<AiField status='filled'>
						<Input
							className='text-right tabular-nums'
							defaultValue='12,800'
							id='kind-amount'
							inputMode='numeric'
						/>
					</AiField>
				</div>
			</div>
		</div>
	),
}

/** 状態の移り変わり。文字を打つと「直した」に、✓ を押すと「確認済み」に変わる。 */
export const 状態の移り変わり: Story = {
	args: { status: 'filled', children: <Input /> },
	render: function Render() {
		const [status, setStatus] = React.useState<AiFieldStatus>('filled')
		const [store, setStore] = React.useState('shibuya')
		const [storeStatus, setStoreStatus] =
			React.useState<AiFieldStatus>('uncertain')
		return (
			<div className='grid w-[24rem] gap-4'>
				<div className='grid gap-1.5'>
					<Label htmlFor='try-payee'>支払先</Label>
					<AiField
						onConfirm={() => setStatus('confirmed')}
						onEdit={() => setStatus('edited')}
						status={status}
					>
						<Input defaultValue='株式会社サンプル商事' id='try-payee' />
					</AiField>
				</div>
				<div className='grid gap-1.5'>
					<Label htmlFor='try-store'>店</Label>
					<Select
						onValueChange={value => {
							setStore(value)
							setStoreStatus('edited')
						}}
						value={store}
					>
						<AiField
							onConfirm={() => setStoreStatus('confirmed')}
							status={storeStatus}
						>
							<SelectTrigger id='try-store'>
								<SelectValue />
							</SelectTrigger>
						</AiField>
						<SelectContent>
							<SelectItem value='shibuya'>渋谷店</SelectItem>
							<SelectItem value='shinjuku'>新宿店</SelectItem>
							<SelectItem value='ikebukuro'>池袋店</SelectItem>
						</SelectContent>
					</Select>
				</div>
				<Button
					className='justify-self-start'
					onClick={() => {
						setStatus('filled')
						setStoreStatus('uncertain')
						setStore('shibuya')
					}}
					size='sm'
				>
					元に戻す
				</Button>
			</div>
		)
	},
}

/** 証憑の読み取り。日付・支払先・金額・店を AI が埋め、金額だけ人が直した。 */
export const フォームの中で: Story = {
	args: { status: 'filled', children: <Input /> },
	render: () => (
		<form
			className='grid w-[30rem] gap-4 rounded-lg border border-border bg-surface p-4'
			onSubmit={event => event.preventDefault()}
		>
			<div>
				<p className='font-semibold text-sm'>領収書の読み取り結果</p>
				<p className='text-muted-foreground text-xs'>
					AI
					が読み取って入れた欄は色の付いた枠で出ます。確かめてから登録してください。
				</p>
			</div>
			<div className='grid grid-cols-2 gap-3'>
				<div className='grid gap-1.5'>
					<Label htmlFor='form-date'>日付</Label>
					<AiField onConfirm={() => {}} status='filled'>
						<Input defaultValue='2026-11-04' id='form-date' type='date' />
					</AiField>
				</div>
				<div className='grid gap-1.5'>
					<Label htmlFor='form-amount'>金額（円）</Label>
					<AiField status='edited'>
						<Input
							className='text-right tabular-nums'
							defaultValue='12,800'
							id='form-amount'
							inputMode='numeric'
						/>
					</AiField>
				</div>
			</div>
			<div className='grid gap-1.5'>
				<Label htmlFor='form-payee'>支払先</Label>
				<AiField status='confirmed'>
					<Input defaultValue='株式会社サンプル商事' id='form-payee' />
				</AiField>
			</div>
			<div className='grid gap-1.5'>
				<Label htmlFor='form-store'>店</Label>
				<Select defaultValue='shibuya'>
					<AiField onConfirm={() => {}} status='uncertain'>
						<SelectTrigger id='form-store'>
							<SelectValue />
						</SelectTrigger>
					</AiField>
					<SelectContent>
						<SelectItem value='shibuya'>渋谷店</SelectItem>
						<SelectItem value='shinjuku'>新宿店</SelectItem>
					</SelectContent>
				</Select>
			</div>
			<div className='grid gap-1.5'>
				<Label htmlFor='form-memo'>メモ</Label>
				<AiField status='none'>
					<textarea
						className={textareaClass}
						id='form-memo'
						placeholder='人が書く欄'
					/>
				</AiField>
			</div>
			<div className='flex justify-end gap-2'>
				<Button variant='ghost'>やめる</Button>
				<Button type='submit' variant='primary'>
					登録する
				</Button>
			</div>
		</form>
	),
}
