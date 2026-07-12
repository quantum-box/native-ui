import type { Config } from 'tailwindcss'
import animatePlugin from 'tailwindcss-animate'

/**
 * Tailwind (v3) preset that maps the Tachyon Native UI design tokens
 * (`styles/tokens.css`) to shadcn-compatible utility names.
 *
 * Consumer apps must:
 * 1. add this preset to `presets` in their tailwind config
 * 2. include `../../packages/native-ui/src` in `content`
 * 3. import `@tachyon-sdk/native-ui/src/styles/tokens.css` globally
 */
const preset = {
	darkMode: ['class'],
	content: [],
	theme: {
		extend: {
			fontFamily: {
				sans: ['var(--nui-font-sans)'],
				mono: ['var(--nui-font-mono)'],
			},
			// Native-app density: overrides the default Tailwind type scale
			fontSize: {
				'2xs': ['11px', { lineHeight: '16px' }],
				xs: ['12px', { lineHeight: '18px' }],
				sm: ['13px', { lineHeight: '20px' }],
				base: ['14px', { lineHeight: '22px' }],
				lg: ['16px', { lineHeight: '24px', letterSpacing: '-0.01em' }],
				xl: ['20px', { lineHeight: '28px', letterSpacing: '-0.01em' }],
				'2xl': ['24px', { lineHeight: '32px', letterSpacing: '-0.01em' }],
			},
			colors: {
				border: {
					DEFAULT: 'hsl(var(--nui-border) / <alpha-value>)',
					strong: 'hsl(var(--nui-border-strong) / <alpha-value>)',
				},
				input: 'hsl(var(--nui-border-strong) / <alpha-value>)',
				ring: 'hsl(var(--nui-ring) / <alpha-value>)',
				background: 'hsl(var(--nui-background) / <alpha-value>)',
				foreground: 'hsl(var(--nui-foreground) / <alpha-value>)',
				surface: 'hsl(var(--nui-surface) / <alpha-value>)',
				primary: {
					DEFAULT: 'hsl(var(--nui-primary) / <alpha-value>)',
					foreground: 'hsl(var(--nui-primary-foreground) / <alpha-value>)',
				},
				secondary: {
					DEFAULT: 'hsl(var(--nui-surface) / <alpha-value>)',
					foreground: 'hsl(var(--nui-foreground) / <alpha-value>)',
				},
				destructive: {
					DEFAULT: 'hsl(var(--nui-destructive) / <alpha-value>)',
					foreground: 'hsl(var(--nui-destructive-foreground) / <alpha-value>)',
				},
				success: 'hsl(var(--nui-success) / <alpha-value>)',
				warning: 'hsl(var(--nui-warning) / <alpha-value>)',
				muted: {
					DEFAULT: 'hsl(var(--nui-muted) / <alpha-value>)',
					foreground: 'hsl(var(--nui-muted-foreground) / <alpha-value>)',
				},
				subtle: {
					foreground: 'hsl(var(--nui-subtle-foreground) / <alpha-value>)',
				},
				// shadcn "accent" = hover highlight, not the brand accent
				accent: {
					DEFAULT: 'hsl(var(--nui-muted) / <alpha-value>)',
					foreground: 'hsl(var(--nui-foreground) / <alpha-value>)',
				},
				selected: 'hsl(var(--nui-selected) / <alpha-value>)',
				popover: {
					DEFAULT: 'hsl(var(--nui-popover) / <alpha-value>)',
					foreground: 'hsl(var(--nui-popover-foreground) / <alpha-value>)',
				},
				card: {
					DEFAULT: 'hsl(var(--nui-background) / <alpha-value>)',
					foreground: 'hsl(var(--nui-foreground) / <alpha-value>)',
				},
			},
			borderRadius: {
				sm: 'var(--nui-radius-sm)',
				DEFAULT: 'var(--nui-radius-md)',
				md: 'var(--nui-radius-md)',
				lg: 'var(--nui-radius-lg)',
				xl: 'var(--nui-radius-xl)',
			},
			boxShadow: {
				overlay: 'var(--nui-shadow-overlay)',
				modal: 'var(--nui-shadow-modal)',
			},
			transitionDuration: {
				fast: '100ms',
				base: '150ms',
				slow: '250ms',
			},
			transitionTimingFunction: {
				'out-quart': 'cubic-bezier(0.25, 1, 0.5, 1)',
				'in-out-quart': 'cubic-bezier(0.45, 0, 0.55, 1)',
			},
			keyframes: {
				'accordion-down': {
					from: { height: '0' },
					to: { height: 'var(--radix-accordion-content-height)' },
				},
				'accordion-up': {
					from: { height: 'var(--radix-accordion-content-height)' },
					to: { height: '0' },
				},
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
			},
		},
	},
	plugins: [animatePlugin],
} satisfies Config

export default preset
