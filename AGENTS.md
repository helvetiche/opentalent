# opentalent — AGENTS.md

Vite 8 + React 19 + TypeScript + React Compiler (via `@vitejs/plugin-react` + `babel-plugin-react-compiler`). Lint: `oxlint`.

Commands:
- `npm run dev` — dev server
- `npm run build` — `tsc -b && vite build`
- `npm run lint` — `oxlint`

Skills are on-demand. Do NOT preload skill files. Load only the one the task needs via the `skill` tool, then follow it.

## Design skills router

<!-- antislop:start -->
## antislop
For UI, copy, people, mobile layout, or code comments work, load the antislop skill for the task:
- Core filter, always on: `antislop`
- UI / visual: `antislop-ui`
- Copy & text: `antislop-copywriting`
- People: `antislop-human`
- Mobile / responsive: `antislop-layoutmobile`
- Code comments: `antislop-code`
Before starting, ask the user when antislop applies: during the work, or after it is done.
To update antislop later: `npx antislop-ai --update`, or run `npx antislop-ai` and pick Overwrite them.
<!-- antislop:end -->

Skill files live in `.agents/skills/` (mirrored to `.claude/skills/`):
- `.agents/skills/antislop/SKILL.md` (v3.2.19 core, 38 rules R-01–R-38 + Delivery Gate)
- `.agents/skills/antislop-ui/SKILL.md`, `antislop-copywriting`, `antislop-human`, `antislop-layoutmobile`, `antislop-code`

### taste-skill
For landing pages, portfolios, or redesigns that must not look templated, load `design-taste-frontend`:
- File: `.agents/skills/design-taste-frontend/SKILL.md`
- Flow: read brief → infer direction → set dials `VARIANCE / MOTION / DENSITY` (baseline `8 / 6 / 4`) → pick official design system if brief matches one (Fluent, Material, Carbon, Polaris, Atlassian, Primer, GOV.UK, USWDS, Bootstrap, Radix, shadcn, Tailwind) else native CSS + Tailwind → strict pre-flight check before shipping.
- Audit-first on redesigns. Never mix two design systems in one tree.

Pick ONE direction per task: `antislop` is the filter (stops slop), `design-taste-frontend` is the direction (adds taste). Load both only for new marketing UI.

## Token-saving rules (ponytail, lazy senior dev)

Ponytail plugin (`@dietrichgebert/ponytail` in `opencode.json`) injects the full ruleset every turn. Levels: `/ponytail lite|full|ultra|off` (default `full`). Commands: `/ponytail-review` (diff), `/ponytail-audit` (repo), `/ponytail-debt` (ledger), `/ponytail-gain` (scoreboard).

Local summary — climb before coding:
1. Need it at all? (YAGNI — if no, stop)
2. Already in this codebase? Reuse, don't rewrite.
3. Stdlib / React / browser native covers it? Use it.
4. Installed dep covers it? Use it.
5. One line? Make it one line.
6. Else: minimum code that works. Fewest files, shortest diff wins.

Never cut: validation at trust boundaries, error handling against data loss, security, a11y, explicitly requested features. Non-trivial logic leaves ONE runnable check (assert/self-check or one small test); trivial one-liners need none. Mark deferred shortcuts with `// ponytail: <ceiling> -> <upgrade path>`.

Output: code first, then max 3 short lines (what was skipped, when to add it). No essays, no unrequested prose.
