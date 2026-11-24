import { expect, test } from '@playwright/test'

// base-ui に移した HoverCard を、本物のブラウザで動かす。
// 触れて 0.7 秒で出て、離れて 0.3 秒で消える（Radix の HoverCard と同じ）。

const story = (id: string) =>
	`/iframe.html?id=${encodeURIComponent(id)}&viewMode=story&globals=theme:light`

test('触れて少し待つと出て、離れると消え、何も残らない', async ({ page }) => {
	await page.goto(story('hover-card--default'))
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
	await page.goto(story('hover-card--default'))
	const trigger = page.getByRole('link', { name: '山田商店' })
	await trigger.focus()
	await expect(trigger).toBeFocused()
	await expect(page.getByText('取引先 C-0001・渋谷区')).toBeVisible()

	// フォーカスが離れると消える
	await trigger.blur()
	await expect(page.getByText('取引先 C-0001・渋谷区')).toHaveCount(0)
})

test('中身の文を選んでいるあいだは、指が離れても閉じない（外を押すと閉じる）', async ({
	page,
}) => {
	await page.goto(story('hover-card--default'))
	const trigger = page.getByRole('link', { name: '山田商店' })
	const line = page.getByText('最後の取引: 2026-11-20（¥182,400）')

	await trigger.hover()
	await expect(line).toBeVisible()
	// 開く動き（少し大きくなる）が終わってから場所を測る。動いている途中に測ると、
	// なぞり始める場所が中身の外にずれることがある
	await page.waitForFunction(() =>
		document.getAnimations().every(animation => animation.playState !== 'running'),
	)

	// 中身の 1 行を、左から右へなぞって選び、そのまま指を遠くへ動かしてから離す
	const box = await line.boundingBox()
	if (!box) throw new Error('中身の場所が分からない')
	await page.mouse.move(box.x + 2, box.y + box.height / 2)
	await page.mouse.down()
	await page.mouse.move(box.x + box.width - 2, box.y + box.height / 2, {
		steps: 5,
	})
	await page.mouse.move(700, 600, { steps: 5 })
	await page.mouse.up()

	// 閉じる待ち時間（0.3 秒）を過ぎても、中身と選んだ文が残る
	await page.waitForTimeout(800)
	await expect(line).toBeVisible()
	const selected = await page.evaluate(() =>
		document.getSelection()?.toString(),
	)
	expect(selected).toContain('最後の取引')

	// 外を押すと閉じる
	await page.mouse.click(5, 5)
	await expect(line).toHaveCount(0)
})
