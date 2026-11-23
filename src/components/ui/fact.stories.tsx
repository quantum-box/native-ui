import type { Meta, StoryObj } from '@storybook/react-vite'
import * as React from 'react'

import { AiField } from './ai-field'
import { AiLabel, AiSuggestion, AiValue } from './ai-suggestion'
import {
	FactField,
	type FactFieldStatus,
	FactLabel,
	FactPanel,
	type FactSource,
	FactSourceDetails,
	FactValue,
} from './fact'
import { Input } from './input'
import { Label } from './label'

/**
 * データ基盤から来た事実（統計・市場価格などの実測データ）の部品（試作）。
 * AI の推測（グラデーション）と見分けられるよう、青緑の単色とデータの印で出す。
 * どの値にも出典（名前・時点・基にした値・元の資料）を付けられる。
 */
const meta = {
	title: 'Components/データ基盤の値（試作）',
	component: FactLabel,
} satisfies Meta<typeof FactLabel>

export default meta
type Story = StoryObj<typeof meta>

const RETAIL: FactSource = {
	name: '小売物価統計',
	asOf: '2026年10月',
	basis: '東京都区部の平均',
	url: 'https://www.stat.go.jp/data/kouri/',
}

const WHOLESALE: FactSource = {
	name: '東京都中央卸売市場 市況',
	asOf: '2026年11月第3週',
	basis: '豊洲市場・中値',
	url: 'https://www.shijou.metro.tokyo.lg.jp/',
}

const LONG: FactSource = {
	name: '農林水産省 食品価格動向調査（野菜・果実・畜産物・水産物）',
	asOf: '2026年11月第3週',
	basis: '全国の調査店舗の平均',
}

const OLD: FactSource = {
	name: '小売物価統計',
	asOf: '2025年4月',
	basis: '東京都区部の平均',
}

export const 印: Story = {
	render: () => (
		<div className='grid w-[30rem] gap-4 text-sm'>
			<div className='flex flex-wrap items-center gap-2'>
				<FactLabel />
				<FactLabel source={RETAIL} />
				<FactLabel showAsOf source={RETAIL} />
				<FactLabel>相場</FactLabel>
			</div>
			<div className='flex flex-wrap items-center gap-2'>
				<FactLabel source={LONG} />
				<FactLabel source={OLD} suffix='要確認' />
				<span className='text-muted-foreground text-xs'>
					長い出典名は省き、触れると全部見られる
				</span>
			</div>
			<p className='text-muted-foreground text-xs'>
				文の中では札ではなく、値そのものに印を付ける（FactValue・AiValue）。
			</p>
			<p className='leading-relaxed'>
				玉ねぎの単価は 1kg あたり <FactValue source={RETAIL}>380 円</FactValue>{' '}
				です。値に触れるか、選んで Enter を押すと出典を詳しく見られます。
				去年の春の値は{' '}
				<FactValue source={OLD} stale>
					350 円
				</FactValue>{' '}
				で、古いので確かめが要ります。
			</p>
			<p className='leading-relaxed'>
				AI の予想は <AiValue kind='AI の予想'>400 円</AiValue>
				、データ基盤の相場は <FactValue source={RETAIL}>380 円</FactValue>{' '}
				です。
			</p>
		</div>
	),
}

export const 出典の詳しい中身: Story = {
	render: () => (
		<div className='w-64 rounded-lg border border-border bg-popover p-3 shadow-overlay'>
			<FactSourceDetails source={RETAIL} />
		</div>
	),
}

const FIELD_STATES: Array<{
	status: FactFieldStatus
	title: string
	note: string
	source?: FactSource
}> = [
	{
		status: 'filled',
		title: 'データの値が入ったまま',
		note: '青緑の枠と「データ」の印。印に触れると出典が開く。',
		source: RETAIL,
	},
	{
		status: 'stale',
		title: 'データが古い',
		note: '橙の点線の枠と「データ・要確認」。',
		source: OLD,
	},
	{
		status: 'confirmed',
		title: '確かめた後',
		note: '薄い枠と「確認済み」。',
		source: RETAIL,
	},
	{
		status: 'edited',
		title: '人が直した',
		note: 'データの見た目は消え、小さく「直した」と残る。',
	},
	{ status: 'none', title: 'データは関わっていない', note: '普通の入力欄。' },
]

export const 入力欄の状態: Story = {
	render: () => (
		<div className='grid w-[36rem] gap-5'>
			{FIELD_STATES.map(({ status, title, note, source }) => (
				<div
					className='grid grid-cols-[9rem_1fr] items-start gap-3'
					key={status}
				>
					<div>
						<p className='font-medium text-sm'>{title}</p>
						<p className='text-muted-foreground text-xs'>{note}</p>
					</div>
					<FactField onConfirm={() => {}} source={source} status={status}>
						<Input
							aria-label={`玉ねぎの単価（${title}）`}
							className='text-right tabular-nums'
							defaultValue='380'
							inputMode='numeric'
						/>
					</FactField>
				</div>
			))}
		</div>
	),
}

/** 欄に重なる印。短い出典名・長い出典名・要確認・確認済みを並べる。 */
export const 出典名の長さ: Story = {
	render: () => (
		<div className='grid w-[22rem] gap-5'>
			{[
				{ label: '短い出典名', status: 'filled' as const, source: RETAIL },
				{ label: '長い出典名', status: 'filled' as const, source: LONG },
				{ label: 'データが古い', status: 'stale' as const, source: OLD },
				{
					label: '確かめた後（長い出典名）',
					status: 'confirmed' as const,
					source: LONG,
				},
				{ label: '出典名が無い', status: 'filled' as const, source: undefined },
			].map(({ label, status, source }) => (
				<div className='grid gap-1.5' key={label}>
					<Label>{label}</Label>
					<FactField onConfirm={() => {}} source={source} status={status}>
						<Input
							aria-label={label}
							className='text-right tabular-nums'
							defaultValue='380'
						/>
					</FactField>
				</div>
			))}
		</div>
	),
}

export const 入力欄の状態の移り変わり: Story = {
	render: function Render() {
		const [status, setStatus] = React.useState<FactFieldStatus>('filled')
		return (
			<div className='grid w-[20rem] gap-1.5'>
				<Label htmlFor='fact-try'>玉ねぎの単価（円/kg）</Label>
				<FactField
					onConfirm={() => setStatus('confirmed')}
					onEdit={() => setStatus('edited')}
					source={RETAIL}
					status={status}
				>
					<Input
						className='text-right tabular-nums'
						defaultValue='380'
						id='fact-try'
						inputMode='numeric'
					/>
				</FactField>
				<p className='text-muted-foreground text-xs'>
					文字を打つと「直した」に、✓ を押すと「確認済み」に変わります。
				</p>
			</div>
		)
	},
}

export const 値のまとまり: Story = {
	render: () => (
		<div className='w-[28rem]'>
			<FactPanel
				description='豊洲市場の今週の中値です。店の仕入れ値とは違うことがあります。'
				source={WHOLESALE}
				title='市場の相場'
			>
				<ul className='divide-y divide-border text-sm'>
					{[
						['まぐろ（めばち・生）', '¥3,240/kg'],
						['さけ（銀ざけ・養殖）', '¥1,180/kg'],
						['ぶり（養殖）', '¥1,560/kg'],
					].map(([name, price]) => (
						<li className='flex justify-between px-3 py-2' key={name}>
							<span>{name}</span>
							<span className='tabular-nums'>{price}</span>
						</li>
					))}
				</ul>
			</FactPanel>
		</div>
	),
}

/** AI の部品とデータ基盤の部品を横に並べる。色と形で出どころが分かること。 */
export const AIの部品と並べる: Story = {
	render: () => (
		<div className='grid w-[44rem] grid-cols-2 items-start gap-4'>
			<AiSuggestion description='名前と単位から予想した単価です。'>
				<p className='px-3 py-2 text-sm tabular-nums'>玉ねぎ ¥400/kg</p>
			</AiSuggestion>
			<FactPanel
				description='統計の実測値です。'
				source={RETAIL}
				title='データ基盤の相場'
			>
				<p className='px-3 py-2 text-sm tabular-nums'>玉ねぎ ¥380/kg</p>
			</FactPanel>
			<AiField status='filled'>
				<Input aria-label='AI が予想した単価' defaultValue='400' />
			</AiField>
			<FactField source={RETAIL} status='filled'>
				<Input aria-label='データ基盤の単価' defaultValue='380' />
			</FactField>
		</div>
	),
}

type Origin = 'receipt' | 'fact' | 'ai'

interface Line {
	name: string
	amount: string
	unitPrice: string
	cost: number
	origin: Origin
	source?: FactSource
	receipt?: string
}

const LINES: Line[] = [
	{
		name: '牛ひき肉',
		amount: '120g',
		unitPrice: '¥2.10/g',
		cost: 252,
		origin: 'receipt',
		receipt: '11月2日の仕入れ',
	},
	{
		name: '玉ねぎ',
		amount: '50g',
		unitPrice: '¥0.38/g',
		cost: 19,
		origin: 'fact',
		source: RETAIL,
	},
	{
		name: '卵',
		amount: '1/2個',
		unitPrice: '¥28/個',
		cost: 14,
		origin: 'fact',
		source: { ...RETAIL, basis: '東京都区部の平均・Lサイズ10個入り' },
	},
	{
		name: 'パン粉',
		amount: '10g',
		unitPrice: '¥0.90/g',
		cost: 9,
		origin: 'receipt',
		receipt: '10月28日の仕入れ',
	},
	{
		name: 'デミグラスソース',
		amount: '60g',
		unitPrice: '¥1.20/g',
		cost: 72,
		origin: 'ai',
	},
	{
		name: 'ナツメグ',
		amount: '0.2g',
		unitPrice: '¥12/g',
		cost: 2,
		origin: 'ai',
	},
]

const ORIGINS: Array<{ origin: Origin; title: string; note: string }> = [
	{
		origin: 'receipt',
		title: '実際の仕入単価',
		note: 'レシートから。この店の本当の値段なので、いちばん確か。印は付けない。',
	},
	{
		origin: 'fact',
		title: 'データ基盤の相場',
		note: '出典のある実測値。確かな数字だが、この店の仕入れ値とは違うことがある。',
	},
	{
		origin: 'ai',
		title: 'AI の予想',
		note: '材料の名前と単位からの推測。外れることがあるので、確かめてから使う。',
	},
]

function OriginMark({ line }: Readonly<{ line: Line }>) {
	if (line.origin === 'fact') return <FactLabel source={line.source} />
	if (line.origin === 'ai') return <AiLabel>AI の予想</AiLabel>
	return <span className='text-muted-foreground text-xs'>{line.receipt}</span>
}

/** 表の中の値。出どころに合わせて、値そのものに控えめな印を付ける。 */
function PriceValue({ line, text }: Readonly<{ line: Line; text: string }>) {
	if (line.origin === 'fact')
		return <FactValue source={line.source}>{text}</FactValue>
	if (line.origin === 'ai') return <AiValue kind='AI の予想'>約{text}</AiValue>
	return <>{text}</>
}

const yen = (value: number) => `¥${value.toLocaleString('ja-JP')}`

/**
 * 1 つのレシピの原価で、材料ごとに単価の出どころが違う状態。
 * 実際の仕入単価（印なし）・データ基盤の相場（事実）・AI の予想（推測）を並べ、
 * どの数字をどれだけ信じてよいかを一目で分かるようにする。
 */
export const 出どころの違いを並べる: Story = {
	parameters: { layout: 'padded' },
	render: () => {
		const total = LINES.reduce((sum, line) => sum + line.cost, 0)
		const by = (origin: Origin) =>
			LINES.filter(line => line.origin === origin).reduce(
				(sum, line) => sum + line.cost,
				0,
			)
		return (
			<div className='mx-auto grid w-full max-w-2xl gap-4'>
				<div>
					<p className='font-semibold text-base'>ハンバーグ（1 人前）の原価</p>
					<p className='text-muted-foreground text-xs'>
						単価の出どころが材料ごとに違います。印を見ると、どの数字をどれだけ信じてよいか分かります。
					</p>
				</div>

				<ul className='grid gap-2 rounded-lg border border-border bg-surface p-3 text-xs sm:grid-cols-3'>
					{ORIGINS.map(({ origin, title, note }) => (
						<li className='grid content-start gap-1' key={origin}>
							<span className='flex items-center gap-1.5 font-medium text-sm'>
								{origin === 'fact' ? <FactLabel>出典名</FactLabel> : null}
								{origin === 'ai' ? <AiLabel>AI の予想</AiLabel> : null}
								{origin === 'receipt' ? (
									<span className='inline-block h-4 w-6 rounded-full border border-border' />
								) : null}
								{title}
							</span>
							<span className='text-muted-foreground'>{note}</span>
						</li>
					))}
				</ul>

				<table className='w-full text-left text-sm'>
					<thead className='border-border border-b text-muted-foreground text-xs'>
						<tr>
							<th className='py-1.5 font-medium'>材料</th>
							<th className='py-1.5 font-medium'>使う量</th>
							<th className='py-1.5 text-right font-medium'>単価</th>
							<th className='py-1.5 text-right font-medium'>原価</th>
							<th className='py-1.5 pl-4 font-medium'>単価の出どころ</th>
						</tr>
					</thead>
					<tbody>
						{LINES.map(line => (
							<tr className='border-border border-b' key={line.name}>
								<td className='py-2'>{line.name}</td>
								<td className='py-2 tabular-nums'>{line.amount}</td>
								<td className={'py-2 text-right tabular-nums'}>
									<PriceValue line={line} text={line.unitPrice} />
								</td>
								<td className={'py-2 text-right tabular-nums'}>
									<PriceValue line={line} text={yen(line.cost)} />
								</td>
								<td className='py-2 pl-4'>
									<OriginMark line={line} />
								</td>
							</tr>
						))}
					</tbody>
					<tfoot>
						<tr>
							<td className='pt-2 font-semibold' colSpan={3}>
								合計
							</td>
							<td className='pt-2 text-right font-semibold tabular-nums'>
								約{yen(total)}
							</td>
							<td />
						</tr>
					</tfoot>
				</table>

				<dl className='grid grid-cols-3 gap-2 text-xs'>
					<div className='rounded-md border border-border p-2'>
						<dt className='text-muted-foreground'>実際の仕入単価から</dt>
						<dd className='font-semibold text-sm tabular-nums'>
							{yen(by('receipt'))}
						</dd>
					</div>
					<div className='rounded-md border border-teal-600/40 bg-teal-500/[0.06] p-2 dark:border-teal-400/35'>
						<dt className='flex items-center gap-1 text-muted-foreground'>
							<FactValue>相場</FactValue>から
						</dt>
						<dd className='font-semibold text-sm tabular-nums'>
							{yen(by('fact'))}
						</dd>
					</div>
					<div className='rounded-md border border-transparent p-2 [background:linear-gradient(hsl(var(--nui-background)),hsl(var(--nui-background)))_padding-box,linear-gradient(to_right,#8b5cf6,#d946ef,#0ea5e9)_border-box]'>
						<dt className='flex items-center gap-1 text-muted-foreground'>
							<AiValue kind='AI の予想'>AI の予想</AiValue>から
						</dt>
						<dd className='font-semibold text-sm tabular-nums'>
							約{yen(by('ai'))}
						</dd>
					</div>
				</dl>
			</div>
		)
	},
}
