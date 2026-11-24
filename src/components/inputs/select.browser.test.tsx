import '../../test/browser.css'

import { page, userEvent } from '@vitest/browser/context'
import { act, useState } from 'react'
import { type Root, createRoot } from 'react-dom/client'
import { afterEach, describe, expect, it } from 'vitest'

import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from './select'

// 本物のブラウザ（Chromium）で、Select の一覧が閉じたあと画面にも
// 読み上げにも残らないことを確かめる。
// base-ui は一度開いた一覧を、閉じたあとも見えない形で DOM に残す。
// そのままだと、画面の検査や読み上げが「閉じた一覧」まで拾ってしまう。

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
let root: Root | undefined
let host: HTMLDivElement | undefined

afterEach(() => {
	act(() => root?.unmount())
	host?.remove()
	root = undefined
	host = undefined
})

function mount(node: React.ReactNode) {
	host = document.createElement('div')
	document.body.append(host)
	root = createRoot(host)
	act(() => root?.render(node))
}

function StatusSelect({ label }: { label: string }) {
	const [value, setValue] = useState('')
	return (
		<Select value={value} onValueChange={setValue}>
			<SelectTrigger aria-label={label} className='w-48'>
				<SelectValue placeholder={`${label}を選ぶ`} />
			</SelectTrigger>
			<SelectContent>
				<SelectItem value='todo'>{label}: 未着手</SelectItem>
				<SelectItem value='doing'>{label}: 進行中</SelectItem>
				<SelectItem value='done'>{label}: 完了</SelectItem>
			</SelectContent>
		</Select>
	)
}

/** 閉じる動きが終わるまで待ってから、残った一覧を数える */
async function waitClosed() {
	await expect
		.poll(() => document.querySelectorAll('[role="listbox"]').length)
		.toBe(0)
}

/** 写しの絵を、色の並びに直す */
async function pixels(base64: string) {
	const blob = await (await fetch(`data:image/png;base64,${base64}`)).blob()
	const bitmap = await createImageBitmap(blob)
	const canvas = new OffscreenCanvas(bitmap.width, bitmap.height)
	const context = canvas.getContext('2d')
	if (!context) throw new Error('canvas を使えない')
	context.drawImage(bitmap, 0, 0)
	return context.getImageData(0, 0, bitmap.width, bitmap.height).data
}

function sameImage(a: Uint8ClampedArray, b: Uint8ClampedArray) {
	if (a.length !== b.length) return false
	for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false
	return true
}

describe('Select を選んで閉じたあと', () => {
	it('一覧の要素が DOM から消え、読み上げにも残らない', async () => {
		mount(<StatusSelect label='状態' />)

		await userEvent.click(page.getByRole('combobox', { name: '状態' }))
		await expect.element(page.getByRole('listbox')).toBeVisible()

		await userEvent.click(page.getByRole('option', { name: '状態: 進行中' }))
		await waitClosed()

		expect(document.querySelectorAll('[role="option"]')).toHaveLength(0)
		expect(document.querySelectorAll('[id$="-list"]')).toHaveLength(0)
		await expect
			.element(page.getByRole('combobox', { name: '状態' }))
			.toHaveTextContent('状態: 進行中')
	})

	it('もう一度開くと、一覧はひとつだけで、選んだ項目に印が付く', async () => {
		mount(<StatusSelect label='状態' />)
		const trigger = page.getByRole('combobox', { name: '状態' })

		await userEvent.click(trigger)
		await userEvent.click(page.getByRole('option', { name: '状態: 完了' }))
		await waitClosed()

		await userEvent.click(trigger)
		await expect.element(page.getByRole('listbox')).toBeVisible()
		expect(document.querySelectorAll('[role="listbox"]')).toHaveLength(1)
		await expect
			.element(page.getByRole('option', { name: '状態: 完了' }))
			.toHaveAttribute('aria-selected', 'true')
	})

	it('二つの Select を続けて開いても、一覧はいつもひとつだけ', async () => {
		mount(
			<div className='flex gap-4'>
				<StatusSelect label='状態' />
				<StatusSelect label='担当' />
			</div>,
		)

		await userEvent.click(page.getByRole('combobox', { name: '状態' }))
		await userEvent.click(page.getByRole('option', { name: '状態: 未着手' }))
		await waitClosed()

		await userEvent.click(page.getByRole('combobox', { name: '担当' }))
		await expect.element(page.getByRole('listbox')).toBeVisible()
		const lists = document.querySelectorAll('[role="listbox"]')
		expect(lists).toHaveLength(1)
		expect(lists[0]?.textContent).toContain('担当: 未着手')
		expect(lists[0]?.textContent).not.toContain('状態: 未着手')

		await userEvent.click(page.getByRole('option', { name: '担当: 完了' }))
		await waitClosed()
		expect(document.querySelectorAll('[role="option"]')).toHaveLength(0)
	})

	it('選んで閉じたあとの写しは、開く前と同じ（一覧がうっすら残らない）', async () => {
		mount(
			<div className='bg-background p-4'>
				<StatusSelect label='状態' />
				{/* 一覧が出る場所。閉じたあとは、開く前と同じ見た目に戻るはず。
				    Trigger のフォーカスの輪が入らないよう、少し離す */}
				<div data-testid='below' className='mt-3 h-40 w-64' />
			</div>,
		)
		const below = page.getByTestId('below')

		const before = await page.screenshot({
			element: below,
			path: '__screenshots__/select-before-open.png',
			base64: true,
		})

		await userEvent.click(page.getByRole('combobox', { name: '状態' }))
		await expect.element(page.getByRole('listbox')).toBeVisible()
		// 開いている間は、一覧がこの場所に重なる（写しが変わる）
		await expect
			.poll(async () => {
				const open = await page.screenshot({
					element: below,
					path: '__screenshots__/select-open.png',
					base64: true,
				})
				return sameImage(await pixels(before.base64), await pixels(open.base64))
			})
			.toBe(false)

		await userEvent.click(page.getByRole('option', { name: '状態: 進行中' }))
		await waitClosed()

		const after = await page.screenshot({
			element: below,
			path: '__screenshots__/select-after-close.png',
			base64: true,
		})
		expect(
			sameImage(await pixels(before.base64), await pixels(after.base64)),
		).toBe(true)
	})
})
