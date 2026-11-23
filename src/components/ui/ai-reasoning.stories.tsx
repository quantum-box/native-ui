import type { Meta, StoryObj } from '@storybook/react-vite'

import { AiField } from './ai-field'
import { type AiReasoning, AiReasoningDetails } from './ai-reasoning'
import { AiLabel, AiValue } from './ai-suggestion'
import { FactValue, type FactSource } from './fact'
import { Input } from './input'
import { Label } from './label'

/**
 * AI が値を出した理由と判断の材料。データ基盤の値の出典と同じく、
 * AI の値に触れる・押す・キーボードで選んで Enter を押すと小さな枠で開く。
 * 何も渡さないときは、今どおり控えめな印だけになる。
 */
const meta = {
	title: 'Components/AI の判断の中身',
	component: AiReasoningDetails,
	args: { reasoning: {} },
} satisfies Meta<typeof AiReasoningDetails>

export default meta
type Story = StoryObj<typeof meta>

const WITH_REASON: AiReasoning = {
	reason:
		'業務用の 500g 袋が約 1,500 円で売られている相場から、1g あたりに直しました。',
	confidence: 'medium',
	model: 'Claude',
	createdAt: '2026年11月24日 10:42',
}

const WITH_INPUTS: AiReasoning = {
	reason: '似た名前の香辛料の相場から推し量りました。',
	inputs: ['材料の名前「八角」', '単位「g」', '（量や仕入れ先は渡していない）'],
	confidence: 0.72,
	model: 'Claude',
}

const LOW: AiReasoning = {
	reason:
		'「特製ダレ」は店ごとに中身が違うため、よくある焼き肉のたれの相場で代わりにしました。',
	inputs: '材料の名前「特製ダレ」と単位「ml」だけ',
	confidence: 0.3,
	model: 'Claude',
	createdAt: '2026年11月24日 10:42',
}

const RETAIL: FactSource = {
	name: '小売物価統計',
	asOf: '2026年10月',
	basis: '東京都区部の平均',
	url: 'https://www.stat.go.jp/data/kouri/',
}

function Sentence({
	reasoning,
	note,
}: Readonly<{ reasoning?: AiReasoning; note: string }>) {
	return (
		<div className='grid w-[30rem] gap-2 text-sm'>
			<p className='text-muted-foreground text-xs'>{note}</p>
			<p className='leading-relaxed'>
				八角の単価は 1g あたり{' '}
				<AiValue kind='AI の予想' reasoning={reasoning}>
					約 3 円
				</AiValue>{' '}
				です。値に触れるか、選んで Enter を押すと中身が開きます。
			</p>
		</div>
	)
}

export const 理由あり: Story = {
	render: () => (
		<Sentence
			note='理由・確からしさ・出した AI を渡した。'
			reasoning={WITH_REASON}
		/>
	),
}

export const 材料あり: Story = {
	render: () => (
		<Sentence
			note='AI に渡した物（判断の材料）も渡した。確からしさは数で渡した。'
			reasoning={WITH_INPUTS}
		/>
	),
}

export const 確からしさが低い: Story = {
	render: () => (
		<Sentence note='確からしさが低いと、点線と絵が橙になる。' reasoning={LOW} />
	),
}

export const 何もなし: Story = {
	render: () => (
		<Sentence note='何も渡さないと、控えめな印だけで枠は開かない。' />
	),
}

export const 中身だけ: Story = {
	render: () => (
		<div className='w-72 rounded-lg border border-border bg-popover p-3 shadow-overlay'>
			<AiReasoningDetails reasoning={WITH_INPUTS} title='AI の予想' />
		</div>
	),
}

/** 札の形の印と入力欄にも、同じ物を渡せる。 */
export const 印と入力欄にも: Story = {
	render: () => (
		<div className='grid w-[24rem] gap-5 text-sm'>
			<p className='flex items-center gap-2'>
				勘定科目は消耗品費
				<AiLabel reasoning={WITH_REASON}>AI の推測</AiLabel>
			</p>
			<div className='grid gap-1.5'>
				<Label htmlFor='reason-field'>八角の単価（円/g）</Label>
				<AiField reasoning={WITH_INPUTS} status='filled'>
					<Input
						className='text-right tabular-nums'
						defaultValue='3'
						id='reason-field'
					/>
				</AiField>
			</div>
			<div className='grid gap-1.5'>
				<Label htmlFor='reason-low'>特製ダレの単価（円/ml）</Label>
				<AiField reasoning={LOW} status='uncertain'>
					<Input
						className='text-right tabular-nums'
						defaultValue='1.2'
						id='reason-low'
					/>
				</AiField>
			</div>
		</div>
	),
}

/** データ基盤の値と並べる。どちらも触れると中身（出典・理由）が開く。 */
export const データ基盤の値と並べる: Story = {
	render: () => (
		<div className='grid w-[32rem] gap-3 text-sm'>
			<p className='leading-relaxed'>
				玉ねぎの単価は、データ基盤の相場で{' '}
				<FactValue source={RETAIL}>1kg あたり 380 円</FactValue>
				、AI の予想で{' '}
				<AiValue kind='AI の予想' reasoning={WITH_REASON}>
					1kg あたり約 400 円
				</AiValue>{' '}
				です。
			</p>
			<p className='text-muted-foreground text-xs'>
				青緑は出典のある事実、紫は AI
				の推測。どちらも触れると、出典や理由が開きます。
			</p>
		</div>
	),
}
