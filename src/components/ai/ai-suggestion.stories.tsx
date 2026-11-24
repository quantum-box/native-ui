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
	id: 'ai-suggestion',
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

/** 使う側が 3 色目を上書きした例（水色）。ライトとダークで別の値を書く */
const OVERRIDE = {
	light: { '--nui-ai-3': '197.1 99.2% 50%' },
	dark: { '--nui-ai-3': '197 55% 46%' },
} as const

function Marks({ title }: { title: string }) {
	return (
		<div className='grid gap-2'>
			<p className='text-muted-foreground text-xs'>{title}</p>
			<div className='flex flex-wrap items-center gap-2'>
				<AiBestMatchBadge />
				<AiLabel />
				<AiValue>消耗品費</AiValue>
			</div>
			<AiSuggestion>
				<Choices />
			</AiSuggestion>
		</div>
	)
}

/**
 * AI の印は、どれも ai-1 → ai-2 → ai-3 の 3 色のグラデーション。
 * `--nui-ai-1`〜`--nui-ai-3` を上書きすると、どの AI の部品も同じように色が変わる。
 */
export const 色を上書きする: Story = {
	args: { children: null },
	render: () => (
		<div className='grid w-[56rem] grid-cols-2 gap-4'>
			{(['light', 'dark'] as const).map(theme => (
				<div
					key={theme}
					className={`${theme === 'dark' ? 'dark' : ''} grid gap-4 rounded-lg border border-border bg-background p-4 text-foreground`}
				>
					<Marks
						title={`${theme === 'dark' ? 'ダーク' : 'ライト'}・そのまま`}
					/>
					<div style={OVERRIDE[theme] as React.CSSProperties}>
						<Marks
							title={`${theme === 'dark' ? 'ダーク' : 'ライト'}・3 色目を水色に上書き`}
						/>
					</div>
				</div>
			))}
		</div>
	),
}
