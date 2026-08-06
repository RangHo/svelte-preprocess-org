# AGENTS.md

Guidance for AI coding agents (Claude, Copilot, etc.) working in this repository.

## What this repo is

`svelte-preprocess-org` is a Svelte preprocessor that turns Org-mode
(`.org`) documents into Svelte components. It works by shelling out to a
real Emacs process (batch mode) that runs
[`ox-svelte`](https://github.com/RangHo/ox-svelte), an Org export backend,
and captures the generated Svelte source from stdout.

This is a pnpm workspace ("monorepo") with two packages:

- `packages/svelte-preprocess-org` — the actual npm package published to
  npm (`svelte-preprocess-org`). This is the thing users install.
- `packages/preview` — a private SvelteKit app used to manually exercise
  the preprocessor end-to-end (not published).

## Prerequisites

- Node.js (see `packageManager`/`engines` in root `package.json`: pnpm
  `^10.6.4`, via Corepack).
- pnpm, via `corepack enable`.
- **Emacs 30+ with Org 9.4+ installed and on `PATH`.** The preprocessor
  and its tests spawn a real `emacs --batch` process
  (`packages/svelte-preprocess-org/src/emacs.ts`). Without Emacs
  installed, anything that actually runs the preprocessor (tests, the
  preview app's `.org` compilation) will fail with `emacs: command not
  found` or similar. Many sandboxes/CI containers do **not** have Emacs —
  check before assuming a failure is a real regression.

## Repo layout

```
packages/
  svelte-preprocess-org/   # the published package
    src/
      index.ts             # orgPreprocess() entry point (Svelte PreprocessorGroup)
      emacs.ts             # tiny S-expression DSL + Emacs subprocess wrapper
      org-export.ts        # maps OrgExportCustomization -> `ox` (org-export-*) setq forms
      org-svelte.ts         # maps OrgSvelteCustomization -> `ox-svelte` (org-svelte-*) setq forms
      utilities.ts          # small helpers (e.g. camelCase -> kebab-case)
      *.test.ts             # vitest unit tests, colocated with source
    tsdown.config.js         # build config (outputs dist/, .d.ts included)
    vitest.config.js
    eslint.config.js
  preview/                  # private SvelteKit demo app (workspace:* dependency on the package above)
    src/routes/, src/lib/orgs/*.org   # sample .org content processed at build/dev time
    svelte.config.js         # shows real-world orgPreprocess() usage/options
```

### How the preprocessor works (read this before touching `src/`)

1. `orgPreprocess(options)` in `index.ts` returns a Svelte
   `PreprocessorGroup` with a `markup` hook.
2. On construction, it creates one `Emacs` instance
   (`emacs.ts`) bound to a temp/init directory, and optionally runs
   `org-id-update-id-locations` once over `idLocations` globs.
3. On each matching file, it builds Emacs Lisp via the tiny S-expression
   builder (`a`, `k`, `list`, `cons`, `quote`, `stringify` in `emacs.ts`),
   requires `ox-svelte`, applies `customize()` from both `org-export.ts`
   and `org-svelte.ts` (which turn camelCase option keys into
   `org-export-*` / `org-svelte-*` `setq` forms via `toKebabCase`), then
   feeds the Org document to Emacs over stdin and captures the exported
   Svelte source from stdout.
4. `OrgPreprocessOptions` (in `index.ts`) is the union of preprocessor-own
   options + `EmacsCustomization` + `OrgExportCustomization` +
   `OrgSvelteCustomization`. When adding a new `ox`/`ox-svelte` variable,
   add it to the relevant `*Customization` type **and** its `switch` in
   `customize()` — both files follow the same pattern.

## Commands

Run from repo root (uses pnpm workspace `-r` filtering) or inside a
package directory.

```bash
pnpm install                 # install all workspace deps

# root-level (applies to every package)
pnpm test                    # pnpm -r test
pnpm format                  # pnpm -r format (prettier --write)

# packages/svelte-preprocess-org
pnpm build                   # tsdown -> dist/
pnpm build:watch
pnpm test                    # vitest run
pnpm test:watch
pnpm lint                    # eslint . --fix
pnpm lint:check              # eslint . (no fix)
pnpm format:check            # prettier --check .

# packages/preview
pnpm dev                     # vite dev (SvelteKit)
pnpm build
pnpm preview
pnpm check                   # svelte-kit sync && svelte-check
pnpm lint                    # prettier --check . && eslint .
```

Notes:

- The preview app depends on `svelte-preprocess-org` via
  `workspace:*`, but on the **built** `dist/` output (`main`/`types` in
  its `package.json` point at `dist/index.js` / `dist/index.d.ts`).
  After changing `packages/svelte-preprocess-org/src/*`, run
  `pnpm build` in that package before expecting `packages/preview` to
  pick up the change (pnpm does not symlink source, it symlinks the
  package directory, so a stale/missing `dist/` breaks the preview
  build/dev server).
- **Known broken state:** `packages/svelte-preprocess-org/src/emacs.test.ts`
  currently fails outright (`new Emacs()` is called with no arguments,
  but the `Emacs` constructor requires an `EmacsCustomization` object —
  fails before Emacs is even spawned, so this is not an
  environment/Emacs-availability issue). If you're asked to fix or
  extend tests here, this is pre-existing breakage, not something you
  introduced — call it out rather than silently working around it.

## Conventions

- TypeScript, ESM only (`"type": "module"` everywhere), strict mode.
- 2-space indent, LF line endings, UTF-8, trailing whitespace trimmed,
  final newline — enforced by root `.editorconfig` and Prettier.
- Formatting via Prettier, linting via ESLint (`typescript-eslint`,
  `+eslint-plugin-svelte` for the preview app). Run `pnpm lint` /
  `pnpm format` before committing rather than hand-formatting.
- Keep new source files colocated with tests as `<name>.test.ts` next to
  `<name>.ts`, matching the existing layout.
- Commit messages follow Conventional Commits, as seen in `git log`:
  `feat:`, `fix:`, `chore:`, `chore(scope):`, `docs:`, `ci:`.
- License is `GPL-3.0-or-later` for the published package — keep that in
  mind for any new file headers or dependency choices.

## CI / publishing

`.github/workflows/publish.yml` publishes
`packages/svelte-preprocess-org` to npm on GitHub Release creation (or
manual dispatch): it runs `pnpm install && pnpm build && pnpm publish
--no-git-checks` inside that package directory, using npm trusted
publishing (OIDC, `id-token: write`). There is no separate CI workflow
that runs lint/tests on PRs — treat `pnpm lint:check`, `pnpm
format:check`, and `pnpm test` as the local gate before pushing.
