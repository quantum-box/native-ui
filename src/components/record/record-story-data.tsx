/**
 * 記録の部品の story で使う、例の種類とシステムの決まり（商品・取引先・店・担当者）。
 * アプリが 1 か所で決める形の例。story からだけ使う。
 */
import {
	Building2,
	ClipboardList,
	FileText,
	List,
	Package,
	Plus,
	Store,
	UserRound,
} from 'lucide-react'
import * as React from 'react'

import {
	type RecordSystemDefinition,
	defineRecordKind,
	recordActions,
} from './record'

// ---- アプリが 1 か所で決める、記録の種類ごとの決まり（例） --------------------

export type Customer = {
	id: string
	name: string
	code: string
	city: string
	balance: number
}
export type Product = {
	id: string
	name: string
	sku: string
	price: number
	stock: number
}
export type Shop = { id: string; name: string; area: string }
export type Member = { id: string; name: string; kana: string; team: string }

export const yen = (value: number) => `¥${value.toLocaleString('ja-JP')}`

export function Facts({ rows }: { rows: [string, string][] }) {
	return (
		<dl className='grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs'>
			{rows.map(([term, value]) => (
				<React.Fragment key={term}>
					<dt className='text-muted-foreground'>{term}</dt>
					<dd className='text-foreground'>{value}</dd>
				</React.Fragment>
			))}
		</dl>
	)
}
export function PreviewTitle({ children }: { children: React.ReactNode }) {
	return <p className='mb-2 font-medium text-sm'>{children}</p>
}

export const CUSTOMERS: Customer[] = [
	{
		id: 'c1',
		name: '山田商店',
		code: 'C-0001',
		city: '大阪市',
		balance: 128000,
	},
	{ id: 'c2', name: '鈴木食品', code: 'C-0002', city: '京都市', balance: 0 },
	{
		id: 'c3',
		name: 'みどり青果',
		code: 'C-0003',
		city: '神戸市',
		balance: 46200,
	},
]
export const PRODUCTS: Product[] = [
	{
		id: 'p1',
		name: 'りんごジュース 1L',
		sku: 'SKU-1001',
		price: 380,
		stock: 120,
	},
	{
		id: 'p2',
		name: '冷凍ブルーベリー',
		sku: 'SKU-1002',
		price: 1280,
		stock: 8,
	},
	{ id: 'p3', name: '紙コップ 200ml', sku: 'SKU-2001', price: 540, stock: 300 },
	{ id: 'p4', name: 'ボールペン 黒', sku: 'SKU-3001', price: 120, stock: 0 },
]
export const SHOPS: Shop[] = [
	{ id: 's1', name: '梅田店', area: '大阪' },
	{ id: 's2', name: '四条店', area: '京都' },
	{ id: 's3', name: '三宮店', area: '神戸' },
]
export const MEMBERS: Member[] = [
	{ id: 'm1', name: '佐藤 花子', kana: 'さとう はなこ', team: '営業1課' },
	{ id: 'm2', name: '高橋 健', kana: 'たかはし けん', team: '営業2課' },
	{ id: 'm3', name: '伊藤 美咲', kana: 'いとう みさき', team: '店舗運営' },
]

/** システムごとの決まり（名前・絵・色の印）。アプリが 1 か所で決める。 */
export const SYSTEMS = {
	catalog: { name: '商品管理', icon: Package, tone: 'amber' },
	crm: { name: '顧客管理', icon: Building2, tone: 'blue' },
	stores: { name: '店舗管理', icon: Store, tone: 'teal' },
	hr: { name: '人事', icon: UserRound, tone: 'violet' },
} satisfies Record<string, RecordSystemDefinition>

export const KINDS = {
	customer: defineRecordKind<Customer>({
		name: '取引先',
		icon: Building2,
		getId: customer => customer.id,
		getLabel: customer => customer.name,
		getDescription: customer => customer.code,
		system: 'crm',
		getHref: customer => `/customers/${customer.id}`,
		getActions: customer => [
			recordActions.newTab(`/customers/${customer.id}`),
			{
				label: 'この取引先の請求書を見る',
				icon: FileText,
				href: `/invoices?customer=${customer.id}`,
			},
			recordActions.copy(customer.code, 'コードをコピー'),
		],
		renderPreview: customer => (
			<>
				<PreviewTitle>{customer.name}</PreviewTitle>
				<Facts
					rows={[
						['コード', customer.code],
						['所在地', customer.city],
						['売掛残高', yen(customer.balance)],
					]}
				/>
			</>
		),
		useCandidates: () => ({ records: CUSTOMERS }),
		missingText: '削除された取引先',
	}),
	product: defineRecordKind<Product>({
		name: '商品',
		icon: Package,
		getId: product => product.id,
		getLabel: product => product.name,
		getDescription: product => product.sku,
		system: 'catalog',
		getHref: product => `/products/${product.id}`,
		getActions: product => [
			recordActions.newTab(`/products/${product.id}`),
			{
				label: 'この商品の受注を見る',
				icon: ClipboardList,
				href: `/orders?product=${product.id}`,
			},
			recordActions.copy(product.sku, '品番をコピー'),
		],
		renderPreview: product => (
			<>
				<PreviewTitle>{product.name}</PreviewTitle>
				<Facts
					rows={[
						['品番', product.sku],
						['単価', yen(product.price)],
						['在庫', product.stock ? `${product.stock}個` : '在庫なし'],
					]}
				/>
			</>
		),
		useCandidates: () => ({ records: PRODUCTS }),
		missingText: '販売をやめた商品',
	}),
	shop: defineRecordKind<Shop>({
		name: '店',
		icon: Store,
		getId: shop => shop.id,
		getLabel: shop => shop.name,
		getDescription: shop => shop.area,
		system: 'stores',
		getHref: shop => `/shops/${shop.id}`,
		renderPreview: shop => (
			<>
				<PreviewTitle>{shop.name}</PreviewTitle>
				<Facts rows={[['地域', shop.area]]} />
			</>
		),
		getActions: shop => [recordActions.newTab(`/shops/${shop.id}`)],
		pickerActions: [
			{ label: '店舗管理で新しく作る', icon: Plus, href: '/shops/new' },
			{ label: '店舗管理で一覧を開く', icon: List, href: '/shops' },
		],
		useCandidates: () => ({ records: SHOPS }),
		forbiddenText: 'ほかの地域の店です',
	}),
	member: defineRecordKind<Member>({
		name: '担当者',
		icon: UserRound,
		getId: member => member.id,
		getLabel: member => member.name,
		getDescription: member => member.team,
		getKeywords: member => [member.kana],
		system: 'hr',
		getHref: member => `/staff/${member.id}`,
		openLabel: '社員名簿で開く',
		pickerActions: [
			{ label: '社員名簿で一覧を開く', icon: List, href: '/staff' },
		],
		getActions: member => [
			{
				label: 'この担当者の作業を見る',
				icon: ClipboardList,
				href: `/tasks?member=${member.id}`,
			},
			recordActions.copy(member.id),
		],
		renderAvatar: member => (
			<span className='flex h-5 w-5 items-center justify-center rounded-full bg-primary/15 font-medium text-[10px] text-primary'>
				{member.name.slice(0, 1)}
			</span>
		),
		renderPreview: member => (
			<>
				<PreviewTitle>{member.name}</PreviewTitle>
				<Facts
					rows={[
						['よみ', member.kana],
						['所属', member.team],
					]}
				/>
			</>
		),
		useCandidates: () => ({ records: MEMBERS }),
		missingText: '退職した担当者',
	}),
}
