// @vitest-environment jsdom
import { type ReactNode, act, useEffect, useRef, useState } from 'react'
import { type Root, createRoot } from 'react-dom/client'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import { Button } from '../basics/button'
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogTitle,
	DialogTrigger,
} from './dialog'
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from './dropdown-menu'
import {
	Popover,
	PopoverAnchor,
	PopoverContent,
	PopoverTrigger,
} from './popover'
import { DetailSheet } from './sheet'
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from './tooltip'

// 重なる物（Dialog・Sheet・Popover・Tooltip・DropdownMenu）が、
// Radix のときと同じ使い方・同じ動きになることを確かめる。

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
let root: Root | undefined
beforeAll(() => {
	vi.stubGlobal(
		'ResizeObserver',
		class {
			observe() {}
			unobserve() {}
			disconnect() {}
		},
	)
	Element.prototype.scrollIntoView = vi.fn()
	Element.prototype.hasPointerCapture = vi.fn(() => false)
	Element.prototype.releasePointerCapture = vi.fn()
})
afterEach(async () => {
	await act(async () => root?.unmount())
	root = undefined
	document.body.innerHTML = ''
	document.body.removeAttribute('style')
	document.documentElement.removeAttribute('style')
})
async function render(node: ReactNode) {
	const el = document.createElement('div')
	el.id = 'app'
	document.body.appendChild(el)
	root = createRoot(el)
	await act(async () => root?.render(node))
	return el
}
const wait = (ms = 30) => new Promise(r => setTimeout(r, ms))

/** 指で押すのと同じ順番でイベントを出す */
async function press(el: Element) {
	const Pointer = (globalThis.PointerEvent ?? MouseEvent) as typeof MouseEvent
	const init = {
		bubbles: true,
		cancelable: true,
		button: 0,
		pointerType: 'mouse',
	}
	await act(async () => {
		el.dispatchEvent(new Pointer('pointerdown', init))
		el.dispatchEvent(new MouseEvent('mousedown', init))
		;(el as HTMLElement).focus?.()
		el.dispatchEvent(new Pointer('pointerup', init))
		el.dispatchEvent(new MouseEvent('mouseup', init))
		el.dispatchEvent(new MouseEvent('click', init))
		await wait()
	})
}
async function key(
	key: string,
	target: Element | null = document.activeElement,
) {
	await act(async () => {
		;(target ?? document.body).dispatchEvent(
			new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }),
		)
		await wait()
	})
}
const byRole = (role: string) =>
	document.querySelector<HTMLElement>(`[role="${role}"]`)

function SimpleDialog(props: {
	onOpenChange?: (open: boolean) => void
	onEscapeKeyDown?: (e: KeyboardEvent) => void
	onCloseAutoFocus?: (e: Event) => void
	afterClose?: React.RefObject<HTMLButtonElement | null>
}) {
	return (
		<Dialog onOpenChange={props.onOpenChange}>
			<DialogTrigger asChild>
				<Button>開く</Button>
			</DialogTrigger>
			<DialogContent
				onEscapeKeyDown={props.onEscapeKeyDown}
				onCloseAutoFocus={props.onCloseAutoFocus}
			>
				<DialogTitle>見出し</DialogTitle>
				<DialogDescription>説明</DialogDescription>
				<input aria-label='名前' defaultValue='初めの値' />
				<DialogClose asChild>
					<Button>やめる</Button>
				</DialogClose>
			</DialogContent>
		</Dialog>
	)
}

describe('Dialog', () => {
	it('asChild の Trigger で開き、読み上げの情報と data-state が付く', async () => {
		const onOpenChange = vi.fn()
		const el = await render(<SimpleDialog onOpenChange={onOpenChange} />)
		const trigger = el.querySelector('button') as HTMLButtonElement
		expect(trigger.textContent).toBe('開く')
		expect(trigger.getAttribute('aria-haspopup')).toBe('dialog')
		expect(trigger.getAttribute('aria-expanded')).toBe('false')
		expect(trigger.getAttribute('data-state')).toBe('closed')
		await press(trigger)
		expect(onOpenChange).toHaveBeenLastCalledWith(true)
		const dialog = byRole('dialog') as HTMLElement
		expect(dialog).not.toBeNull()
		// ポータルで body の直下へ出る
		expect(el.contains(dialog)).toBe(false)
		expect(dialog.getAttribute('data-state')).toBe('open')
		expect(trigger.getAttribute('aria-expanded')).toBe('true')
		expect(trigger.getAttribute('data-state')).toBe('open')
		const title = document.getElementById(
			dialog.getAttribute('aria-labelledby') ?? '',
		)
		expect(title?.textContent).toBe('見出し')
		const description = document.getElementById(
			dialog.getAttribute('aria-describedby') ?? '',
		)
		expect(description?.textContent).toBe('説明')
	})

	it('開くと中の最初の入力欄へフォーカスが移る', async () => {
		const el = await render(<SimpleDialog />)
		await press(el.querySelector('button') as HTMLElement)
		await act(async () => wait(50))
		const input = document.activeElement as HTMLInputElement
		expect(input.getAttribute('aria-label')).toBe('名前')
		// Radix と同じく、入っている文字を選んだ状態にする
		expect(input.selectionStart).toBe(0)
		expect(input.selectionEnd).toBe('初めの値'.length)
	})

	it('中に操作できる物が無いとき、右上の × ではなく中身そのものへフォーカスを置く', async () => {
		const el = await render(
			<Dialog>
				<DialogTrigger asChild>
					<button type='button'>開く</button>
				</DialogTrigger>
				<DialogContent>
					<DialogTitle>読むだけ</DialogTitle>
					<DialogDescription>説明</DialogDescription>
				</DialogContent>
			</Dialog>,
		)
		await press(el.querySelector('button') as HTMLElement)
		await act(async () => wait(50))
		const corner = document.querySelector('[data-corner-close]')
		expect(corner).not.toBeNull()
		expect(document.activeElement).not.toBe(corner)
		expect(document.activeElement).toBe(byRole('dialog'))
	})

	it('中の欄に autoFocus があれば、その欄にフォーカスを置いたままにする', async () => {
		const el = await render(
			<Dialog>
				<DialogTrigger asChild>
					<button type='button'>開く</button>
				</DialogTrigger>
				<DialogContent>
					<DialogTitle>見出し</DialogTitle>
					<DialogDescription>説明</DialogDescription>
					<input aria-label='検索' autoFocus />
				</DialogContent>
			</Dialog>,
		)
		await press(el.querySelector('button') as HTMLElement)
		await act(async () => wait(50))
		expect(document.activeElement?.getAttribute('aria-label')).toBe('検索')
	})

	it('2 つ目の欄に autoFocus があれば、先頭の欄へ動かし直さない', async () => {
		const el = await render(
			<Dialog>
				<DialogTrigger asChild>
					<button type='button'>開く</button>
				</DialogTrigger>
				<DialogContent>
					<DialogTitle>見出し</DialogTitle>
					<DialogDescription>説明</DialogDescription>
					<input aria-label='1 つ目' />
					<input aria-label='2 つ目' autoFocus />
				</DialogContent>
			</Dialog>,
		)
		await press(el.querySelector('button') as HTMLElement)
		await act(async () => wait(50))
		expect(document.activeElement?.getAttribute('aria-label')).toBe('2 つ目')
	})

	it('Esc で閉じ、フォーカスは開いたボタンへ戻る', async () => {
		const onOpenChange = vi.fn()
		const el = await render(<SimpleDialog onOpenChange={onOpenChange} />)
		const trigger = el.querySelector('button') as HTMLButtonElement
		await press(trigger)
		await act(async () => wait(50))
		await key('Escape')
		await act(async () => wait(50))
		expect(onOpenChange).toHaveBeenLastCalledWith(false)
		expect(byRole('dialog')).toBeNull()
		expect(document.activeElement).toBe(trigger)
	})

	it('DialogClose の asChild で閉じる', async () => {
		const onOpenChange = vi.fn()
		const el = await render(<SimpleDialog onOpenChange={onOpenChange} />)
		await press(el.querySelector('button') as HTMLElement)
		const close = Array.from(
			(byRole('dialog') as HTMLElement).querySelectorAll('button'),
		).find(b => b.textContent === 'やめる') as HTMLButtonElement
		expect(close.getAttribute('type')).toBe('button')
		await press(close)
		await act(async () => wait(50))
		expect(onOpenChange).toHaveBeenLastCalledWith(false)
		expect(byRole('dialog')).toBeNull()
	})

	it('onEscapeKeyDown で preventDefault() すると閉じない', async () => {
		const onOpenChange = vi.fn()
		const el = await render(
			<SimpleDialog
				onOpenChange={onOpenChange}
				onEscapeKeyDown={e => e.preventDefault()}
			/>,
		)
		await press(el.querySelector('button') as HTMLElement)
		await act(async () => wait(50))
		await key('Escape')
		expect(byRole('dialog')).not.toBeNull()
		expect(onOpenChange).not.toHaveBeenCalledWith(false)
	})

	it('onCloseAutoFocus で preventDefault() すると、自分で決めた所へフォーカスを置ける', async () => {
		function Demo() {
			const other = useRef<HTMLButtonElement>(null)
			return (
				<>
					<SimpleDialog
						onCloseAutoFocus={e => {
							e.preventDefault()
							other.current?.focus()
						}}
					/>
					<button ref={other} type='button'>
						ほか
					</button>
				</>
			)
		}
		const el = await render(<Demo />)
		await press(el.querySelector('button') as HTMLElement)
		await act(async () => wait(50))
		await key('Escape')
		await act(async () => wait(80))
		expect(byRole('dialog')).toBeNull()
		expect(document.activeElement?.textContent).toBe('ほか')
	})

	it('open と onOpenChange で外から開け閉めできる', async () => {
		function Demo() {
			const [open, setOpen] = useState(false)
			return (
				<>
					<button type='button' onClick={() => setOpen(true)}>
						外から開く
					</button>
					<Dialog open={open} onOpenChange={setOpen}>
						<DialogContent>
							<DialogTitle>見出し</DialogTitle>
						</DialogContent>
					</Dialog>
				</>
			)
		}
		const el = await render(<Demo />)
		expect(byRole('dialog')).toBeNull()
		await press(el.querySelector('button') as HTMLElement)
		expect(byRole('dialog')).not.toBeNull()
		await key('Escape')
		await act(async () => wait(50))
		expect(byRole('dialog')).toBeNull()
	})
})

describe('DetailSheet', () => {
	it('開いたとき、右上の × にフォーカスを置かない', async () => {
		await render(
			<DetailSheet open onClose={() => {}} title='詳細'>
				<p>読み込み中…</p>
			</DetailSheet>,
		)
		await act(async () => wait(50))
		const corner = document.querySelector('[data-corner-close]')
		expect(corner).not.toBeNull()
		expect(document.activeElement).not.toBe(corner)
	})

	it('open で出て、Esc で onClose を呼ぶ', async () => {
		const onClose = vi.fn()
		await render(
			<DetailSheet open onClose={onClose} title='詳細'>
				中身
			</DetailSheet>,
		)
		const dialog = byRole('dialog') as HTMLElement
		expect(dialog).not.toBeNull()
		expect(dialog.getAttribute('data-state')).toBe('open')
		expect(dialog.textContent).toContain('中身')
		await act(async () => wait(50))
		await key('Escape')
		expect(onClose).toHaveBeenCalledTimes(1)
	})

	it('右上の × の読み上げ名は「閉じる」', async () => {
		await render(
			<DetailSheet open onClose={() => {}} title='詳細'>
				中身
			</DetailSheet>,
		)
		const close = Array.from(
			(byRole('dialog') as HTMLElement).querySelectorAll('button'),
		).find(b => b.textContent === '閉じる')
		expect(close).toBeTruthy()
	})
})

describe('Popover', () => {
	it('asChild の Trigger で開き、Esc で閉じてフォーカスが戻る', async () => {
		const onOpenChange = vi.fn()
		const el = await render(
			<Popover onOpenChange={onOpenChange}>
				<PopoverTrigger asChild>
					<Button>絞り込み</Button>
				</PopoverTrigger>
				<PopoverContent align='start' aria-label='絞り込みの中身'>
					<button type='button'>中のボタン</button>
				</PopoverContent>
			</Popover>,
		)
		const trigger = el.querySelector('button') as HTMLButtonElement
		expect(trigger.getAttribute('aria-haspopup')).toBe('dialog')
		expect(trigger.getAttribute('data-state')).toBe('closed')
		await press(trigger)
		expect(onOpenChange).toHaveBeenLastCalledWith(true)
		const popup = byRole('dialog') as HTMLElement
		expect(popup).not.toBeNull()
		expect(el.contains(popup)).toBe(false)
		expect(popup.getAttribute('data-state')).toBe('open')
		expect(popup.getAttribute('data-align')).toBe('start')
		expect(popup.getAttribute('aria-label')).toBe('絞り込みの中身')
		expect(trigger.getAttribute('data-state')).toBe('open')
		expect(trigger.getAttribute('aria-expanded')).toBe('true')
		await act(async () => wait(50))
		await key('Escape')
		await act(async () => wait(50))
		expect(onOpenChange).toHaveBeenLastCalledWith(false)
		expect(byRole('dialog')).toBeNull()
		expect(document.activeElement).toBe(trigger)
	})
})

describe('Popover のはじめのフォーカス', () => {
	it('中にリンクしか無ければ、リンクではなく中身そのものにフォーカスを置く', async () => {
		const el = await render(
			<Popover>
				<PopoverTrigger>出典</PopoverTrigger>
				<PopoverContent>
					<a href='#src'>元の資料を開く</a>
				</PopoverContent>
			</Popover>,
		)
		await press(el.querySelector('button') as HTMLElement)
		await act(async () => wait(50))
		expect(document.activeElement).toBe(byRole('dialog'))
	})
})

describe('Popover の Tab と外を押したとき', () => {
	function Demo() {
		return (
			<>
				<Popover>
					<PopoverTrigger>開く</PopoverTrigger>
					<PopoverContent>
						<input aria-label='一つ目' />
						<input aria-label='二つ目' />
					</PopoverContent>
				</Popover>
				<button type='button'>外のボタン</button>
			</>
		)
	}

	it('中の最後で Tab を押すと、中の最初へ戻る（外へ出ない）', async () => {
		const el = await render(<Demo />)
		await press(el.querySelector('button') as HTMLElement)
		await act(async () => wait(50))
		const [first, second] = Array.from(
			(byRole('dialog') as HTMLElement).querySelectorAll('input'),
		)
		await act(async () => second.focus())
		await key('Tab', second)
		expect(document.activeElement).toBe(first)
		await key('Tab', first)
		// 途中ではふつうの Tab に任せる（止めない）
		expect(document.activeElement).toBe(first)
	})

	it('外を押して閉じたときは、開いたボタンへフォーカスを戻さない', async () => {
		const el = await render(<Demo />)
		const trigger = el.querySelector('button') as HTMLButtonElement
		await press(trigger)
		await act(async () => wait(50))
		const outside = Array.from(el.querySelectorAll('button')).find(
			b => b.textContent === '外のボタン',
		) as HTMLButtonElement
		await press(outside)
		await act(async () => wait(80))
		expect(byRole('dialog')).toBeNull()
		expect(document.activeElement).not.toBe(trigger)
	})
})

describe('Popover を外から閉じたとき', () => {
	it('開いているあいだにフォーカスが外へ出ていたら、閉じてもボタンへ戻さない', async () => {
		function Demo() {
			const [open, setOpen] = useState(true)
			return (
				<>
					<Popover open={open} onOpenChange={setOpen}>
						<PopoverTrigger>開く</PopoverTrigger>
						<PopoverContent>
							<input aria-label='中' />
						</PopoverContent>
					</Popover>
					<input aria-label='外' />
					<button type='button' onClick={() => setOpen(false)}>
						閉じる
					</button>
				</>
			)
		}
		const el = await render(<Demo />)
		await act(async () => wait(50))
		const outside = el.querySelector('[aria-label="外"]') as HTMLInputElement
		await act(async () => {
			outside.focus()
			await wait()
		})
		const close = Array.from(el.querySelectorAll('button')).find(
			b => b.textContent === '閉じる',
		) as HTMLButtonElement
		await act(async () => {
			close.click()
			outside.focus()
			await wait(80)
		})
		expect(byRole('dialog')).toBeNull()
		expect(document.activeElement).toBe(outside)
	})
})

describe('Popover の外でのキーボード', () => {
	// 記録のセルと同じ形: フォーカスのある記録のリンクに合わせて、少し後に開く
	function Demo() {
		const [open, setOpen] = useState(false)
		useEffect(() => {
			const timer = setTimeout(() => setOpen(true), 20)
			return () => clearTimeout(timer)
		}, [])
		return (
			<>
				<Popover open={open} onOpenChange={setOpen}>
					<PopoverAnchor asChild>
						<a href='#rec'>記録</a>
					</PopoverAnchor>
					<PopoverContent onOpenAutoFocus={e => e.preventDefault()}>
						<a href='#in'>中のリンク</a>
					</PopoverContent>
				</Popover>
				<a href='#next'>次のリンク</a>
			</>
		)
	}
	async function renderFocused() {
		const el = await render(<Demo />)
		const anchor = el.querySelector('a[href="#rec"]') as HTMLAnchorElement
		await act(async () => {
			anchor.focus()
			await wait(80)
		})
		expect(byRole('dialog')).not.toBeNull()
		return anchor
	}

	it('外のリンクで Enter を押しても（キーボードの click）、閉じない', async () => {
		const anchor = await renderFocused()
		await act(async () => {
			anchor.dispatchEvent(
				new MouseEvent('click', { bubbles: true, cancelable: true, detail: 0 }),
			)
			await wait(50)
		})
		expect(byRole('dialog')).not.toBeNull()
	})

	it('中身の外にフォーカスがあるとき、Tab はページの順に次へ進む（中身へは入らない）', async () => {
		const anchor = await renderFocused()
		const tab = new KeyboardEvent('keydown', {
			key: 'Tab',
			bubbles: true,
			cancelable: true,
		})
		await act(async () => {
			anchor.dispatchEvent(tab)
			await wait()
		})
		// Radix ではブラウザのふつうの Tab に任せる。ここでは同じ行き先へ動かす
		if (tab.defaultPrevented)
			expect(document.activeElement?.getAttribute('href')).toBe('#next')
		else expect(document.activeElement).toBe(anchor)
	})
})

describe('Popover とフォーカスの行き先', () => {
	it('フォーカスが外（ほかの欄）へ移ると閉じる。中に入ったことが無くても閉じる', async () => {
		const onOpenChange = vi.fn()
		const el = await render(
			<>
				<Popover defaultOpen onOpenChange={onOpenChange}>
					<PopoverTrigger>開く</PopoverTrigger>
					<PopoverContent onOpenAutoFocus={e => e.preventDefault()}>
						<input aria-label='中' />
					</PopoverContent>
				</Popover>
				<input aria-label='外' />
			</>,
		)
		await act(async () => wait(50))
		expect(byRole('dialog')).not.toBeNull()
		await act(async () => {
			;(el.querySelector('[aria-label="外"]') as HTMLInputElement).focus()
			await wait(80)
		})
		expect(onOpenChange).toHaveBeenLastCalledWith(false)
		expect(byRole('dialog')).toBeNull()
	})

	it('開くボタンへフォーカスが戻っても閉じない', async () => {
		const el = await render(
			<Popover defaultOpen>
				<PopoverTrigger>開く</PopoverTrigger>
				<PopoverContent>
					<input aria-label='中' />
				</PopoverContent>
			</Popover>,
		)
		await act(async () => wait(50))
		await act(async () => {
			;(el.querySelector('button') as HTMLButtonElement).focus()
			await wait(80)
		})
		expect(byRole('dialog')).not.toBeNull()
	})

	it('中から開いた入れ子の Popover へフォーカスが移っても、外の Popover は閉じない', async () => {
		await render(
			<Popover defaultOpen>
				<PopoverTrigger>外の</PopoverTrigger>
				<PopoverContent aria-label='外の中身'>
					<Popover>
						<PopoverTrigger>入れ子の</PopoverTrigger>
						<PopoverContent aria-label='入れ子の中身'>
							<input aria-label='入れ子の欄' />
						</PopoverContent>
					</Popover>
				</PopoverContent>
			</Popover>,
		)
		await act(async () => wait(50))
		const innerTrigger = Array.from(document.querySelectorAll('button')).find(
			b => b.textContent === '入れ子の',
		) as HTMLButtonElement
		await press(innerTrigger)
		await act(async () => wait(80))
		const field = document.querySelector(
			'[aria-label="入れ子の欄"]',
		) as HTMLInputElement
		expect(field).not.toBeNull()
		await act(async () => {
			field.focus()
			await wait(80)
		})
		expect(document.querySelector('[aria-label="外の中身"]')).not.toBeNull()
		expect(document.querySelector('[aria-label="入れ子の中身"]')).not.toBeNull()
	})
})

describe('DropdownMenu', () => {
	function Menu(props: {
		onSelect?: (e: Event) => void
		onOpenChange?: (open: boolean) => void
		onCheckedChange?: (checked: boolean) => void
	}) {
		return (
			<DropdownMenu onOpenChange={props.onOpenChange}>
				<DropdownMenuTrigger asChild>
					<Button>操作</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align='end'>
					<DropdownMenuItem onSelect={props.onSelect}>設定</DropdownMenuItem>
					<DropdownMenuItem disabled>使えない</DropdownMenuItem>
					<DropdownMenuCheckboxItem
						checked={false}
						onCheckedChange={props.onCheckedChange}
					>
						表示する
					</DropdownMenuCheckboxItem>
				</DropdownMenuContent>
			</DropdownMenu>
		)
	}

	it('asChild の Trigger で開き、項目は menuitem として読まれる', async () => {
		const el = await render(<Menu />)
		const trigger = el.querySelector('button') as HTMLButtonElement
		expect(trigger.getAttribute('aria-haspopup')).toBe('menu')
		expect(trigger.getAttribute('data-state')).toBe('closed')
		await press(trigger)
		const menu = byRole('menu') as HTMLElement
		expect(menu).not.toBeNull()
		expect(el.contains(menu)).toBe(false)
		expect(menu.getAttribute('data-state')).toBe('open')
		expect(trigger.getAttribute('data-state')).toBe('open')
		const items = menu.querySelectorAll('[role="menuitem"]')
		expect(items.length).toBe(2)
		expect(items[1].hasAttribute('data-disabled')).toBe(true)
		const checkbox = menu.querySelector(
			'[role="menuitemcheckbox"]',
		) as HTMLElement
		expect(checkbox.getAttribute('aria-checked')).toBe('false')
		expect(checkbox.getAttribute('data-state')).toBe('unchecked')
	})

	it('項目を押すと onSelect を呼び、メニューを閉じる', async () => {
		const onSelect = vi.fn()
		const onOpenChange = vi.fn()
		const el = await render(
			<Menu onSelect={onSelect} onOpenChange={onOpenChange} />,
		)
		await press(el.querySelector('button') as HTMLElement)
		const item = (byRole('menu') as HTMLElement).querySelector(
			'[role="menuitem"]',
		) as HTMLElement
		await press(item)
		await act(async () => wait(50))
		expect(onSelect).toHaveBeenCalledTimes(1)
		expect(onOpenChange).toHaveBeenLastCalledWith(false)
		expect(byRole('menu')).toBeNull()
	})

	it('onSelect で preventDefault() するとメニューは閉じない', async () => {
		const onSelect = vi.fn((e: Event) => e.preventDefault())
		const el = await render(<Menu onSelect={onSelect} />)
		await press(el.querySelector('button') as HTMLElement)
		const item = (byRole('menu') as HTMLElement).querySelector(
			'[role="menuitem"]',
		) as HTMLElement
		await press(item)
		await act(async () => wait(50))
		expect(onSelect).toHaveBeenCalledTimes(1)
		expect(byRole('menu')).not.toBeNull()
	})

	it('チェックの項目は onCheckedChange を呼ぶ', async () => {
		const onCheckedChange = vi.fn()
		const el = await render(<Menu onCheckedChange={onCheckedChange} />)
		await press(el.querySelector('button') as HTMLElement)
		const checkbox = (byRole('menu') as HTMLElement).querySelector(
			'[role="menuitemcheckbox"]',
		) as HTMLElement
		await press(checkbox)
		expect(onCheckedChange).toHaveBeenCalledWith(true)
	})

	it('メニューの中で Tab を押してもフォーカスは動かない', async () => {
		const el = await render(<Menu />)
		await press(el.querySelector('button') as HTMLElement)
		const item = (byRole('menu') as HTMLElement).querySelector(
			'[role="menuitem"]',
		) as HTMLElement
		await act(async () => item.focus())
		const tab = new KeyboardEvent('keydown', {
			key: 'Tab',
			bubbles: true,
			cancelable: true,
		})
		await act(async () => {
			item.dispatchEvent(tab)
			await wait()
		})
		expect(tab.defaultPrevented).toBe(true)
		expect(byRole('menu')).not.toBeNull()
	})

	it('Esc で閉じ、フォーカスは開いたボタンへ戻る', async () => {
		const el = await render(<Menu />)
		const trigger = el.querySelector('button') as HTMLButtonElement
		await press(trigger)
		await act(async () => wait(50))
		await key('Escape')
		await act(async () => wait(50))
		expect(byRole('menu')).toBeNull()
		expect(document.activeElement).toBe(trigger)
	})
})

describe('Tooltip', () => {
	it('開いていれば中身を tooltip として出し、data-state が付く', async () => {
		const el = await render(
			<TooltipProvider>
				<Tooltip open>
					<TooltipTrigger asChild>
						<Button>?</Button>
					</TooltipTrigger>
					<TooltipContent side='bottom'>助けの文</TooltipContent>
				</Tooltip>
			</TooltipProvider>,
		)
		const trigger = el.querySelector('button') as HTMLButtonElement
		expect(trigger.textContent).toBe('?')
		expect(trigger.getAttribute('data-state')).toMatch(/open/)
		// 読み上げ: Trigger の aria-describedby が、role="tooltip" の中身を指す
		const described = document.getElementById(
			trigger.getAttribute('aria-describedby') ?? '',
		)
		expect(described?.getAttribute('role')).toBe('tooltip')
		expect(described?.textContent).toBe('助けの文')
		const content = document.querySelector<HTMLElement>(
			'[data-side="bottom"][data-state]',
		)
		expect(content?.textContent).toContain('助けの文')
		expect(content?.getAttribute('data-state')).toMatch(/open/)
	})

	it('閉じていれば中身は出ない', async () => {
		await render(
			<TooltipProvider>
				<Tooltip>
					<TooltipTrigger>?</TooltipTrigger>
					<TooltipContent>助けの文</TooltipContent>
				</Tooltip>
			</TooltipProvider>,
		)
		expect(document.body.textContent).not.toContain('助けの文')
	})
})
