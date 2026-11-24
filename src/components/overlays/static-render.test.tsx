// @vitest-environment jsdom
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { Button } from '../basics/button'
import { Checkbox } from '../inputs/checkbox'
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from '../layout/collapsible'
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from './dialog'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from './dropdown-menu'
import { Popover, PopoverContent, PopoverTrigger } from './popover'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '../inputs/select'
import { DetailSheet } from './sheet'
import { Switch } from '../inputs/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../layout/tabs'
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from './tooltip'

// 閉じている部品を、サーバーと同じ静的な描画（renderToStaticMarkup）で描いても落ちないことを
// 確かめる。使う側（Field）は、選ぶ欄などを静的に描くテストを持っている。
// ポータルははじめの描画では出さない（Radix と同じ）。

describe('静的な描画（renderToStaticMarkup）', () => {
	it('閉じた Select を描ける（値あり・値なし）。placeholder が出る', () => {
		const html = renderToStaticMarkup(
			<>
				<Select value=''>
					<SelectTrigger aria-label='状態'>
						<SelectValue placeholder='選んでください' />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value='a'>あ</SelectItem>
					</SelectContent>
				</Select>
				<Select value='a'>
					<SelectTrigger aria-label='状態'>
						<SelectValue placeholder='選んでください' />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value='a'>あ</SelectItem>
					</SelectContent>
				</Select>
			</>,
		)
		expect(html).toContain('選んでください')
		expect(html).toContain('role="combobox"')
	})

	it('閉じた重なる物（Dialog・Sheet・Popover・Tooltip・DropdownMenu）を描ける', () => {
		const html = renderToStaticMarkup(
			<TooltipProvider>
				<Dialog>
					<DialogTrigger asChild>
						<Button>開く</Button>
					</DialogTrigger>
					<DialogContent>
						<DialogTitle>見出し</DialogTitle>
					</DialogContent>
				</Dialog>
				<DetailSheet open={false} onClose={() => {}} title='詳細'>
					中身
				</DetailSheet>
				<Popover>
					<PopoverTrigger>出す</PopoverTrigger>
					<PopoverContent>中身</PopoverContent>
				</Popover>
				<Tooltip>
					<TooltipTrigger>?</TooltipTrigger>
					<TooltipContent>助け</TooltipContent>
				</Tooltip>
				<DropdownMenu>
					<DropdownMenuTrigger>操作</DropdownMenuTrigger>
					<DropdownMenuContent>
						<DropdownMenuItem>設定</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</TooltipProvider>,
		)
		expect(html).toContain('開く')
		expect(html).toContain('操作')
		expect(html).not.toContain('role="dialog"')
	})

	it('Checkbox・Switch・Tabs・Collapsible を描ける', () => {
		const html = renderToStaticMarkup(
			<>
				<Checkbox aria-label='同意' checked />
				<Switch aria-label='通知' />
				<Tabs defaultValue='a'>
					<TabsList>
						<TabsTrigger value='a'>A</TabsTrigger>
					</TabsList>
					<TabsContent value='a'>中身 A</TabsContent>
				</Tabs>
				<Collapsible>
					<CollapsibleTrigger>詳しく</CollapsibleTrigger>
					<CollapsibleContent>隠れた中身</CollapsibleContent>
				</Collapsible>
			</>,
		)
		expect(html).toContain('role="checkbox"')
		expect(html).toContain('role="switch"')
		expect(html).toContain('中身 A')
	})
})
