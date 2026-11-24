// @vitest-environment jsdom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { describe, expect, it } from 'vitest'

import { Field } from './field'
import { Input } from './input'

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })

function render(node: React.ReactNode) {
	const container = document.createElement('div')
	document.body.append(container)
	const root = createRoot(container)
	act(() => root.render(node))
	return { container, unmount: () => act(() => root.unmount()) }
}

describe('Field', () => {
	it('入力欄 1 つには id と説明の結び付きを付け、ラベルはその入力欄を指す', () => {
		const view = render(
			<Field description='お客様に見せる名前' label='名前'>
				<Input />
			</Field>,
		)
		const label = view.container.querySelector('label') as HTMLLabelElement
		const input = view.container.querySelector('input') as HTMLInputElement
		expect(label.control).toBe(input)
		const note = document.getElementById(
			input.getAttribute('aria-describedby') ?? '',
		)
		expect(note?.textContent).toBe('お客様に見せる名前')
		view.unmount()
	})

	it('入力欄を横に並べる箱を渡すと、箱に id を付けず、ラベルは中の入力欄を指す', () => {
		const view = render(
			<Field controlId='amount' label='内容量'>
				<div className='flex gap-2'>
					<Input id='amount' />
					<select aria-label='単位' />
				</div>
			</Field>,
		)
		expect(view.container.querySelectorAll('#amount')).toHaveLength(1)
		const label = view.container.querySelector('label') as HTMLLabelElement
		expect(label.control).toBe(view.container.querySelector('input'))
		view.unmount()
	})
})
