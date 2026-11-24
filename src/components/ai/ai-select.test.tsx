// @vitest-environment jsdom
import { type ReactNode, act } from 'react'
import { type Root, createRoot } from 'react-dom/client'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import { SelectContent, SelectItem, SelectValue } from '../inputs/select'
import type { AiFieldStatus } from './ai-field'
import { AiSelect, AiSelectTrigger } from './ai-select'

// AI が値を選んだ選択欄。人が別の項目を選んだときだけ「直した」を伝える。

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
	// 閉じているあいだの項目の写しは、描いた後に作られる
	await act(async () => new Promise(r => setTimeout(r, 0)))
	return el
}
async function type(el: Element, key: string) {
	await act(async () => {
		el.dispatchEvent(
			new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }),
		)
	})
}

function Stores({
	status,
	onEdit,
	onConfirm,
	onValueChange,
}: Readonly<{
	status: AiFieldStatus
	onEdit?: () => void
	onConfirm?: () => void
	onValueChange?: (value: string) => void
}>) {
	return (
		<AiSelect
			defaultValue='shibuya'
			onConfirm={onConfirm}
			onEdit={onEdit}
			onValueChange={onValueChange}
			status={status}
		>
			<AiSelectTrigger aria-label='店' fieldClassName='w-40'>
				<SelectValue />
			</AiSelectTrigger>
			<SelectContent>
				<SelectItem value='shibuya'>渋谷店</SelectItem>
				<SelectItem value='ikebukuro'>池袋店</SelectItem>
			</SelectContent>
		</AiSelect>
	)
}

describe('AiSelect', () => {
	it('AI が選んだままのとき、Trigger に AI の枠と説明が付く', async () => {
		const el = await render(<Stores status='filled' />)
		const trigger = el.querySelector('button[aria-label="店"]')
		expect(trigger?.getAttribute('data-ai-status')).toBe('filled')
		expect(trigger?.textContent).toContain('渋谷店')
		const describedBy = trigger?.getAttribute('aria-describedby') ?? ''
		expect(document.getElementById(describedBy)?.textContent).toContain(
			'AI が入れた値です',
		)
		expect(el.querySelector('.w-40[data-ai-status="filled"]')).not.toBeNull()
	})

	it('別の項目を選ぶと、値の変更と「直した」を伝える', async () => {
		const onEdit = vi.fn()
		const onValueChange = vi.fn()
		const el = await render(
			<Stores onEdit={onEdit} onValueChange={onValueChange} status='filled' />,
		)
		const trigger = el.querySelector('button[aria-label="店"]') as Element
		// 閉じたまま頭の文字を打つと、その文字で始まる項目を選ぶ
		await type(trigger, '池')
		expect(onValueChange).toHaveBeenCalledWith('ikebukuro')
		expect(onEdit).toHaveBeenCalledTimes(1)
	})

	it('✓ を押すと、確かめたことを伝える。選び直しにはしない', async () => {
		const onEdit = vi.fn()
		const onConfirm = vi.fn()
		const el = await render(
			<Stores onConfirm={onConfirm} onEdit={onEdit} status='uncertain' />,
		)
		const confirm = el.querySelector(
			'button[aria-label="AI が入れた値を確かめた"]',
		) as HTMLButtonElement
		await act(async () => confirm.click())
		expect(onConfirm).toHaveBeenCalledTimes(1)
		expect(onEdit).not.toHaveBeenCalled()
	})

	it('AI が関わっていないときは、普通の選択欄と同じ', async () => {
		const el = await render(<Stores status='none' />)
		const trigger = el.querySelector('button[aria-label="店"]')
		expect(trigger?.getAttribute('aria-describedby')).toBeNull()
		expect(el.textContent).not.toContain('AI')
	})
})
