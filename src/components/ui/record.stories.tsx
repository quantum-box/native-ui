import type { Meta, StoryObj } from '@storybook/react-vite'
import * as React from 'react'

import { Bubble, BubbleContent } from './bubble'
import { Button } from './button'
import { CitationMark, SourceList } from './chat-citations'
import { Label } from './label'
import { Message, MessageContent } from './message'
import {
	RecordCard,
	RecordChip,
	RecordKindProvider,
	RecordMention,
} from './record'
import { RecordList, type RecordListItem } from './record-list'
import { RecordPicker } from './record-picker'
import {
	CUSTOMERS,
	type Customer,
	KINDS,
	MEMBERS,
	type Member,
	PRODUCTS,
	SHOPS,
	SYSTEMS,
	type Shop,
	yen,
} from './record-story-data'

/**
 * 別の業務の記録（取引先・商品・店・担当者など）を出す部品。表のセルだけでなく、詳細の画面・フォーム・
 * 文の中・AI の返事の出典・通知などでも、同じ見た目と動きで出せる。
 *
 * - `RecordKindProvider`: 種類とシステムの決まりの登録（アプリに 1 つ）
 * - `RecordChip`（`RecordLink`）: 絵と名前。押すと詳細へ、触れる（↓）と要点のカード
 * - `RecordMention`: 文の中で使う控えめな形
 * - `RecordCard`: 要点のカード（システムの帯・要点・「〜で開く」と操作）
 * - `RecordPicker`: フォームで記録を選ぶ欄（候補の枠は表の付け替えと同じ）
 * - `RecordList`: 記録の一覧（関係する記録・出典など）
 *
 * 表のセルでの使い方は「Components/DataTableRecordCell」。この例では、記録を押したときの移動先を下に出している。
 */
const meta = {
	title: 'Components/Record',
	parameters: { layout: 'padded' },
	decorators: [
		Story => {
			const [moved, setMoved] = React.useState<string | null>(null)
			return (
				<RecordKindProvider kinds={KINDS} systems={SYSTEMS} navigate={setMoved}>
					<Story />
					<p className='mt-4 text-muted-foreground text-xs' role='status'>
						{moved
							? `移動先: ${moved}（実際のアプリでは詳細の画面へ移る）`
							: '記録を押すと、ここに移動先が出る。触れる（またはフォーカスして ↓）と要点と操作が出る。'}
					</p>
				</RecordKindProvider>
			)
		},
	],
} satisfies Meta

export default meta
type Story = StoryObj

function CardFrame({ children }: { children: React.ReactNode }) {
	return (
		<div className='w-80 max-w-full overflow-hidden rounded-lg border border-border bg-popover text-popover-foreground shadow-overlay'>
			{children}
		</div>
	)
}

// ---- 要点のカード ----------------------------------------------------------------

/**
 * 触れたときに出る要点のカードを、4 種類並べて開いたまま見せる。
 * 上に種類とシステム、下に「{システム}で開く」と種類ごとの操作が出る。
 * 最後の 2 つは消えた記録と見る権限が無い記録で、開けないことと理由を出す。
 */
export const Cards: Story = {
	name: '要点のカード',
	render: () => (
		<div className='flex flex-wrap items-start gap-4'>
			<CardFrame>
				<RecordCard kind='product' record={PRODUCTS[0]} />
			</CardFrame>
			<CardFrame>
				<RecordCard kind='customer' record={CUSTOMERS[0]} />
			</CardFrame>
			<CardFrame>
				<RecordCard kind='shop' record={SHOPS[0]} />
			</CardFrame>
			<CardFrame>
				<RecordCard kind='member' record={MEMBERS[0]} />
			</CardFrame>
			<CardFrame>
				<RecordCard kind='product' status='missing' />
			</CardFrame>
			<CardFrame>
				<RecordCard kind='customer' status='forbidden' />
			</CardFrame>
		</div>
	),
}

/**
 * 今の画面が「商品管理」のとき。同じ商品管理の記録（商品）はふつうのカード、
 * 別のシステムの記録（取引先・担当者）は、色の帯と線のあるカードで出る。
 * `RecordKindProvider` の `currentSystem` で今の画面のシステムを決める。
 */
export const SameAndOtherSystem: Story = {
	name: '同じシステムと別のシステム',
	render: () => (
		<RecordKindProvider kinds={KINDS} systems={SYSTEMS} currentSystem='catalog'>
			<p className='mb-3 text-muted-foreground text-xs'>今の画面: 商品管理</p>
			<div className='flex flex-wrap items-start gap-4'>
				<div className='space-y-1'>
					<p className='text-muted-foreground text-xs'>同じシステム（商品）</p>
					<CardFrame>
						<RecordCard kind='product' record={PRODUCTS[1]} />
					</CardFrame>
				</div>
				<div className='space-y-1'>
					<p className='text-muted-foreground text-xs'>
						別のシステム（取引先）
					</p>
					<CardFrame>
						<RecordCard kind='customer' record={CUSTOMERS[2]} />
					</CardFrame>
				</div>
				<div className='space-y-1'>
					<p className='text-muted-foreground text-xs'>
						別のシステム（担当者）
					</p>
					<CardFrame>
						<RecordCard kind='member' record={MEMBERS[1]} />
					</CardFrame>
				</div>
			</div>
		</RecordKindProvider>
	),
}

// ---- 詳細の画面の関係する記録 ------------------------------------------------------

const RELATED: RecordListItem[] = [
	{ key: 'c1', kind: 'customer', record: CUSTOMERS[1], meta: '注文元' },
	{ key: 'm1', kind: 'member', record: MEMBERS[1], meta: '担当' },
	{ key: 'm2', kind: 'member', record: MEMBERS[2], meta: '承認' },
	{ key: 's1', kind: 'shop', record: SHOPS[1], meta: '出荷元' },
	{
		key: 'p1',
		kind: 'product',
		record: PRODUCTS[2],
		meta: `${yen(PRODUCTS[2].price)} × 40`,
	},
	{
		key: 'p2',
		kind: 'product',
		record: PRODUCTS[0],
		meta: `${yen(PRODUCTS[0].price)} × 12`,
	},
	{ key: 'p9', kind: 'product', status: 'missing', meta: '× 3' },
	{ key: 'c9', kind: 'customer', status: 'forbidden', meta: '請求先' },
]

function DetailPanel() {
	return (
		<aside className='w-[420px] max-w-full space-y-4 rounded-lg border border-border bg-background p-4'>
			<header className='space-y-1'>
				<p className='text-muted-foreground text-xs'>受注</p>
				<h3 className='font-semibold text-base'>SO-1002</h3>
				<p className='text-muted-foreground text-sm'>
					2026/11/24 · ¥38,900 · 出荷待ち
				</p>
			</header>
			<RecordList title='関係する記録' items={RELATED} groupByKind />
		</aside>
	)
}

/**
 * 詳細の画面（右から出る詳細など）の「関係する記録」。種類ごとにまとめ、右に関係の名前や数を出す。
 * どの記録も表のセルと同じ絵・名前・要点のカードで、消えた・見る権限が無い記録も同じ出し方になる。
 */
export const RelatedRecords: Story = {
	name: '詳細の画面の関係する記録',
	render: () => <DetailPanel />,
}

// ---- フォームで記録を選ぶ ----------------------------------------------------------

function FormExample() {
	const [customer, setCustomer] = React.useState<Customer | null>(CUSTOMERS[0])
	const [member, setMember] = React.useState<Member | null>(null)
	const [shop, setShop] = React.useState<Shop | null>(SHOPS[1])
	return (
		<form
			className='grid w-[420px] max-w-full gap-4 rounded-lg border border-border bg-background p-4'
			onSubmit={event => event.preventDefault()}
		>
			<h3 className='font-semibold text-base'>受注を作る</h3>
			<div className='grid gap-1.5'>
				<Label htmlFor='order-customer'>取引先</Label>
				<RecordPicker<Customer>
					id='order-customer'
					kind='customer'
					value={customer}
					onChange={setCustomer}
				/>
			</div>
			<div className='grid gap-1.5'>
				<Label htmlFor='order-member'>担当者</Label>
				<RecordPicker<Member>
					id='order-member'
					kind='member'
					value={member}
					onChange={setMember}
					allowEmpty
					placeholder='担当者を選ぶ（任意）'
				/>
			</div>
			<div className='grid gap-1.5'>
				<Label htmlFor='order-shop'>出荷元の店</Label>
				<RecordPicker<Shop>
					id='order-shop'
					kind='shop'
					value={shop}
					onChange={setShop}
				/>
			</div>
			<p className='text-muted-foreground text-xs'>
				選んだもの: {customer?.name ?? '—'} / {member?.name ?? '担当者なし'} /{' '}
				{shop?.name ?? '—'}
			</p>
			<div className='flex justify-end'>
				<Button type='submit' variant='primary'>
					作る
				</Button>
			</div>
		</form>
	)
}

/**
 * フォームの中で記録を選ぶ（`RecordPicker`）。選んでいる記録は表のセルと同じ絵と名前で出る。
 * 候補の枠は表の付け替えと同じで、別のシステムから選ぶときは色の帯・検索欄の文言（例「店舗管理の店を検索…」）・
 * 下の道筋（「店舗管理で新しく作る」など）が付く。担当者は読み仮名でも探せ、「未設定」に戻せる。
 */
export const FormPicker: Story = {
	name: 'フォームで記録を選ぶ',
	render: () => <FormExample />,
}

// ---- 文の中の記録 ----------------------------------------------------------------

function Prose() {
	return (
		<div className='max-w-[560px] space-y-3 text-sm leading-relaxed'>
			<p>
				<RecordMention kind='customer' record={CUSTOMERS[0]} /> から、
				<RecordMention kind='product' record={PRODUCTS[1]} />{' '}
				の追加の注文がありました。担当は{' '}
				<RecordMention kind='member' record={MEMBERS[0]} /> です。出荷は{' '}
				<RecordMention kind='shop' record={SHOPS[0]} /> から行います。
			</p>
			<p>
				前回の注文に入っていた <RecordMention kind='product' status='missing' />{' '}
				は、もう扱っていません。請求先の{' '}
				<RecordMention kind='customer' status='forbidden' />{' '}
				は、経理の人に確かめてください。
			</p>
			<p className='text-base'>
				大きな文字の中でも、
				<RecordMention kind='customer' record={CUSTOMERS[2]} />{' '}
				のように、まわりの文字の大きさのまま出る。
			</p>
		</div>
	)
}

/**
 * 文の中の記録（`RecordMention`）。まわりの文字の大きさのまま、小さな絵と点線の下線で記録だと分かる。
 * 触れる・フォーカスすると、表のセルと同じ要点のカード（「〜で開く」）が出る。消えた・見る権限が無い記録も同じ。
 */
export const InText: Story = {
	name: '文の中の記録',
	render: () => <Prose />,
}

// ---- AI の返事の出典 --------------------------------------------------------------

const SOURCES: RecordListItem[] = [
	{
		key: 'c',
		kind: 'customer',
		record: CUSTOMERS[0],
		meta: '売掛残高',
	},
	{
		key: 'p',
		kind: 'product',
		record: PRODUCTS[1],
		badge: '変えた',
		meta: '在庫を 8 → 20',
	},
	{ key: 'm', kind: 'member', record: MEMBERS[0], meta: '担当' },
]

function ChatExample() {
	return (
		<div className='grid w-[560px] max-w-full gap-4'>
			<Message align='end'>
				<MessageContent>
					<Bubble align='end' variant='muted'>
						<BubbleContent>山田商店の今月の状況を教えて</BubbleContent>
					</Bubble>
				</MessageContent>
			</Message>
			<Message>
				<MessageContent>
					<Bubble variant='ghost'>
						<BubbleContent>
							<p className='leading-relaxed'>
								<RecordMention kind='customer' record={CUSTOMERS[0]} />{' '}
								の売掛残高は {yen(CUSTOMERS[0].balance)} です
								<CitationMark
									source={{
										id: '1',
										title: '売掛金の明細（2026年11月）',
										kind: '会計',
										excerpt: '11/20 時点の未入金 3 件の合計。',
									}}
								/>
								。よく注文される{' '}
								<RecordMention kind='product' record={PRODUCTS[1]} />{' '}
								は在庫が少なかったので、20 個に増やしました。担当の{' '}
								<RecordMention kind='member' record={MEMBERS[0]} />{' '}
								に知らせています。
							</p>
						</BubbleContent>
					</Bubble>
					<RecordList title='この返事で使った記録' items={SOURCES} />
					<SourceList
						title='参照した資料'
						sources={[
							{
								id: '1',
								title: '売掛金の明細（2026年11月）',
								kind: '会計',
							},
						]}
					/>
				</MessageContent>
			</Message>
		</div>
	)
}

/**
 * AI の返事の出典として記録を出す。返事の文の中は `RecordMention`、返事の下の一覧は `RecordList` で、
 * どちらも表のセルと同じ要点のカード（「〜で開く」）が出る。変えた記録には「変えた」の印を付ける。
 * 記録でない資料（明細の抜き出しなど）は、これまでどおりチャットの `CitationMark`・`SourceList` で出す。
 */
export const AiSources: Story = {
	name: 'AI の返事の出典',
	render: () => <ChatExample />,
}

// ---- スマホの幅 -----------------------------------------------------------------

/**
 * スマホの幅（375px）。関係する記録・フォームで選ぶ・文の中の記録が、はみ出さずに収まる。
 * 要点のカードと候補の枠は、画面の幅に合わせて縮む。
 */
export const Mobile: Story = {
	name: 'スマホの幅',
	render: () => (
		<div className='w-[375px] space-y-6 border-border border-x px-4 py-2'>
			<DetailPanel />
			<FormExample />
			<Prose />
			<div className='flex flex-wrap gap-2'>
				<RecordChip kind='customer' record={CUSTOMERS[1]} />
				<RecordChip kind='product' status='loading' />
			</div>
		</div>
	),
}
