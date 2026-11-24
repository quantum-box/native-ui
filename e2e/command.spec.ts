import { type Page, expect, test } from '@playwright/test'

// 検索して選ぶ一覧（Command）を、本物のブラウザで動かす。
// 近い順の並べ替えは CSS の order で見せているので、画面の並び（上から下）と、
// ↓ で動く順・最初に選ぶ項目が同じであることを確かめる。

const story = (id: string) =>
	`/iframe.html?id=${encodeURIComponent(id)}&viewMode=story&globals=theme:light`

/** 見えている項目を、画面の上から順に */
const onScreen = (page: Page) =>
	page.locator('[cmdk-item]').evaluateAll(items =>
		items
			.filter(el => (el as HTMLElement).offsetParent !== null)
			.map(el => ({
				text: el.textContent ?? '',
				top: el.getBoundingClientRect().top,
			}))
			.sort((a, b) => a.top - b.top)
			.map(item => item.text),
	)
const selected = (page: Page) =>
	page.locator('[cmdk-item][data-selected="true"]').textContent()

for (const [id, search] of [
	['command--default', ''],
	['command--default', 'i'],
	['command--default', 'set'],
	['command--default', 'se'],
	// 近さが同じ群は、群ごとにまとまって並ぶ（群をまたいで行き来しない）
	['command--近さが同じ群', 'a'],
	['command--近さが同じ群', 'p'],
] as const) {
	test(`${id} を「${search}」で絞ると、画面の並びと ↓ で動く順が同じ`, async ({
		page,
	}) => {
		await page.goto(story(id))
		const input = page.getByRole('combobox')
		await input.fill(search)
		const order = await onScreen(page)
		expect(order.length).toBeGreaterThan(0)
		// 最初に選ぶのは、画面のいちばん上
		expect(await selected(page)).toBe(order[0])
		const visited = [order[0]]
		for (let i = 1; i < order.length; i++) {
			await input.press('ArrowDown')
			visited.push((await selected(page)) ?? '')
		}
		expect(visited).toEqual(order)
		// 選んだ項目を、読み上げで指している
		const activeId = await page
			.locator('[cmdk-item][data-selected="true"]')
			.getAttribute('id')
		await expect(input).toHaveAttribute('aria-activedescendant', activeId ?? '')
	})
}

test('「set」では Settings がいちばん上に来て、合わない群と区切りは消える', async ({
	page,
}) => {
	await page.goto(story('command--default'))
	await page.getByRole('combobox').fill('set')
	expect((await onScreen(page))[0]).toContain('Settings')
	await expect(page.getByText('Actions')).toBeHidden()
	await expect(page.locator('[cmdk-separator]')).toHaveCount(0)
	await page.getByRole('combobox').fill('zzz')
	await expect(page.getByText('No results found.')).toBeVisible()
})

test('指を乗せると選び、押すと閉じた一覧の値が入る（Combobox）', async ({
	page,
}) => {
	await page.goto(story('combobox--default'))
	const trigger = page.locator('button[role="combobox"]')
	await trigger.click()
	const globex = page.getByRole('option', { name: /Globex/ })
	await globex.hover()
	await expect(globex).toHaveAttribute('data-selected', 'true')
	await globex.click()
	await expect(trigger).toHaveText(/Globex Corporation/)
	await expect(page.locator('[cmdk-list]')).toHaveCount(0)
})
