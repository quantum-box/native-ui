import type { Meta, StoryObj } from '@storybook/react-vite'

import { AiValue } from '../ai/ai-suggestion'
import { Badge } from '../basics/badge'
import { FactValue } from '../fact/fact'
import { DescriptionItem, DescriptionList } from './description-list'

/**
 * 名前と値の並び（DescriptionList）。詳細の画面で「取引先：〇〇商店」のように、
 * 表示だけの値を並べる。入力欄は Field を使う。
 *
 * 同じ行の組は、名前が折り返しても値の上端がそろう。長い値は箱の中で折り返し、
 * 箱の外へはみ出さない。値が無いときは「—」を出す。
 */
const meta = {
	title: '並べる・見せる/DescriptionList',
	id: 'description-list',
	component: DescriptionList,
} satisfies Meta<typeof DescriptionList>

export default meta
type Story = StoryObj<typeof meta>

/** 名前を上、値を下に置いた組を、箱の幅に入るだけ横に並べる。 */
export const 基本: Story = {
	render: () => (
		<div className='w-[48rem] max-w-full'>
			<DescriptionList columns={4}>
				<DescriptionItem label='取引先'>読取文具店</DescriptionItem>
				<DescriptionItem label='取引日'>2026-11-23</DescriptionItem>
				<DescriptionItem emphasis label='合計' numeric>
					￥1,200
				</DescriptionItem>
				<DescriptionItem label='状態'>
					<Badge variant='success'>承認済み</Badge>
				</DescriptionItem>
				<DescriptionItem label='メモ'>{null}</DescriptionItem>
				<DescriptionItem label='登録番号' mono>
					T1234567890123
				</DescriptionItem>
			</DescriptionList>
		</div>
	),
}

/** 値が無いときは「—」。文は並び全体でも、1 組だけでも変えられる。 */
export const 値が無いとき: Story = {
	render: () => (
		<div className='w-[36rem] max-w-full'>
			<DescriptionList columns={3} empty='未設定'>
				<DescriptionItem label='比重（g/ml）' />
				<DescriptionItem label='歩留まり' />
				<DescriptionItem empty='未読取・要確認' label='登録番号' />
			</DescriptionList>
		</div>
	),
}

/**
 * 名前が長くて折り返す組と、短い組が同じ行に並んでも、値の上端がそろう。
 * 切れ目の無い長い値（ID・URL）も、箱の中で折り返す。
 */
export const 長い名前と長い値: Story = {
	render: () => (
		<div className='w-[26rem] max-w-full rounded-md border border-border p-4'>
			<DescriptionList columns={3}>
				<DescriptionItem label='請求書に書かれた口座（取引先マスタには反映しない）'>
					みずほ銀行 渋谷支店 普通 1234567
				</DescriptionItem>
				<DescriptionItem label='支払期日'>2026-12-31</DescriptionItem>
				<DescriptionItem label='ID' mono wrap='anywhere'>
					rcpt_01ks18jhh1xvggktfzjx5jqsen_0123456789abcdef
				</DescriptionItem>
				<DescriptionItem full label='メモ' wrap='pre'>
					{'月末にまとめて支払う。\n振込手数料は先方の負担。'}
				</DescriptionItem>
			</DescriptionList>
		</div>
	),
}

/** 名前を左、値を右に置いた行を縦に並べる。狭い箱では名前が上に来る。 */
export const 横に並べる行: Story = {
	render: () => (
		<div className='w-[36rem] max-w-full'>
			<DescriptionList labelWidth='9rem' layout='inline'>
				<DescriptionItem label='種類'>問い合わせ</DescriptionItem>
				<DescriptionItem label='回答者'>
					山田 太郎（yamada@example.com）
				</DescriptionItem>
				<DescriptionItem label='受付番号' mono>
					INQ-2026-000123
				</DescriptionItem>
				<DescriptionItem label='添付' />
			</DescriptionList>
		</div>
	),
}

/** 値に、AI の値・データ基盤の値の印を置ける。 */
export const AIの値とデータ基盤の値: Story = {
	render: () => (
		<div className='w-[42rem] max-w-full'>
			<DescriptionList columns={3}>
				<DescriptionItem label='取引先'>
					<AiValue kind='AI の読み取り'>読取文具店</AiValue>
				</DescriptionItem>
				<DescriptionItem label='合計' numeric>
					<AiValue
						kind='AI の読み取り'
						reasoning={{ confidence: 'low', reason: '数字がかすれている' }}
					>
						￥1,200
					</AiValue>
				</DescriptionItem>
				<DescriptionItem label='相場（100g）' numeric>
					<FactValue source={{ asOf: '2026年10月', name: '小売物価統計' }}>
						￥298
					</FactValue>
				</DescriptionItem>
			</DescriptionList>
		</div>
	),
}

/** 右の詳細ほどの狭い箱では、列を減らす。 */
export const 狭い箱: Story = {
	render: () => (
		<div className='w-64 rounded-md border border-border p-3'>
			<DescriptionList columns={4}>
				<DescriptionItem label='基準の単位'>g</DescriptionItem>
				<DescriptionItem label='比重（g/ml）' />
				<DescriptionItem label='歩留まり'>85%</DescriptionItem>
				<DescriptionItem label='メモ'>
					皮と種を除いた重さで計算する
				</DescriptionItem>
			</DescriptionList>
		</div>
	),
}

/** 広い画面でも、箱が狭ければ（右の詳細の中など）名前が上、値が下に来る。 */
export const 狭い箱の横に並べる行: Story = {
	render: () => (
		<div className='w-56 rounded-md border border-border p-3'>
			<DescriptionList labelWidth='9rem' layout='inline'>
				<DescriptionItem label='種類'>問い合わせ</DescriptionItem>
				<DescriptionItem label='回答者'>
					山田 太郎（yamada@example.com）
				</DescriptionItem>
			</DescriptionList>
		</div>
	),
}
