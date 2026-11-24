import { expect, test } from '@playwright/test'

// 名前と値の並び（DescriptionList）の形を、本物のブラウザで確かめる。
// 同じ行の値の上端がそろうこと、長い値が箱の外へはみ出さないこと、狭い箱で列が減ること。

const story = (id: string, theme = 'light') =>
	`/iframe.html?id=${encodeURIComponent(id)}&viewMode=story&globals=theme:${theme}`

/** 同じ行（名前の上端が同じ）の組で、値の上端がそろっていない組と、箱の右へ出た値を返す。 */
function problems(list: Element) {
	const out: string[] = []
	const items = Array.from(
		list.querySelectorAll(':scope > [data-slot=description-item]'),
	)
	const rows = new Map<number, Element[]>()
	for (const item of items) {
		const top = Math.round(item.getBoundingClientRect().top)
		rows.set(top, [...(rows.get(top) ?? []), item])
	}
	for (const row of rows.values()) {
		const tops = row.map(
			item => item.querySelector('dd')?.getBoundingClientRect().top ?? 0,
		)
		if (Math.max(...tops) - Math.min(...tops) > 1)
			out.push(`値の上端がずれている: ${row.map(item => item.textContent).join(' / ')}`)
	}
	const right = list.getBoundingClientRect().right
	for (const node of list.querySelectorAll('dt,dd')) {
		if (node.getBoundingClientRect().right > right + 1)
			out.push(`右にはみ出している: ${node.textContent}`)
		if (node.scrollWidth > node.clientWidth + 1 && !node.className.includes('truncate'))
			out.push(`中身が入りきっていない: ${node.textContent}`)
	}
	return out
}

for (const id of [
	'description-list--基本',
	'description-list--長い名前と長い値',
	'description-list--横に並べる行',
	'description-list--aiの値とデータ基盤の値',
	'description-list--狭い箱',
	'description-list--狭い箱の横に並べる行',
]) {
	for (const width of [320, 820, 1280]) {
		test(`${id}: 幅 ${width}px で、値の上端がそろい、何もはみ出さない`, async ({
			page,
		}) => {
			await page.setViewportSize({ width, height: 900 })
			await page.goto(story(id))
			const list = page.locator('[data-slot=description-list]')
			await expect(list).toBeVisible()
			expect(await list.evaluate(problems)).toEqual([])
		})
	}
}

test('箱の幅で列の数が決まる（広いと 4 列、狭い箱では減る）', async ({ page }) => {
	await page.setViewportSize({ width: 1280, height: 900 })
	const columns = () =>
		page
			.locator('[data-slot=description-list]')
			.evaluate(el => getComputedStyle(el).gridTemplateColumns.split(' ').length)
	await page.goto(story('description-list--基本'))
	expect(await columns()).toBe(4)
	await page.goto(story('description-list--狭い箱'))
	expect(await columns()).toBeLessThan(4)
})

test('名前が折り返した組と並んでも、値の上端がそろう', async ({ page }) => {
	await page.setViewportSize({ width: 1280, height: 900 })
	await page.goto(story('description-list--長い名前と長い値'))
	await expect(page.locator('[data-slot=description-list]')).toBeVisible()
	const rows = await page
		.locator('[data-slot=description-item]')
		.evaluateAll(items =>
			// 箱の幅では 2 列になる。同じ行に並ぶ先頭の 2 組を比べる
			items.slice(0, 2).map(item => {
				const name = item.querySelector('dt') as HTMLElement
				// 名前の文字が何行か（文字の箱の数で数える）
				const range = document.createRange()
				range.selectNodeContents(name)
				const lines = new Set(
					Array.from(range.getClientRects()).map(rect => Math.round(rect.top)),
				).size
				return {
					lines,
					value: Math.round(
						item.querySelector('dd')?.getBoundingClientRect().top ?? 0,
					),
				}
			}),
		)
	// 1 つ目の名前は折り返し、2 つ目は 1 行
	expect(rows[0]?.lines).toBeGreaterThan(1)
	expect(rows[0]?.lines).toBeGreaterThan(rows[1]?.lines ?? 0)
	expect(new Set(rows.map(row => row.value)).size).toBe(1)
})

test('横に並べる行: 広いと名前が左、狭いと名前が上', async ({ page }) => {
	const sideBySide = () =>
		page
			.locator('[data-slot=description-item]')
			.first()
			.evaluate(item => {
				const name = item.querySelector('dt')?.getBoundingClientRect()
				const value = item.querySelector('dd')?.getBoundingClientRect()
				return (value?.left ?? 0) >= (name?.right ?? 0)
			})
	await page.setViewportSize({ width: 1280, height: 900 })
	await page.goto(story('description-list--横に並べる行'))
	await expect(page.locator('[data-slot=description-list]')).toBeVisible()
	expect(await sideBySide()).toBe(true)
	await page.setViewportSize({ width: 320, height: 900 })
	expect(await sideBySide()).toBe(false)
	// 広い画面でも、箱が狭ければ名前が上（画面の幅ではなく、箱の幅で決まる）
	await page.setViewportSize({ width: 1280, height: 900 })
	await page.goto(story('description-list--狭い箱の横に並べる行'))
	await expect(page.locator('[data-slot=description-list]')).toBeVisible()
	expect(await sideBySide()).toBe(false)
})

test('ダークテーマでも名前と値が読める色で出る', async ({ page }) => {
	await page.goto(story('description-list--基本', 'dark'))
	const colors = await page
		.locator('[data-slot=description-item]')
		.first()
		.evaluate(item => ({
			back: getComputedStyle(document.body).backgroundColor,
			name: getComputedStyle(item.querySelector('dt') as Element).color,
			value: getComputedStyle(item.querySelector('dd') as Element).color,
		}))
	expect(colors.name).not.toBe(colors.back)
	expect(colors.value).not.toBe(colors.back)
	expect(colors.name).not.toBe(colors.value)
})
