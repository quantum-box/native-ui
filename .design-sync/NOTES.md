# design-sync notes — @tachyon-sdk/native-ui

## Repo specifics

- The package has NO build (`main: src/index.ts`, source-direct + consumer `transpilePackages`). The converter bundles straight from `src/index.ts` — pass `--entry src/index.ts` and `--node-modules ./node_modules` (repo root; yarn hoists react there, the package's own node_modules is sparse).
- Styling is consumer-compiled Tailwind v3: `cfg.buildCmd` runs the Tailwind CLI with `.design-sync/tailwind.build.ts` (uses the package's own `tailwind-preset.ts`; content = package src + `.design-sync/previews/`) into `dist/native-ui.css` (`dist/` is gitignored repo-wide). **Run buildCmd before package-build.mjs whenever a preview adds new utility classes.**
- Tokens (`--nui-*`) are inlined into the compiled CSS by postcss-import — no separate tokens/ dir, `tokensGlob` doesn't apply (it requires `tokensPkg`).
- Inter is provided by consumer apps via `next/font/google`, not shipped in the repo. Downloaded Inter variable woff2 (latin + latin-ext, OFL) into `.design-sync/fonts/inter/` and wired via `cfg.extraFonts` (user-approved 2026-07-07).
- `TooltipProvider` is set as `cfg.provider` (needed by Radix Tooltip; harmless for everything else). It is also excluded from the component list via `componentSrcMap: null` along with all 46 subcomponent exports (DialogTrigger, SelectItem, …) — only the 12 root components get cards; subcomponents remain bundle exports.
- Playwright: repo pins 1.50.0 (chromium-1155, NOT in the local cache). `.ds-sync` installs playwright@1.61.0 → chromium-1228 which IS cached. Re-check on a new machine.
- macOS + fish: `cd` in a compound Bash command persists into later tool calls — run from repo root with absolute paths.
- DesignSync write_files: chunks >~700KB total time out (60s) — send the 674KB `_ds_bundle.js` alone and keep other chunks ≤10 files / few hundred KB.

## Known render warns (triaged as legitimate)

- `[FONT_MISSING] "JetBrains Mono"` — mid-stack mono fallback (`ui-monospace, SF Mono, …`); user approved system-font substitution (2026-07-07). Do not ship it.

## Pipeline learnings (wave 1)

- **`viewport` is a graded cfg-slice key** (only `cardMode`/`primaryStory` are presentation-exempt). After adding/changing `overrides.<Name>.viewport`, run a full `package-build.mjs` to re-stamp BEFORE any targeted `preview-rebuild.mjs` — otherwise `[CONFIG_STALE]` blocks every affected component.
- Always chain `preview-rebuild.mjs && package-capture.mjs`. A capture racing an in-flight rebuild silently drops components whose `_preview/<Name>.js` isn't written yet and fails the rest with "window.__dsCells is empty".
- Rebuild timing: scoped preview-rebuilds were observed idling (8m26s wall, ~3.5s CPU) under parallel-agent load; run them foreground with a ~10-min budget.
- Overlay (Radix portal) previews: controlled `open` on Root/Sub/Select renders statically, no interaction needed. Anchor the trigger with `style={{display:'flex', alignItems:'flex-start', minHeight: <viewportHeight - ~80>}}` so portal content drops downward in-frame. Radix Select popper sizes the list to the trigger width — put widths on a wrapper div.
- Destructive menu items: the component CSS forces `[&_svg]:text-muted-foreground`; tint the lucide icon via inline `style={{color: 'inherit'}}` + `className='text-destructive focus:text-destructive'` on the item.
- Badge has no `whitespace-nowrap` — give preview rows explicit width and `shrink-0`. Vertical Separator is `h-full` — inline height (e.g. 16px) inside toolbar rows, `width: 'fit-content'` on the row.

## Re-sync risks (watch-list for the next run)

- **Compiled-CSS coverage**: `dist/native-ui.css` only contains utilities used by package src + `.design-sync/previews/`. New/edited previews with new classes need `buildCmd` re-run BEFORE package-build, or they render unstyled in capture (agents worked around with inline styles).
- **Inter woff2 is a pinned copy** (`.design-sync/fonts/inter/`, downloaded 2026-07-07 from Google Fonts, latin+latin-ext only). If the apps change font (next/font in `apps/tachyon/src/app/layout.tsx`), this goes stale. Japanese text renders via system fallbacks (Hiragino/Noto Sans JP are not shipped).
- **componentSrcMap null-list is an enumeration**: when a new component is added to `src/index.ts`, its subcomponent exports will appear as NEW component cards until nulls are added here. Check the build's `components:` count (expected: 12 roots) after any package export change.
- **Playwright/chromium matching** is machine-specific (this machine: playwright@1.61.0 ↔ cached chromium-1228). Re-verify on a new machine.
- Partial verification: dark-mode rendering (`.dark`) was never captured — previews cover light mode only.

## Preview authoring learnings (solo wave)

- Previews import from `@tachyon-sdk/native-ui`; `lucide-react` resolves from root node_modules and bundles fine.
- Layout glue classes in previews compile only if buildCmd ran after authoring (content scan includes previews/). Verify a class exists in `ds-bundle/_ds_bundle.css` before relying on it mid-wave, or use inline styles.
- Command palette chrome: `w-[420px] overflow-hidden rounded-lg border border-border bg-popover shadow-modal` renders the Linear-style level-2 panel.
- Default Button variant is `secondary` (quiet bordered); `primary` reserved for the main action — previews follow that convention.

## Repo move (2026-07-12)

- Migrated from `quantum-box/tachyon-apps` `packages/native-ui/` to this standalone repo `quantum-box/native-ui`. All `.design-sync` paths were rewritten to repo-root relative (`--entry src/index.ts`, `--node-modules ./node_modules` — this repo has its own yarn install now, no monorepo hoisting). The Claude Design project pin is unchanged.
- Consumers (tachyon-apps `apps/tachyon`, field, …) install via GitHub dependency `"quantum-box/native-ui"` + `transpilePackages`. Inter is still consumer-provided via `next/font`.

## Re-sync after repo move (2026-07-12)

- First re-sync from this standalone repo completed clean. All 12 sourceKeys held (grades carried forward); renderHashes churned across the board — expected pipeline churn from the move (entry path change + Biome now formats `src/components/ui/*` with tabs, which the monorepo root config had excluded). Canary spot-check (Badge/Separator/Button/Kbd/Dialog) graded good 5/5.
- `guidelinesGlob: "docs/*.md"` emits `guidelines/docs/<name>.md` (nested, mirrors the glob dir). The old flat `guidelines/design-system.md` / `guidelines/page-example.md` were deleted remotely in the same plan.
- `fonts/JetBrainsMono-Regular.ttf` exists REMOTELY but is not emitted by this build (mono stays system-fallback per the earlier decision). Left in place as a harmless orphan; delete on a future close-out if it bothers anyone.
- Remote anchor fetch: save `DesignSync get_file _ds_sync.json` to `.design-sync/.cache/remote-anchor.json` and pass via `--remote`. Driver invocation from this repo: `node .ds-sync/resync.mjs --config .design-sync/config.json --node-modules ./node_modules --out ./ds-bundle --remote .design-sync/.cache/remote-anchor.json --entry src/index.ts` (run `cfg.buildCmd` first — `dist/` is gitignored and must be rebuilt on a fresh clone).
- `.ds-sync/` (converter toolchain) is gitignored; it was carried over from the tachyon-apps worktree. On a new machine, a fresh /design-sync run re-stages it from the skill.
