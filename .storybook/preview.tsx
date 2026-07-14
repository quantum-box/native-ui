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
		controls: {
			matchers: {
				color: /(background|color)$/i,
				date: /Date$/i,
			},
		},
	},
}

export default preview
