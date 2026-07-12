import { Kbd } from '@tachyon-sdk/native-ui'

export const Shortcut = () => (
	<div className='flex w-64 items-center'>
		<span className='text-sm text-foreground'>Open command menu</span>
		<span className='ml-auto flex items-center gap-1'>
			<Kbd>⌘</Kbd>
			<Kbd>K</Kbd>
		</span>
	</div>
)

export const ShortcutList = () => (
	<div className='flex w-64 flex-col gap-2'>
		<div className='flex items-center justify-between'>
			<span className='text-sm text-foreground'>New issue</span>
			<Kbd>C</Kbd>
		</div>
		<div className='flex items-center justify-between'>
			<span className='text-sm text-foreground'>Assign to me</span>
			<Kbd>I</Kbd>
		</div>
		<div className='flex items-center justify-between'>
			<span className='text-sm text-foreground'>Toggle sidebar</span>
			<span className='flex items-center gap-1'>
				<Kbd>⌘</Kbd>
				<Kbd>\</Kbd>
			</span>
		</div>
	</div>
)

export const ModifierKeys = () => (
	<div className='flex items-center gap-1'>
		<Kbd>⌘</Kbd>
		<Kbd>⇧</Kbd>
		<Kbd>⌥</Kbd>
		<Kbd>⌃</Kbd>
		<Kbd>↵</Kbd>
		<Kbd>Esc</Kbd>
	</div>
)
