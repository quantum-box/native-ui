import {
	type MacOSWindowTab,
	MacOSWindowTabs,
} from '@tachyon-sdk/native-ui'

const tabs: MacOSWindowTab[] = [
	{ id: 'apps', title: 'Apps' },
	{ id: 'storage', title: 'Storage' },
	{ id: 'jobs', title: 'Coding Jobs' },
]

export const IntegratedTitlebar = () => (
	<div className='relative w-[820px] overflow-hidden rounded-xl border border-border bg-background shadow-modal'>
		<div
			aria-hidden='true'
			className='pointer-events-none absolute left-3 top-[14px] z-10 flex gap-2'
		>
			<span className='size-3 rounded-full bg-[#ff5f57]' />
			<span className='size-3 rounded-full bg-[#febc2e]' />
			<span className='size-3 rounded-full bg-[#28c840]' />
		</div>
		<MacOSWindowTabs
			tabs={tabs}
			activeTabId='storage'
			onTabSelect={() => undefined}
			onTabClose={() => undefined}
			onNewTab={() => undefined}
		/>
		<div className='flex h-24 items-center justify-center text-muted-foreground text-sm'>
			Storage content
		</div>
	</div>
)
