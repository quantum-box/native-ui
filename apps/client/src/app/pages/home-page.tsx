import { Badge, Button } from '@tachyon-sdk/native-ui'
import { ArrowRight, Monitor, Smartphone, TabletSmartphone } from 'lucide-react'
import { Link } from 'react-router-dom'

import { platformAdapter } from '../../platform/adapter'

const targets = [
	{ icon: Monitor, label: 'Web', note: 'Vite static build' },
	{ icon: TabletSmartphone, label: 'Desktop', note: 'Tauri v2 bundle' },
	{ icon: Smartphone, label: 'Mobile', note: 'Android / iOS' },
]

export function HomePage() {
	return (
		<div className='mx-auto w-full max-w-5xl px-4 py-8 sm:px-8 sm:py-12'>
			<div className='max-w-2xl'>
				<div className='mb-3 flex items-center gap-2'>
					<Badge variant='success'>Scaffold ready</Badge>
					<span className='text-xs text-muted-foreground'>
						{platformAdapter.runtimeLabel}
					</span>
				</div>
				<h1 className='font-semibold text-2xl tracking-tight'>
					ひとつのUI、すべてのターゲット
				</h1>
				<p className='mt-3 text-base text-muted-foreground'>
					ReactとViteの共通フロントエンドを、Web・desktop・mobileへ展開する基盤です。
				</p>
			</div>

			<div className='mt-8 grid gap-3 sm:grid-cols-3'>
				{targets.map(({ icon: Icon, label, note }) => (
					<div
						className='border-border border bg-surface p-4 shadow-none'
						key={label}
					>
						<Icon className='size-5 text-primary' />
						<div className='mt-4 font-medium text-sm'>{label}</div>
						<div className='mt-1 text-xs text-muted-foreground'>{note}</div>
					</div>
				))}
			</div>

			<div className='mt-8 flex items-center gap-3 border-border border-t pt-6'>
				<Button asChild variant='primary'>
					<Link to='/roadmap'>
						移植ロードマップを見る
						<ArrowRight />
					</Link>
				</Button>
				<span className='text-xs text-muted-foreground'>認証はPR2で追加</span>
			</div>
		</div>
	)
}
