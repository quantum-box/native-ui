/// <reference types="vite/client" />
import { describe, expect, it } from 'vitest'

/**
 * Story ids are addresses other pages hold on to: the Field LP embeds stories
 * by id, and the user guide links to them. Storybook builds an id from the
 * title unless the meta names one, so moving a component to another group
 * (`Components/Button` → `基本/Button`) used to break every outside link.
 *
 * Each story file therefore pins its meta `id` to the file name. The group and
 * the display title can change freely; the id changes only when the file is
 * renamed. The part after `--` comes from the story's export name, so renaming
 * an export still changes that one story's id.
 */

const sources = import.meta.glob<string>('./**/*.stories.tsx', {
	query: '?raw',
	import: 'default',
	eager: true,
})

function metaId(source: string): string | null {
	const metaStart = source.search(/^const meta\b/m)
	if (metaStart < 0) return null
	const match = /^\s*id:\s*'([^']+)'/m.exec(source.slice(metaStart))
	return match ? match[1] : null
}

type StoryFile = { path: string; expected: string; id: string | null }

// The package targets ES2015, so `Object.entries` is not in its lib.
const files: StoryFile[] = Object.keys(sources).map(path => ({
	path,
	expected: (path.split('/').pop() ?? path).replace(/\.stories\.tsx$/, ''),
	id: metaId(sources[path]),
}))

describe('story ids', () => {
	it('finds the story files', () => {
		expect(files.length).toBeGreaterThan(0)
	})

	it.each(files)('$path pins its id to the file name', ({ id, expected }) => {
		expect(id).toBe(expected)
	})

	it('has no two files with the same id', () => {
		const ids = files.map(file => file.id)
		expect(new Set(ids).size).toBe(ids.length)
	})
})
