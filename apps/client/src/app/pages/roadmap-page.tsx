import { Badge } from '@tachyon-sdk/native-ui'

const phases = [
	{ label: 'PR1', status: '進行中', title: 'Cross-platform scaffold' },
	{ label: 'PR2', status: '次', title: 'Cognito authentication' },
	{ label: 'PR3', status: '予定', title: 'IAM and app shell' },
	{ label: 'PR4+', status: '予定', title: 'Admin feature migration' },
]

export function RoadmapPage() {
	return (
		<div className='mx-auto w-full max-w-4xl px-4 py-8 sm:px-8 sm:py-12'>
			<h1 className='font-semibold text-xl'>移植ロードマップ</h1>
			<p className='mt-2 text-sm text-muted-foreground'>
				各段階を独立したPRとして、全ターゲットのbuildを維持します。
			</p>
			<div className='mt-6 border-border border-t'>
				{phases.map((phase, index) => (
					<div
						className='flex min-h-16 items-center gap-4 border-border border-b px-1 py-3'
						key={phase.label}
					>
						<span className='w-10 font-mono text-xs text-subtle-foreground'>
							{phase.label}
						</span>
						<span className='min-w-0 flex-1 font-medium text-sm'>
							{phase.title}
						</span>
						<Badge variant={index === 0 ? 'success' : 'neutral'}>
							{phase.status}
						</Badge>
					</div>
				))}
			</div>
		</div>
	)
}
