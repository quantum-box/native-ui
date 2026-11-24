import type { Meta, StoryObj } from '@storybook/react-vite'
import * as React from 'react'

import { Badge } from '../basics/badge'
import { Button } from '../basics/button'
import {
	DetailSheet,
	Sheet,
	SheetBody,
	SheetClose,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
	type SheetWidth,
} from './sheet'

/**
 * 画面の右端から出る詳細の画面。一覧で選んだ行の中身を、一覧を残したまま出す。
 * 見出しは上に残り、本文だけがスクロールする。×・Esc・外側を押すと閉じる。
 */
const meta = {
	title: '重なる物/Sheet',
	id: 'sheet',
	parameters: { layout: 'fullscreen' },
} satisfies Meta

export default meta
type Story = StoryObj

const ROWS = Array.from({ length: 40 }, (_, index) => ({
	label: `明細 ${index + 1}`,
	value: `¥${((index + 1) * 1280).toLocaleString('ja-JP')}`,
}))

function Body() {
	return (
		<dl className='divide-y divide-border px-4 text-sm'>
			{ROWS.map(row => (
				<div className='flex justify-between py-2' key={row.label}>
					<dt className='text-muted-foreground'>{row.label}</dt>
					<dd className='tabular-nums'>{row.value}</dd>
				</div>
			))}
		</dl>
	)
}

function Actions() {
	return (
		<div className='flex flex-wrap items-center gap-2'>
			<Badge variant='warning'>確認待ち</Badge>
			<Button size='sm' variant='primary'>
				承認する
			</Button>
			<Button size='sm'>差し戻す</Button>
		</div>
	)
}

function Opened({ width }: Readonly<{ width: SheetWidth }>) {
	const [open, setOpen] = React.useState(true)
	return (
		<div className='p-6'>
			<Button onClick={() => setOpen(true)}>詳細を開く</Button>
			<DetailSheet
				actions={<Actions />}
				description='2026年11月分・取引先 株式会社サンプル'
				onClose={() => setOpen(false)}
				open={open}
				title={`請求書 INV-2026-1104（幅 ${width}）`}
				width={width}
			>
				<Body />
			</DetailSheet>
		</div>
	)
}

export const 幅md: Story = {
	render: () => <Opened width='md' />,
}

export const 幅lg: Story = {
	render: () => <Opened width='lg' />,
}

export const 幅xl: Story = {
	render: () => <Opened width='xl' />,
}

/** 部品を組み合わせて作る形。下に操作の帯を置ける。 */
export const 組み立てて使う: Story = {
	render: () => (
		<div className='p-6'>
			<Sheet defaultOpen>
				<SheetTrigger asChild>
					<Button>取引先を編集</Button>
				</SheetTrigger>
				<SheetContent width='md'>
					<SheetHeader>
						<SheetTitle>取引先を編集</SheetTitle>
						<SheetDescription>
							変えた内容は保存すると反映されます。
						</SheetDescription>
					</SheetHeader>
					<SheetBody>
						<Body />
					</SheetBody>
					<SheetFooter>
						<SheetClose asChild>
							<Button variant='ghost'>やめる</Button>
						</SheetClose>
						<Button variant='primary'>保存</Button>
					</SheetFooter>
				</SheetContent>
			</Sheet>
		</div>
	),
}
