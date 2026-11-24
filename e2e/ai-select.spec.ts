import { expect, test } from '@playwright/test'

// AI が選んだ選択欄（AiSelect）と、出典の詳しい中身を、本物のブラウザで確かめる。

const story = (id: string) =>
	`/iframe.html?id=${encodeURIComponent(id)}&viewMode=story&globals=theme:light`

test('別の項目を選ぶと「直した」に、✓ を押すと「確認済み」に変わる', async ({
	page,
}) => {
	await page.goto(story('ai-select--状態の移り変わり'))
	const trigger = page.getByRole('combobox')
	await expect(trigger).toHaveAttribute('data-ai-status', 'filled')

	await page.getByRole('button', { name: 'AI が入れた値を確かめた' }).click()
	await expect(trigger).toHaveAttribute('data-ai-status', 'confirmed')
	// ✓ のそばの印に触れて開いた「判断の中身」を閉じる
	await page.mouse.move(0, 0)
	await page.keyboard.press('Escape')
	await expect(page.getByRole('dialog')).toHaveCount(0)

	// 同じ項目を選び直しても「直した」にはならない
	await trigger.click()
	await page.getByRole('option', { name: '渋谷店' }).click()
	await expect(trigger).toHaveAttribute('data-ai-status', 'confirmed')

	await trigger.click()
	await page.getByRole('option', { name: '池袋店' }).click()
	await expect(trigger).toHaveText('池袋店')
	await expect(trigger).toHaveAttribute('data-ai-status', 'edited')
})

test('文字の欄と並べても、枠の上端と高さがそろう', async ({ page }) => {
	await page.goto(story('ai-select--入力欄と並べる'))
	const select = await page.getByRole('combobox').boundingBox()
	const input = await page.getByRole('textbox', { name: '数量' }).boundingBox()
	expect(Math.abs((select?.y ?? 0) - (input?.y ?? 99))).toBeLessThanOrEqual(1)
	expect(
		Math.abs((select?.height ?? 0) - (input?.height ?? 99)),
	).toBeLessThanOrEqual(1)
})

test('出典の値に長い URL があっても、枠からはみ出さず、見出しは 1 行のまま', async ({
	page,
}) => {
	await page.goto(story('fact--出典の長い文字'))
	const list = page.locator('dl')
	await expect(list).toBeVisible()
	const result = await list.evaluate(dl => {
		const box = dl.getBoundingClientRect()
		const terms = Array.from(dl.querySelectorAll('dt'))
		const values = Array.from(dl.querySelectorAll('dd'))
		return {
			// 1 行に収まっていれば、文字の箱は 1 つ
			termLines: terms.map(dt => {
				const range = document.createRange()
				range.selectNodeContents(dt)
				return range.getClientRects().length
			}),
			overflow: values.some(
				dd =>
					dd.getBoundingClientRect().right > box.right + 1 ||
					dd.scrollWidth > dd.clientWidth + 1,
			),
		}
	})
	expect(result.termLines).toEqual([1, 1])
	expect(result.overflow).toBe(false)
})
