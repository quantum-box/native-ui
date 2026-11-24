import { type Locator, expect, test } from '@playwright/test'

// AI に問いを送る欄（PromptInput）を、本物のブラウザで動かす。
// 枠と欄は InputGroup で作っている。見た目と動きは前と同じであることを確かめる。

const story = (id: string) =>
	`/iframe.html?id=${encodeURIComponent(id)}&viewMode=story&globals=theme:light`

const height = (locator: Locator) =>
	locator.evaluate(el => el.getBoundingClientRect().height)

test('書くと伸び、Shift+Enter で改行、Enter で送ると空に戻る', async ({
	page,
}) => {
	await page.goto(story('chat-prompt-input--触って試す'))
	const box = page.getByRole('textbox', { name: 'AI への問い' })
	const form = page.locator('form')
	const empty = await height(box)

	await box.click()
	// 枠に輪が出る
	expect(
		await form.evaluate(el => getComputedStyle(el).boxShadow !== 'none'),
	).toBe(true)

	await page.keyboard.type('1 行目')
	await page.keyboard.press('Shift+Enter')
	await page.keyboard.type('2 行目')
	await page.keyboard.press('Shift+Enter')
	await page.keyboard.type('3 行目')
	await expect.poll(() => height(box)).toBeGreaterThan(empty + 20)

	await page.keyboard.press('Enter')
	await expect(page.getByText('送った: 1 行目')).toBeVisible()
	await expect(box).toHaveValue('')
	await expect.poll(() => height(box)).toBeLessThan(empty + 2)
})

test('下の帯の余白を押すと、欄に移る', async ({ page }) => {
	await page.goto(story('chat-prompt-input--空'))
	const box = page.getByRole('textbox', { name: 'AI への問い' })
	const bar = page.locator('[data-slot="input-group-addon"]')
	const barBox = await bar.boundingBox()
	if (!barBox) throw new Error('帯の場所が分からない')
	// 帯の左の余白（送るボタンから離れた所）を押す
	await page.mouse.click(barBox.x + 10, barBox.y + barBox.height / 2)
	await expect(box).toBeFocused()
})

test('文字数の目安を超えると、数が赤くなり、送れない', async ({ page }) => {
	await page.goto(story('chat-prompt-input--文字数の目安'))
	const box = page.getByRole('textbox', { name: 'AI への問い' })
	await expect(box).not.toHaveAttribute('aria-invalid', 'true')
	await box.click()
	await page.keyboard.press('End')
	await page.keyboard.type('さらに、去年の同じ月とも比べて、理由も添えて教えてください。')
	await expect(box).toHaveAttribute('aria-invalid', 'true')
	await expect(page.getByRole('button', { name: '送る' })).toBeDisabled()
})
