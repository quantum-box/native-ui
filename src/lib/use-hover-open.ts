import * as React from 'react'

/**
 * 小さな枠（Popover）を、指を乗せると開き、離すと少し待って閉じるようにする。
 * 押す・キーボードでの開け閉めは Popover のまま使える。
 * 返す `hover` は、開く元と枠の中身の両方に付ける。
 */
export function useHoverOpen() {
	const [open, setOpen] = React.useState(false)
	const timer = React.useRef<ReturnType<typeof setTimeout>>()
	const cancel = React.useCallback(() => {
		if (timer.current) clearTimeout(timer.current)
	}, [])
	React.useEffect(() => cancel, [cancel])
	const hover = {
		onPointerEnter: (event: React.PointerEvent) => {
			if (event.pointerType !== 'mouse') return
			cancel()
			setOpen(true)
		},
		onPointerLeave: (event: React.PointerEvent) => {
			if (event.pointerType !== 'mouse') return
			cancel()
			timer.current = setTimeout(() => setOpen(false), 150)
		},
	}
	return { open, setOpen, hover }
}
