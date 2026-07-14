import { Boxes, LayoutDashboard } from 'lucide-react'

export const navigationItems = [
	{
		icon: LayoutDashboard,
		label: 'ホーム',
		to: '/',
	},
	{
		icon: Boxes,
		label: '移植ロードマップ',
		to: '/roadmap',
	},
] as const
