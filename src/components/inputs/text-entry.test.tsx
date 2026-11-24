// @vitest-environment jsdom
import { type ReactNode, act, createRef, useState } from 'react'
import { type Root, createRoot } from 'react-dom/client'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import {
	InputGroup,
	InputGroupAddon,
	InputGroupButton,
	InputGroupInput,
	InputGroupText,
	InputGroupTextarea,
} from './input-group'
import { Textarea } from './textarea'

// 長い文の欄（Textarea）と、欄に物を付ける囲み（InputGroup）の使い方を確かめる。
// 高さの伸び縮みは本物のブラウザで確かめる（e2e/text-entry.spec.ts）。

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
})
afterEach(async () => {
	await act(async () => root?.unmount())
	root = undefined
	document.body.innerHTML = ''
})
async function render(node: ReactNode) {
	const el = document.createElement('div')
	document.body.appendChild(el)
	root = createRoot(el)
	await act(async () => root?.render(node))
	return el
}
/** React に届くように、欄の文字を変える */
async function type(textarea: HTMLTextAreaElement, text: string) {
	const setter = Object.getOwnPropertyDescriptor(
		HTMLTextAreaElement.prototype,
		'value',
	)?.set
	await act(async () => {
		setter?.call(textarea, text)
		textarea.dispatchEvent(new Event('input', { bubbles: true }))
	})
}

describe('Textarea', () => {
	it('ref と、ふつうの textarea の props がそのまま届く', async () => {
		const ref = createRef<HTMLTextAreaElement>()
		const el = await render(
			<Textarea ref={ref} name='memo' placeholder='メモ' defaultValue='あ' />,
		)
		const textarea = el.querySelector('textarea')
		expect(ref.current).toBe(textarea)
		expect(textarea?.name).toBe('memo')
		expect(textarea?.placeholder).toBe('メモ')
		expect(textarea?.value).toBe('あ')
		expect(textarea?.getAttribute('aria-invalid')).toBeNull()
	})

	it('error を渡すと、aria-invalid が付き、誤りの文に結ばれる', async () => {
		const el = await render(<Textarea id='reason' error='短すぎます' />)
		const textarea = el.querySelector('textarea')
		expect(textarea?.getAttribute('aria-invalid')).toBe('true')
		const alert = el.querySelector('[role="alert"]')
		expect(alert?.textContent).toBe('短すぎます')
		expect(textarea?.getAttribute('aria-describedby')).toBe(alert?.id)
	})

	it('aria-invalid を直に渡しても、誤りの見た目になる', async () => {
		const el = await render(<Textarea aria-invalid />)
		expect(el.querySelector('textarea')?.getAttribute('aria-invalid')).toBe(
			'true',
		)
	})

	it('文字数を出し、目安を超えると赤くなるが、打つのは止めない', async () => {
		const el = await render(<Textarea showCount softLimit={5} />)
		const textarea = el.querySelector('textarea') as HTMLTextAreaElement
		const count = () =>
			el.querySelector(
				`#${CSS.escape(textarea.getAttribute('aria-describedby') ?? '')}`,
			)
		expect(count()?.textContent).toContain('0 / 5')

		await type(textarea, 'あいうえおか')
		expect(textarea.value).toBe('あいうえおか')
		expect(count()?.textContent).toContain('6 / 5')
		expect(count()?.className).toContain('text-destructive')
		expect(textarea.getAttribute('aria-invalid')).toBe('true')
	})

	it('外で値を持つ形でも、文字数が値に合う', async () => {
		function Controlled() {
			const [value, setValue] = useState('はじめ')
			return (
				<Textarea
					showCount
					maxLength={100}
					value={value}
					onChange={event => setValue(event.target.value)}
				/>
			)
		}
		const el = await render(<Controlled />)
		const textarea = el.querySelector('textarea') as HTMLTextAreaElement
		expect(el.textContent).toContain('3 / 100')
		await type(textarea, 'かわった値')
		expect(el.textContent).toContain('5 / 100')
		expect(textarea.maxLength).toBe(100)
	})

	it('読むだけ・無効が、そのまま欄に付く', async () => {
		const el = await render(
			<>
				<Textarea readOnly defaultValue='読む' />
				<Textarea disabled />
			</>,
		)
		const [readOnly, disabled] = Array.from(el.querySelectorAll('textarea'))
		expect(readOnly?.readOnly).toBe(true)
		expect(disabled?.disabled).toBe(true)
	})
})

describe('Textarea の伸び縮みと、フォームの「元に戻す」', () => {
	it('伸び縮みをやめると、この部品が書いた高さとスクロールの指定を消す', async () => {
		function Toggle({ autoResize }: { autoResize: boolean }) {
			return <Textarea autoResize={autoResize} rows={4} defaultValue='あ' />
		}
		const el = await render(<Toggle autoResize />)
		const textarea = el.querySelector('textarea') as HTMLTextAreaElement
		expect(textarea.style.height).not.toBe('')
		expect(textarea.style.overflowY).not.toBe('')

		await act(async () => root?.render(<Toggle autoResize={false} />))
		expect(textarea.style.height).toBe('')
		expect(textarea.style.overflowY).toBe('')
		expect(textarea.rows).toBe(4)
	})

	it('フォームを元に戻すと、文字数と目安を超えた印も戻る', async () => {
		const el = await render(
			<form>
				<Textarea defaultValue='はじめ' showCount softLimit={5} />
				<button type='reset'>元に戻す</button>
			</form>,
		)
		const textarea = el.querySelector('textarea') as HTMLTextAreaElement
		await type(textarea, 'とても長い文に書きかえた')
		expect(el.textContent).toContain('12 / 5')
		expect(textarea.getAttribute('aria-invalid')).toBe('true')

		await act(async () => {
			;(el.querySelector('form') as HTMLFormElement).reset()
			await new Promise(r => setTimeout(r, 10))
		})
		expect(textarea.value).toBe('はじめ')
		expect(el.textContent).toContain('3 / 5')
		expect(textarea.getAttribute('aria-invalid')).toBeNull()
	})
})

describe('InputGroup', () => {
	it('Field と同じ書き方（align・size・variant）で組み立てられる', async () => {
		const el = await render(
			<InputGroup>
				<InputGroupTextarea aria-label='質問' />
				<InputGroupAddon align='block-end'>
					<InputGroupText>⌘Enter</InputGroupText>
					<InputGroupButton
						aria-label='送る'
						size='icon-sm'
						type='submit'
						variant='default'
					>
						↑
					</InputGroupButton>
				</InputGroupAddon>
			</InputGroup>,
		)
		const group = el.querySelector('[data-slot="input-group"]')
		expect(group?.getAttribute('role')).toBe('group')
		const addon = el.querySelector('[data-slot="input-group-addon"]')
		expect(addon?.getAttribute('data-align')).toBe('block-end')
		const button = el.querySelector('button') as HTMLButtonElement
		expect(button.type).toBe('submit')
		expect(button.getAttribute('data-size')).toBe('icon-sm')
		// shadcn の default は native-ui の primary になる
		expect(button.className).toContain('bg-primary')
		expect(button.className).toContain('size-7')
		expect(el.querySelector('textarea')?.getAttribute('data-slot')).toBe(
			'input-group-control',
		)
	})

	it('ボタンは既定で type=button の ghost（フォームを送らない）', async () => {
		const onSubmit = vi.fn((event: Event) => event.preventDefault())
		const el = await render(
			<form onSubmit={e => onSubmit(e.nativeEvent)}>
				<InputGroup>
					<InputGroupInput aria-label='検索' />
					<InputGroupAddon align='inline-end'>
						<InputGroupButton>消す</InputGroupButton>
					</InputGroupAddon>
				</InputGroup>
			</form>,
		)
		const button = el.querySelector('button') as HTMLButtonElement
		expect(button.type).toBe('button')
		expect(button.className).toContain('text-muted-foreground')
		await act(async () => button.click())
		expect(onSubmit).not.toHaveBeenCalled()
	})

	it('付けた物の余白を押すと中の欄に移り、ボタンを押したときは移らない', async () => {
		const onClick = vi.fn()
		const el = await render(
			<InputGroup>
				<InputGroupAddon>
					<span data-testid='icon'>🔍</span>
				</InputGroupAddon>
				<InputGroupInput aria-label='検索' />
				<InputGroupAddon align='inline-end'>
					<InputGroupButton onClick={onClick}>消す</InputGroupButton>
				</InputGroupAddon>
			</InputGroup>,
		)
		const input = el.querySelector('input') as HTMLInputElement
		const button = el.querySelector('button') as HTMLButtonElement

		await act(async () => button.click())
		expect(onClick).toHaveBeenCalledTimes(1)
		expect(document.activeElement).not.toBe(input)

		await act(async () =>
			(el.querySelector('[data-testid="icon"]') as HTMLElement).click(),
		)
		expect(document.activeElement).toBe(input)
	})

	it('付けた物の onClick で preventDefault すると、欄に移らない', async () => {
		const el = await render(
			<InputGroup>
				<InputGroupAddon onClick={event => event.preventDefault()}>
					<span data-testid='icon'>@</span>
				</InputGroupAddon>
				<InputGroupTextarea aria-label='本文' />
			</InputGroup>,
		)
		await act(async () =>
			(el.querySelector('[data-testid="icon"]') as HTMLElement).click(),
		)
		expect(document.activeElement).not.toBe(el.querySelector('textarea'))
	})
})
