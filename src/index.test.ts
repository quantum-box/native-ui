import { describe, expect, it } from 'vitest'

import * as nativeUi from './index'

describe('public API', () => {
	it.each([
		'Table',
		'TableHeader',
		'TableBody',
		'TableRow',
		'TableHead',
		'TableCell',
		'TableCaption',
		'Form',
		'FormField',
		'FormItem',
		'FormLabel',
		'FormControl',
		'FormMessage',
		'FormDescription',
		'Tabs',
		'TabsList',
		'TabsTrigger',
		'TabsContent',
		'Toaster',
		'toast',
		'Checkbox',
		'Switch',
		'MacOSWindowTabs',
	])('exports %s', exportName => {
		expect(nativeUi[exportName as keyof typeof nativeUi]).toBeDefined()
	})
})
