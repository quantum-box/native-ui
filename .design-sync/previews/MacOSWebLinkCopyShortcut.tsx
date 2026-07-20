import {
	Kbd,
	MacOSWebLinkCopyShortcut,
} from '@tachyon-sdk/native-ui'

export const ShortcutGuide = () => (
	<div className='w-96 space-y-4 rounded-lg border border-border bg-background p-5 shadow-overlay'>
		<MacOSWebLinkCopyShortcut
			enabled={false}
			getWebUrl={() => 'https://platform.example/apps'}
			getPageTitle={() => 'Applications'}
		/>
		<div>
			<p className='font-medium text-foreground text-sm'>Share this page</p>
			<p className='mt-1 text-muted-foreground text-xs'>
				Native shortcuts for a Tauri window without an address bar.
			</p>
		</div>
		<div className='space-y-2 text-sm'>
			<div className='flex items-center justify-between'>
				<span>Copy web URL</span>
				<span className='flex gap-1'>
					<Kbd>⌘</Kbd>
					<Kbd>L</Kbd>
				</span>
			</div>
			<div className='flex items-center justify-between'>
				<span>Copy linked title</span>
				<span className='flex gap-1'>
					<Kbd>⌘</Kbd>
					<Kbd>⇧</Kbd>
					<Kbd>L</Kbd>
				</span>
			</div>
		</div>
	</div>
)
