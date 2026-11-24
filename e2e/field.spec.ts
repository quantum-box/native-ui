import { type Page, expect, test } from '@playwright/test'

// 欄（Field・FieldGroup）の並びを本物のブラウザで確かめる。高さや幅は jsdom では分からない。

const story = (id: string) =>
	`/iframe.html?id=${encodeURIComponent(id)}&viewMode=story&globals=theme:light`

/** 同じ行に並ぶ入力欄の上端（行ごと）と、箱の右端を超えた物。 */
async function layout(page: Page) {
	return page.evaluate(() => {
		const controls = Array.from(
			document.querySelectorAll<HTMLElement>(
				'[data-slot=field-control] > :first-child',
			),
		)
		const rows = new Map<number, number[]>()
		for (const control of controls) {
			const field = control.closest('[data-slot=field]') as HTMLElement
			const key = Math.round(field.getBoundingClientRect().top)
			rows.set(key, [
				...(rows.get(key) ?? []),
				control.getBoundingClientRect().top,
			])
		}
		const spreads = [...rows.values()]
			.filter(tops => tops.length > 1)
			.map(tops => Math.max(...tops) - Math.min(...tops))
		const form = document.querySelector('form') as HTMLElement
		const edge = form.getBoundingClientRect().right
		const overflow = Array.from(
			form.querySelectorAll<HTMLElement>('input,button,textarea'),
		)
			.filter(el => el.getBoundingClientRect().right > edge + 1)
			.map(el => el.outerHTML.slice(0, 60))
		return { overflow, rows: spreads.length, spreads }
	})
}

for (const width of [1280, 800, 420]) {
	test(`横に並べた欄は、説明・エラー・長いラベルが混ざっても入力欄の上端がそろう（幅 ${width}px）`, async ({
		page,
	}) => {
		await page.setViewportSize({ height: 900, width })
		await page.goto(story('field--横に並べる'))
		await expect(page.getByLabel('商品名')).toBeVisible()
		const { overflow, rows, spreads } = await layout(page)
		if (width >= 800) expect(rows).toBeGreaterThan(0)
		for (const spread of spreads) expect(spread).toBeLessThanOrEqual(1)
		expect(overflow).toEqual([])
	})
}

test('狭い箱でも、入力欄と単位の選ぶ欄が右へはみ出さない', async ({ page }) => {
	await page.goto(story('field--狭い箱'))
	await expect(page.getByLabel('JANコード')).toBeVisible()
	const { overflow, spreads } = await layout(page)
	for (const spread of spreads) expect(spread).toBeLessThanOrEqual(1)
	expect(overflow).toEqual([])
})

test('エラーと説明は読み上げで入力欄に結びつく', async ({ page }) => {
	await page.goto(story('field--横に並べる'))
	const jan = page.getByLabel('JANコード')
	await expect(jan).toHaveAttribute('aria-invalid', 'true')
	await expect(jan).toHaveAccessibleDescription('13 桁の数字で入れてください。')
	await expect(page.getByLabel('入数')).toHaveAccessibleDescription(
		'1パックに何個入りか',
	)
})
