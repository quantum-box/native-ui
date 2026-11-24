// @vitest-environment jsdom
import { type ReactNode, act } from 'react'
import { type Root, createRoot } from 'react-dom/client'
import { useForm } from 'react-hook-form'
import { afterEach, describe, expect, it } from 'vitest'

import { FieldActions, FieldGroup } from './field'
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from './form'
import { Input } from './input'

// 欄の箱（FormItem）と、欄を並べる箱（FieldGroup・FieldActions）の作りを確かめる。
// 上端のそろい方とはみ出しは、本物のブラウザで確かめる（e2e/field-layout.spec.ts）。

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
let root: Root | undefined
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

function Item({ withNotes }: { withNotes: boolean }) {
	const form = useForm({ defaultValues: { jan: '' } })
	return (
		<Form {...form}>
			<FormField
				control={form.control}
				name='jan'
				render={({ field }) => (
					<FormItem>
						<FormLabel>JAN</FormLabel>
						<FormControl>
							<Input {...field} />
						</FormControl>
						{withNotes ? <FormDescription>13 桁</FormDescription> : null}
						{withNotes ? <FormMessage>まちがい</FormMessage> : null}
					</FormItem>
				)}
			/>
		</Form>
	)
}

describe('FormItem', () => {
	it('上に寄せて縮められる欄の箱になり、説明とエラーを 1 つの段にまとめる', async () => {
		const el = await render(<Item withNotes />)
		const item = el.querySelector('[data-slot="field"]') as HTMLElement
		expect(item.className).toContain('content-start')
		expect(item.className).toContain('min-w-0')
		// ラベル・入力欄・説明の段 の 3 つ
		expect(item.children).toHaveLength(3)
		const note = item.children[2] as HTMLElement
		expect(note.getAttribute('data-slot')).toBe('field-note')
		expect(note.textContent).toBe('13 桁まちがい')
		// 読み上げの結びつきはこれまでどおり
		const input = item.querySelector('input') as HTMLInputElement
		expect(item.querySelector('label')?.htmlFor).toBe(input.id)
		expect(input.getAttribute('aria-describedby')).toContain(
			note.querySelector('p')?.id,
		)
	})

	it('説明もエラーも無ければ、段を足さない', async () => {
		const el = await render(<Item withNotes={false} />)
		const item = el.querySelector('[data-slot="field"]') as HTMLElement
		expect(item.children).toHaveLength(2)
	})
})

describe('FieldGroup・FieldActions', () => {
	it('columns を渡すと、箱の幅で列を減らす並べ方になる', async () => {
		const el = await render(
			<FieldGroup columns={4} minColumnWidth='9rem'>
				<FieldActions>保存</FieldActions>
			</FieldGroup>,
		)
		const group = el.querySelector('[data-slot="field-group"]') as HTMLElement
		const columns = group.style.gridTemplateColumns
		expect(columns).toContain('auto-fill')
		expect(columns).toContain('9rem')
		// 4 列なら 1 列は 25% から列の間の分を引いた幅（jsdom は calc を簡単にする）
		expect(columns).toContain('25%')
		const actions = el.querySelector(
			'[data-slot="field-actions"]',
		) as HTMLElement
		expect(actions.className).toContain('col-span-full')
		expect(actions.className).toContain('flex-wrap')
	})

	it('columns を省くと、これまでどおり 12rem ずつ並べる', async () => {
		const el = await render(<FieldGroup />)
		const group = el.querySelector('[data-slot="field-group"]') as HTMLElement
		expect(group.style.gridTemplateColumns).toBe('')
		expect(group.className).toContain('12rem')
	})
})
