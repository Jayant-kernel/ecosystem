# Third-Party Notices

These agent skills are vendored into this repository under `.agents/skills/`.
Each is included under its original licence. The licence text is preserved in
the upstream repository; this file records attribution.

## impeccable

- **Source:** https://github.com/pbakaus/impeccable
- **Author:** Paul Bakaus
- **Licence:** Apache License 2.0
- **Installed at:** `.agents/skills/impeccable`
- **What it provides:** Design guidance for AI coding agents. One skill with 24
  commands (polish, audit, critique, animate, typeset, layout, harden, clarify,
  and others) plus 61 deterministic anti-pattern detector rules.
- **Runtime note:** the skill ships a launcher in `scripts/`. On first use it
  downloads a self-contained engine binary into `~/.impeccable/bin/`. On Windows
  without `sh`, invoke `scripts/impeccable.cmd`. No Node runtime is required by
  the skill itself; Node is only used by the `npx impeccable` installer.

## emilkowalski/skills

- **Source:** https://github.com/emilkowalski/skills
- **Author:** Emil Kowalski
- **Licence:** MIT
- **Installed at:** `.agents/skills/` (13 skills)
- **Skills:** `emil-design-eng`, `animate`, `animate-expo`, `animation-vocabulary`,
  `apple-design`, `ask-sonner`, `find-animation-opportunities`,
  `improve-animations`, `mobile-native`, `pick-ui-library`, `prototype`,
  `review-animations`, `write-swift`
- **What it provides:** UI polish and motion-design expertise from time spent at
  Vercel and Linear — easing, duration, property choice, gesture handoff, and the
  invisible details that make an interface feel considered rather than generated.

## interface-design

- **Source:** https://github.com/Dammyjay93/interface-design
- **Author:** Dammyjay93
- **Licence:** MIT
- **Installed at:** `.agents/skills/interface-design`
- **What it provides:** Craft-first interface design for dashboards, admin panels,
  SaaS apps and data interfaces, plus design-system memory persisted to
  `.interface-design/system.md` so decisions stay consistent across sessions.

## Notes

- MIT and Apache-2.0 both permit commercial use, modification and redistribution,
  provided the original licence and copyright notice are retained. Keep this file
  with the vendored skills.
- `write-swift`, `animate-expo` and `ask-sonner` were installed as part of the
  `emilkowalski/skills` bundle and are not used by this project. They are harmless
  but may be removed if you prefer a minimal set.
- These skills are third-party content. Review them before relying on them, since
  an agent skill runs with the same permissions as the agent itself.
