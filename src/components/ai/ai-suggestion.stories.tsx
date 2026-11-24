import type { Meta, StoryObj } from '@storybook/react-vite'

import {
	AiBestMatchBadge,
	AiLabel,
	AiSuggestion,
	AiValue,
} from './ai-suggestion'

/**
 * AI が出した物の見た目。候補の囲み・いちばん近い印・文の中の小さな印を、
 * どの画面でも同じ見た目で出す。
 */
const meta = {
	title: 'AI/AiSuggestion',
	component: AiSuggestion,
} satisfies Meta<typeof AiSuggestion>

export default meta
type Story = StoryObj<typeof meta>

const PRODUCTS = [
	{ name: 'コーラ 500ml', price: '¥180' },
	{ name: 'コーラ ゼロ 500ml', price: '¥180' },
	{ name: 'ジンジャーエール 500ml', price: '¥170' },
]

function Choices() {
	return (
		<fieldset className='divide-y divide-border'>
			<legend className='sr-only'>AI のおすすめの商品</legend>
			{PRODUCTS.map((product, index) => (
				<label
					className='flex cursor-pointer items-center gap-3 px-3 py-2 text-sm hover:bg-muted/50'
					key={product.name}
				>
					<input defaultChecked={index === 0} name='product' type='radio' />
					<span className='inline-flex min-w-0 flex-1 flex-wrap items-center gap-1.5'>
						{product.name}
						{index === 0 ? <AiBestMatchBadge /> : null}
					</span>
					<span className='tabular-nums'>{product.price}</span>
				</label>
			))}
		</fieldset>
	)
}

export const 候補の一覧: Story = {
	args: {
		description:
			'「コーフ」を含む商品はありません。AI が同じ物を指していそうだと判断した商品です。確かめてから選んでください。',
		children: <Choices />,
	},
	render: args => (
		<div className='w-[28rem]'>
			<AiSuggestion {...args} />
		</div>
	),
}

export const 説明なし: Story = {
	args: { children: <Choices /> },
	render: 候補の一覧.render,
}

export const 見出しを変える: Story = {
	args: {
		title: 'AI の返信案',
		description: '送る前に中身を確かめてください。',
		children: (
			<p className='px-3 py-2 text-sm'>
				お問い合わせありがとうございます。ご予約の日時を確認いたしました。
			</p>
		),
	},
	render: 候補の一覧.render,
}

export const 印: Story = {
	args: { children: null },
	render: () => (
		<div className='grid w-[28rem] gap-3 text-sm'>
			<div className='flex items-center gap-2'>
				<AiBestMatchBadge />
				<AiLabel />
				<AiLabel>AI の判定</AiLabel>
				<AiLabel>AI の推測</AiLabel>
			</div>
			<p>
				店舗は「<AiValue kind='AI の判定'>渋谷店</AiValue>」として登録します。
				違っていれば選び直してください。
			</p>
			<table className='w-full text-left'>
				<thead className='text-muted-foreground text-xs'>
					<tr>
						<th className='py-1 font-medium'>勘定科目</th>
						<th className='py-1 font-medium'>金額</th>
					</tr>
				</thead>
				<tbody>
					<tr className='border-border border-t'>
						<td className='py-1.5'>
							<AiValue>消耗品費</AiValue>
						</td>
						<td className='py-1.5 tabular-nums'>¥3,200</td>
					</tr>
					<tr className='border-border border-t'>
						<td className='py-1.5'>旅費交通費</td>
						<td className='py-1.5 tabular-nums'>¥1,140</td>
					</tr>
				</tbody>
			</table>
		</div>
	),
}
