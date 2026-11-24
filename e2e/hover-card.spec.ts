import { expect, test } from '@playwright/test'

// base-ui に移した HoverCard を、本物のブラウザで動かす。
// 触れて 0.7 秒で出て、離れて 0.3 秒で消える（Radix の HoverCard と同じ）。

const story = (id: string) =>
	`/iframe.html?id=${encodeURIComponent(id)}&viewMode=story&globals=theme:light`

test('触れて少し待つと出て、離れると消え、何も残らない', async ({ page }) => {
	await page.goto(story('重なる物-hovercard--default'))
	const trigger = page.getByRole('link', { name: '山田商店' })
	const card = page.getByText('取引先 C-0001・渋谷区')

	await trigger.hover()
	// 触れてすぐには出ない
	await page.waitForTimeout(300)
	await expect(card).toHaveCount(0)
	// 0.7 秒ほどで出る
	await expect(card).toBeVisible()
	await expect(trigger).toHaveAttribute('data-state', 'open')

	// 中身に指を移しても消えない
	await card.hover()
	await page.waitForTimeout(500)
	await expect(card).toBeVisible()

	// 離れると消え、DOM にも残らない
	await page.mouse.move(5, 5)
	await expect(card).toHaveCount(0)
	await expect(page.locator('[data-base-ui-portal]')).toHaveCount(0)
	await expect(trigger).toHaveAttribute('data-state', 'closed')
})

test('キーボードでフォーカスしても出る', async ({ page }) => {
	await page.goto(story('重なる物-hovercard--default'))
	const trigger = page.getByRole('link', { name: '山田商店' })
	await trigger.focus()
	await expect(trigger).toBeFocused()
	await expect(page.getByText('取引先 C-0001・渋谷区')).toBeVisible()

	// フォーカスが離れると消える
	await trigger.blur()
	await expect(page.getByText('取引先 C-0001・渋谷区')).toHaveCount(0)
})
