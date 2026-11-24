import type { Decorator, Preview } from '@storybook/react-vite'
import React from 'react'

import './storybook.css'

const withTheme: Decorator = (Story, context) => {
	const theme = context.globals.theme ?? 'light'
	document.documentElement.classList.toggle('dark', theme === 'dark')
	document.body.classList.add('bg-background', 'text-foreground', 'font-sans')
	return <Story />
}

const preview: Preview = {
	globalTypes: {
		theme: {
			description: 'Color scheme',
			toolbar: {
				title: 'Theme',
				icon: 'mirror',
				items: ['light', 'dark'],
				dynamicTitle: true,
			},
		},
	},
	initialGlobals: {
		theme: 'light',
	},
	decorators: [withTheme],
	parameters: {
		layout: 'centered',
		options: {
			// 左の一覧の 1 段目（見出し）の並び。部品の置き場（src/components/<見出し>）と同じ順。
			// 見出しの中の部品は、名前の順に並べる
			storySort: {
				order: [
					'基本',
					'入力',
					'重なる物',
					'並べる・見せる',
					'表',
					'AI',
					'AI チャット',
					'データ基盤の値',
					'画面の枠',
				],
				method: 'alphabetical',
			},
		},
		controls: {
			matchers: {
				color: /(background|color)$/i,
				date: /Date$/i,
			},
		},
	},
}

export default preview
