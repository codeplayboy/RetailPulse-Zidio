# RetailPulse Product Design System

## Product Direction
RetailPulse is an enterprise retail-intelligence platform for executives, analysts, data teams, and operations managers. It uses the supplied reference templates as its quality bar: dense cybersecurity and fintech dashboards, neon glass product systems, polished AI SaaS surfaces, and a silver professional light workspace.

## Application Architecture
- Persistent desktop sidebar with complete module navigation and live status.
- Responsive drawer navigation on tablet and mobile.
- Sticky command bar with search, page context, notifications, and user identity.
- Page-specific cinematic hero with operational metrics and direct actions.
- Dense dashboard grids containing KPIs, charts, feeds, tables, reports, and controls.
- Command-search modal, notification drawer, loading skeletons, and polished transitions.

## Visual System
- Dark theme: near-black obsidian, graphite glass, crimson, scarlet, burgundy, and clean white typography based on the supplied red AgentAI reference.
- Light theme: metallic silver, white glass, black typography, and warm gold accents.
- Surfaces: layered glass with thin borders, controlled glow, soft inner highlights, and realistic depth.
- Cards: 18-32px radii based on hierarchy, with no nested decorative card stacks.
- Charts: axes, legends, comparison lines, target lines, filled areas, dual-series bars, and clear values.
- KPI cards use consistent trend badges instead of miniature sparklines: green rising arrows for positive movement, red falling arrows for negative movement, and neutral status indicators for non-directional metadata.

## Typography
- Primary: Inter/system UI for professional SaaS clarity.
- Hero: large, compact, responsive display type only within page hero surfaces.
- Interface: dense labels, strong numeric hierarchy, readable table text, and normal letter spacing.

## Interaction
- GSAP controls page entrances and chart line drawing.
- Framer Motion controls modal, drawer, and card micro-interactions.
- Animations use transforms and opacity, respect reduced-motion, and avoid layout shifting.
- Search, alerts, theme controls, sidebar navigation, and module switching are functional.

## Responsive Rules
- Desktop: persistent sidebar and multi-column analytical grids.
- Tablet: drawer sidebar and single-column dashboard modules where required.
- Mobile: compact command bar, stacked hero metrics, single-column KPIs, tables, and settings.
- No horizontal overflow at supported widths.

## Quality Rules
- No generic admin template layout.
- No placeholder sections or missing modules.
- No topbar theme switch; a single sun/moon toggle in Settings switches between dark and light themes.
- No emoji icons; Lucide icons only.
- Production build and real-browser desktop/mobile QA are mandatory.
