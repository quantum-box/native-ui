export type RuntimeTarget = 'web' | 'desktop' | 'mobile'
export type NavigationMode = 'browser' | 'hash'

export type PlatformAdapter = Readonly<{
	navigationMode: NavigationMode
	runtimeLabel: string
	target: RuntimeTarget
}>

const mobilePlatforms = new Set(['android', 'ios'])

export function createPlatformAdapter(
	platform = import.meta.env.TAURI_ENV_PLATFORM?.toLowerCase(),
): PlatformAdapter {
	if (!platform) {
		return {
			navigationMode: 'browser',
			runtimeLabel: 'Web',
			target: 'web',
		}
	}

	if (mobilePlatforms.has(platform)) {
		return {
			navigationMode: 'hash',
			runtimeLabel: platform === 'ios' ? 'iOS' : 'Android',
			target: 'mobile',
		}
	}

	return {
		navigationMode: 'hash',
		runtimeLabel: platform[0]?.toUpperCase() + platform.slice(1),
		target: 'desktop',
	}
}

export const platformAdapter = Object.freeze(createPlatformAdapter())
