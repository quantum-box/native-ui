import {
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Input,
	Label,
} from '@tachyon-sdk/native-ui'

// Rendered statically open via the controlled `open` prop.
// DialogContent is position-fixed and centers itself inside the
// 640x480 card viewport.
export const RenameProject = () => (
	<Dialog open>
		<DialogContent>
			<DialogHeader>
				<DialogTitle>Rename project</DialogTitle>
				<DialogDescription>
					The new name is visible to everyone in your workspace.
				</DialogDescription>
			</DialogHeader>
			<div className='flex flex-col gap-2'>
				<Label htmlFor='project-name'>Project name</Label>
				<Input id='project-name' defaultValue='Website redesign' />
			</div>
			<DialogFooter>
				<Button>Cancel</Button>
				<Button variant='primary'>Save</Button>
			</DialogFooter>
		</DialogContent>
	</Dialog>
)

export const ConfirmDelete = () => (
	<Dialog open>
		<DialogContent>
			<DialogHeader>
				<DialogTitle>Delete project?</DialogTitle>
				<DialogDescription>
					This will permanently delete “Website redesign” and its 24
					issues. This action cannot be undone.
				</DialogDescription>
			</DialogHeader>
			<DialogFooter>
				<Button>Cancel</Button>
				<Button variant='destructive'>Delete project</Button>
			</DialogFooter>
		</DialogContent>
	</Dialog>
)
