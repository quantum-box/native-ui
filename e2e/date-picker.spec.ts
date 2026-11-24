import { expect, test } from '@playwright/test'

import { findLayoutProblems } from '../src/testing'

// カレンダーと日付の入力欄を、本物のブラウザで動かして確かめる。
// 見本では「今日」を 2026/11/24 に固定している。

const story = (id: string) =>
	`/iframe.html?id=${encodeURIComponent(id)}&viewMode=story&globals=theme:light`

test('開くと選んだ日にフォーカスがあり、矢印と Enter で選ぶと閉じて、開くボタンへ戻る', async ({
	page,
}) => {
	await page.goto(story('date-picker--default'))
	const input = page.getByRole('textbox', { name: '納期' })
	const open = page.getByRole('button', { name: 'カレンダーを開く' })
	await expect(input).toHaveValue('2026/11/18')

	await open.click()
	await expect(page.getByRole('grid', { name: '2026年11月' })).toBeVisible()
	await expect(page.locator('[data-date="2026-11-18"]')).toBeFocused()

	await page.keyboard.press('ArrowRight')
	await page.keyboard.press('ArrowDown')
	await expect(page.locator('[data-date="2026-11-26"]')).toBeFocused()
	await page.keyboard.press('PageDown')
	await expect(page.getByRole('grid', { name: '2026年12月' })).toBeVisible()
	await expect(page.locator('[data-date="2026-12-26"]')).toBeFocused()
	await page.keyboard.press('Enter')

	await expect(page.locator('[data-slot="calendar"]')).toHaveCount(0)
	await expect(input).toHaveValue('2026/12/26')
	await expect(page.getByText('値: 2026-12-26')).toBeVisible()
	await expect(open).toBeFocused()
})

test('Esc で閉じると値は変わらず、開くボタンへ戻る', async ({ page }) => {
	await page.goto(story('date-picker--default'))
	const open = page.getByRole('button', { name: 'カレンダーを開く' })
	await open.click()
	await page.keyboard.press('ArrowRight')
	await page.keyboard.press('Escape')
	await expect(page.locator('[data-slot="calendar"]')).toHaveCount(0)
	await expect(page.getByRole('textbox', { name: '納期' })).toHaveValue(
		'2026/11/18',
	)
	await expect(open).toBeFocused()
})

test('手で打って Tab で離れると、日付に直る。読めない文字は元に戻る', async ({
	page,
}) => {
	await page.goto(story('date-picker--default'))
	const input = page.getByRole('textbox', { name: '納期' })

	await input.fill('12/5')
	await page.keyboard.press('Tab')
	await expect(input).toHaveValue('2026/12/05')
	await expect(page.getByText('値: 2026-12-05')).toBeVisible()

	await input.fill('あした')
	await page.keyboard.press('Tab')
	await expect(input).toHaveValue('2026/12/05')

	await input.fill('')
	await page.keyboard.press('Tab')
	await expect(page.getByText('値: （空）')).toBeVisible()
})

test('Tab は、入力欄から開くボタンへ動く。開いたカレンダーの中は、月のボタン・日・下のボタン', async ({
	page,
}) => {
	await page.goto(story('date-picker--default'))
	await page.getByRole('textbox', { name: '納期' }).focus()
	await page.keyboard.press('Tab')
	await expect(
		page.getByRole('button', { name: 'カレンダーを開く' }),
	).toBeFocused()
	await page.keyboard.press('Enter')
	await expect(page.locator('[data-date="2026-11-18"]')).toBeFocused()
	await page.keyboard.press('Tab')
	await expect(page.getByRole('button', { name: '今日', exact: true })).toBeFocused()
	await page.keyboard.press('Shift+Tab')
	await expect(page.locator('[data-date="2026-11-18"]')).toBeFocused()
	await page.keyboard.press('Shift+Tab')
	await expect(page.getByRole('button', { name: '次の月' })).toBeFocused()
})

test('選べない日は押しても選ばれず、開いたままになる', async ({ page }) => {
	await page.goto(story('date-picker--選べない日'))
	const input = page.getByRole('textbox', { name: '予約の日' })
	await expect(page.locator('[data-slot="calendar"]')).toBeVisible()

	// 土曜と、今日より前の日
	// （Playwright は aria-disabled の物を「押せるまで待つ」ので、force で押す）
	await page.locator('[data-date="2026-11-28"]').click({ force: true })
	await page.locator('[data-date="2026-11-20"]').click({ force: true })
	await expect(page.locator('[data-slot="calendar"]')).toBeVisible()
	await expect(input).toHaveValue('2026/11/26')
	await expect(page.getByRole('button', { name: '前の月' })).toBeDisabled()

	await page.locator('[data-date="2026-11-27"]').click()
	await expect(input).toHaveValue('2026/11/27')
})

test('期間: はじめを押してマウスを動かすと帯が伸び、終わりを押すと閉じる', async ({
	page,
}) => {
	await page.goto(story('date-picker--期間'))
	const trigger = page.getByRole('button', { name: '集計の期間' })
	await expect(trigger).toHaveText('2026/11/01 〜 2026/11/30')

	await trigger.click()
	await page.locator('[data-date="2026-11-10"]').click()
	await expect(page.getByText('終わりの日を選んでください')).toBeVisible()
	await page.locator('[data-date="2026-11-13"]').hover()
	await expect(page.locator('td[data-in-range]')).toHaveCount(4)
	// 途中では、外の値は変わらない
	await expect(page.getByText('値: 2026-11-01 〜 2026-11-30')).toBeVisible()

	await page.locator('[data-date="2026-11-18"]').click()
	await expect(page.locator('[data-slot="calendar"]')).toHaveCount(0)
	await expect(trigger).toHaveText('2026/11/10 〜 2026/11/18')
	await expect(page.getByText('値: 2026-11-10 〜 2026-11-18')).toBeVisible()
	await expect(trigger).toBeFocused()
})

test('期間: 途中で閉じると、元の期間のまま', async ({ page }) => {
	await page.goto(story('date-picker--期間'))
	const trigger = page.getByRole('button', { name: '集計の期間' })
	await trigger.click()
	await page.locator('[data-date="2026-11-10"]').click()
	await page.keyboard.press('Escape')
	await expect(trigger).toHaveText('2026/11/01 〜 2026/11/30')

	await trigger.click()
	await expect(page.locator('td[data-in-range]')).toHaveCount(30)
})

test('期間: キーボードだけで選べる', async ({ page }) => {
	await page.goto(story('date-picker--期間'))
	const trigger = page.getByRole('button', { name: '集計の期間' })
	await trigger.focus()
	await page.keyboard.press('Enter')
	await expect(page.locator('[data-date="2026-11-01"]')).toBeFocused()
	await page.keyboard.press('ArrowDown')
	await page.keyboard.press('Enter')
	await page.keyboard.press('ArrowDown')
	await page.keyboard.press('ArrowRight')
	await expect(page.locator('td[data-in-range]')).toHaveCount(9)
	await page.keyboard.press('Enter')
	await expect(trigger).toHaveText('2026/11/08 〜 2026/11/16')
})

test('Calendar: 月を動かすボタンで前後の月を見せ、今日に印がある', async ({
	page,
}) => {
	await page.goto(story('calendar--default'))
	await expect(page.locator('[aria-current="date"]')).toHaveAttribute(
		'data-date',
		'2026-11-24',
	)
	await page.getByRole('button', { name: '次の月' }).click()
	await page.getByRole('button', { name: '次の月' }).click()
	await expect(page.getByRole('grid', { name: '2027年1月' })).toBeVisible()
	await page.getByRole('button', { name: '前の月' }).click()
	await expect(page.getByRole('grid', { name: '2026年12月' })).toBeVisible()
	// 月を動かしただけでは、選んだ日は変わらない
	await expect(page.getByText('選んだ日: 2026-11-18')).toBeVisible()
})

test('欄の中に並べても、入力欄の上端がそろい、はみ出さない', async ({
	page,
}) => {
	await page.goto(story('date-picker--欄の中'))
	await expect(page.getByLabel('営業日')).toHaveValue('2026/11/24')
	expect(await page.evaluate(findLayoutProblems)).toEqual([])
})
