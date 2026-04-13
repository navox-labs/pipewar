# PIPEWAR -- UX Component Specification
## Version 1.0 | 2026-04-12 | UX Agent

---

## 1. Design Tokens

### Colors (Ocean Palette -- STRICT)
```
pw-bg:            #00214d    (page background)
pw-grid-bg:       #001433    (grid/canvas background)
pw-panel-bg:      #001a3d    (sidebar panels)
pw-panel-border:  #0a3d7a    (panel borders)
pw-machine:       #38bdf8    (active production machines)
pw-machine-text:  #7dd3fc    (machine labels)
pw-circuit:       #34d399    (circuits produced, success)
pw-iron-ore:      #854d0e    (iron ore deposits)
pw-copper-ore:    #b45309    (copper ore deposits)
pw-ore-bg:        #0f0a02    (ore cell background)
pw-belt:          #1e4080    (belt routing lines)
pw-attacker:      #f43f5e    (hacker attackers)
pw-trail:         #7f1d1d    (hacker trails, 50% opacity)
pw-defense:       #1d4ed8    (defense borders)
pw-defense-text:  #60a5fa    (defense labels)
pw-active:        #34d399    (active indicator dot)
pw-offline:       #2a1a1a    (offline indicator dot)
pw-warning:       #f59e0b    (warnings, bottleneck)
pw-critical:      #f43f5e    (critical alerts)
pw-uptime:        #e0e0e0    (uptime number)
pw-uptime-accent: #34d399    (uptime accent)
pw-text:          #e0e0e0    (primary text)
pw-text-dim:      #6b7280    (secondary text)
pw-text-muted:    #374151    (disabled text)
pw-event-attack:  #f43f5e
pw-event-warning: #f87171
pw-event-success: #34d399
pw-event-info:    #0a3d7a
```

### Typography
```
Font family:   JetBrains Mono (monospace fallback: ui-monospace, monospace)
Base size:     14px
HUD uptime:    48px, bold
HUD secondary: 16px, medium
Panel headers: 12px, uppercase, letter-spacing 0.1em
Panel values:  14px, regular
Event log:     12px, regular
Build panel:   14px, regular
Canvas glyphs: 16px (rendered via Canvas 2D context)
```

### Grid Symbols
```
M  = Miner
S  = Smelter
A  = Assembler
─  = Belt horizontal
│  = Belt vertical
◆  = Circuit (green) / Hacker (red, flickering)
░  = Ore deposit
█  = Defense
T  = Rate Limiter
W  = WAF
@  = Auth Middleware
·  = Empty cell / Hacker trail (fading)
```

### Spacing
```
Grid cell size:     32x32px
Grid total:         640x640px
Panel padding:      16px
Panel gap:          12px
Component gap:      8px
Border radius:      0px (none -- flat design)
```

---

## 2. Landing Page

### Layout
- Full viewport, centered content
- Background: pw-bg (#00214d)
- Max-width container: 600px

### Content (top to bottom)
1. **Title**: "PIPEWAR" in 64px JetBrains Mono bold, color pw-machine (#38bdf8)
2. **Tagline**: "Build. Produce. Defend." in 18px, color pw-text-dim
3. **Description**: Brief 2-line description in 14px, color pw-text-dim
   "Build production pipelines on a 20x20 grid. Defend against hacker waves. Produce 20 Advanced Circuits to win."
4. **New Game button**:
   - Width: 240px, height: 48px
   - Background: pw-defense (#1d4ed8)
   - Text: "NEW GAME" in 16px bold, color white
   - Hover: background pw-machine (#38bdf8)
   - No border-radius, 1px solid pw-panel-border
5. **Resume Game link** (conditional, only if has_active_game):
   - Below New Game button, 8px gap
   - Text: "RESUME GAME" in 14px, color pw-defense-text (#60a5fa)
   - Underline on hover

### States
- Loading: button text changes to "CONNECTING..."
- Error: button text changes to "FAILED -- RETRY", color pw-critical

---

## 3. Main Game Screen

### Layout (1920x1080 reference)
```
+---------------------------------------------------+
|                     HUD (56px)                     |
+----------+------------------------+----------------+
|          |                        |                |
|  Build   |     Game Canvas        |   Metrics      |
|  Panel   |     (640x640)          |   Panel        |
|  (220px) |     centered           |   (240px)      |
|          |                        |                |
|          |                        |  Wave Status   |
|          |                        |                |
|          |                        |  Defenses      |
|          |                        |                |
+----------+------------------------+  Event Log     |
                                    |                |
                                    +----------------+
```

- Minimum viewport: 1100x740
- Background: pw-bg
- All panels: pw-panel-bg background, 1px pw-panel-border border

### 3.1 HUD (Top Bar)

**Height**: 56px, full width
**Background**: pw-panel-bg
**Border**: 1px bottom pw-panel-border
**Layout**: flex row, space-between, align-center, padding 0 24px

**Left section** -- PRODUCTION STATUS:
- "PRODUCTION" label, 12px uppercase pw-text-dim
- Iron/min value, 14px pw-machine-text
- Circuit/min value, 14px pw-circuit

**Center section** -- UPTIME:
- Percentage number, 48px bold
- Color thresholds:
  - >= 99.9%: pw-uptime-accent (#34d399)
  - >= 97%: pw-uptime (#e0e0e0)
  - >= 95%: pw-warning (#f59e0b)
  - < 95%: pw-critical (#f43f5e)
- "UPTIME" label below, 12px uppercase pw-text-dim
- Below that: "X / 20 CIRCUITS" in 14px pw-circuit

**Right section** -- WAVE STATUS:
- "WAVE X/Y" label, 14px pw-text
- Attack types listed, 12px pw-text-dim
- ETA countdown, 16px pw-warning (when wave incoming)
- "CLEAR" in pw-circuit when no active wave

**Far right** -- PAUSE:
- Text button: "PAUSE" / "RESUME", 14px pw-defense-text
- Keyboard shortcut: Space bar

### 3.2 Build Panel (Left Sidebar)

**Width**: 220px
**Background**: pw-panel-bg
**Border**: 1px right pw-panel-border
**Padding**: 16px

**Header**: "BUILD" in 12px uppercase pw-text-dim, bottom border pw-panel-border

**Building Grid** (2 columns, 4 rows):

Production buildings:
| Key | Glyph | Name | Color |
|-----|-------|------|-------|
| 1   | M     | Miner | pw-machine |
| 2   | S     | Smelter | pw-machine |
| 3   | A     | Assembler | pw-machine |
| 4   | ─     | Belt | pw-belt |

Defense buildings:
| Key | Glyph | Name | Color |
|-----|-------|------|-------|
| 5   | T     | Rate Limiter | pw-defense |
| 6   | W     | WAF | pw-defense |
| 7   | @     | Auth Middleware | pw-defense |
| 8   | ◆     | Circuit Breaker | pw-defense |

**Each building card**:
- Height: 48px
- Background: transparent
- Selected: 1px pw-machine border (production) or pw-defense border (defense)
- Hover: background #0a1f3d
- Layout: glyph (24px, left) + name (14px, right)
- Keyboard: press 1-8 to select

**Bottom section** -- PRODUCTION CHAIN:
- Static legend showing the production chain flow
- "Iron Ore > Smelter > Iron Plate" etc.
- 11px pw-text-dim

**Interactions**:
- Click card to select building type
- Click grid cell to place
- Right-click grid cell to remove
- Press R to rotate selected building
- Press Esc to deselect
- Selected building shows a highlight border

### 3.3 Metrics Panel (Right Sidebar)

**Width**: 240px
**Background**: pw-panel-bg
**Border**: 1px left pw-panel-border
**Padding**: 16px

**Section 1 -- THROUGHPUT** (top):
- Header: "THROUGHPUT" 12px uppercase pw-text-dim
- List of all placed production machines
- Each row: machine type + position + items/min + rate bar
- Rate bar: 4px height, pw-machine fill, pw-panel-border background
- Bottleneck row: always first, text pw-warning, bar pw-warning
- 14px for values, 12px for labels

**Section 2 -- WAVE STATUS**:
- Header: "WAVES" 12px uppercase pw-text-dim
- Current wave number: 16px pw-text
- Total waves survived: 14px pw-text-dim
- Attack types incoming: list with colored dots (pw-attacker)
- Attacker count: "12 attackers" 14px pw-text
- ETA: countdown in seconds, 16px pw-warning

**Section 3 -- DEFENSES**:
- Header: "DEFENSES" 12px uppercase pw-text-dim
- Each placed defense with:
  - Active dot (8px circle): pw-active (#34d399) or pw-offline (#2a1a1a)
  - Defense name, 14px
  - Position on grid, 12px pw-text-dim

**Section 4 -- EVENT LOG** (bottom):
- Header: "LOG" 12px uppercase pw-text-dim
- Last 5 events, most recent on top
- Each event: timestamp (HH:MM:SS) + message
- 12px monospace
- Color-coded:
  - Attack events: pw-event-attack (#f43f5e)
  - Warnings: pw-event-warning (#f87171)
  - Success/blocks: pw-event-success (#34d399)
  - Info: pw-event-info (#0a3d7a)

### 3.4 Game Canvas

**Size**: 640x640px (20x20 grid, 32px cells)
**Rendering**: HTML Canvas 2D context
**Background**: pw-grid-bg (#001433)

**Grid Lines**: 1px #0a1f3d (subtle, darker than background)

**Cell Rendering by Type**:

Empty cell:
- Fill: pw-grid-bg
- Center dot: · in #1a2940

Resource (ore):
- Fill: pw-ore-bg (#0f0a02)
- Glyph: ░
- Iron: pw-iron-ore (#854d0e)
- Copper: pw-copper-ore (#b45309)

Production machine:
- Fill: #001a3d
- Border: 1px pw-machine (#38bdf8)
- Glyph: M/S/A in pw-machine-text (#7dd3fc)
- Processing indicator: small spinning bar (4px) when active

Belt:
- Fill: pw-grid-bg
- Line: ─ or │ in pw-belt (#1e4080)
- Items on belt: small colored dots moving along the line
  - Iron ore: pw-iron-ore
  - Copper ore: pw-copper-ore
  - Iron plate: #94a3b8
  - Copper plate: pw-copper-ore
  - Copper wire: #d97706
  - Green circuit: pw-circuit (#34d399)

Defense:
- Fill: #001a3d
- Border: 2px pw-defense (#1d4ed8)
- Glyph: T/W/@/◆ in pw-defense-text (#60a5fa)
- Coverage zone: 3x3 area with very subtle tint (#1d4ed8 at 8% opacity)

Attacker:
- Glyph: ◆ in pw-attacker (#f43f5e)
- Flicker: toggle visibility every ~8 render frames (0.4s at 20fps equivalent)
- Trail: · in pw-trail (#7f1d1d) at 50% opacity, 3 trailing positions

**Hover Preview**:
- When building is selected and mouse is over grid:
  - Valid placement: building glyph at 50% opacity, pw-machine tint
  - Invalid placement: building glyph at 30% opacity, pw-critical tint
  - Defense coverage preview: 3x3 zone highlighted

**Exposed Machine Indicator**:
- Production machines not in any defense coverage zone during a wave:
  - Red outline pulse: 2px pw-critical border, toggle every 20 frames

**Damage Indicator**:
- Machine health < 100%:
  - Health bar below cell (2px height)
  - Green > 50%, yellow > 25%, red <= 25%
- Machine health == 0: cell darkened to 30% opacity, glyph color pw-critical

### 3.5 Canvas Render Loop

```
Use requestAnimationFrame (60fps target)
Separate from WebSocket update rate (10/sec)

Each frame:
1. Clear canvas
2. Draw grid lines
3. Draw resource tiles
4. Draw belts with item positions (interpolated between ticks)
5. Draw production machines with processing indicators
6. Draw defenses with coverage zones (if selected)
7. Draw attackers with flicker and trails
8. Draw hover preview (if building selected)
9. Draw exposed machine indicators (if wave active)
10. Draw health bars for damaged machines
```

### 3.6 Wave Alert Banner

**Trigger**: On `wave_start` WebSocket message
**Position**: Full width, below HUD, above canvas
**Height**: 40px
**Background**: pw-critical (#f43f5e) at 90% opacity
**Text**: "WAVE X INCOMING -- [attack types]" in 16px bold, white
**Duration**: 3 seconds, then fade to 0 opacity over 0.5s
**No animation on appear** -- instant.

---

## 4. Game Over Modal

**Trigger**: On `game_over` WebSocket message
**Overlay**: Full viewport, #000000 at 70% opacity
**Modal**:
- Width: 480px
- Background: pw-panel-bg
- Border: 2px solid (pw-circuit for win, pw-critical for lose)
- Padding: 32px
- Centered on screen
- No animation on appear -- instant

### Win State
- Title: "SYSTEM SECURED" in 32px bold pw-circuit
- Subtitle: "20 Advanced Circuits produced" in 16px pw-text

### Lose State
- Title: "SYSTEM COMPROMISED" in 32px bold pw-critical
- Subtitle: "Uptime dropped below 95%" in 16px pw-text

### Stats (both states)
```
Uptime:          99.92%
Circuits:        20 / 20
Waves Survived:  7
Attackers Blocked: 142
```
- Layout: flex space-between per row
- Label: 14px pw-text-dim (left)
- Value: 14px pw-text (right)

### Actions
- "PLAY AGAIN" button: same style as New Game button
- "QUIT" text link: 14px pw-text-dim, below button

---

## 5. Animation Rules

**Only these animations exist**:
1. Attacker flicker: toggle draw every ~8 canvas frames (step, not smooth)
2. Belt item movement: smooth interpolation between ticks
3. Wave alert fade: 3s visible then 0.5s opacity transition to 0
4. Exposed machine outline: toggle every 20 canvas frames
5. Processing indicator: 4px line rotating (canvas drawn, not CSS)

**No CSS transitions on any UI element.**
**No hover transitions.** State changes are instant.
**No gradients anywhere.**
**No shadows anywhere.**
**No border-radius anywhere.**

---

## 6. Keyboard Shortcuts

| Key     | Action                    |
|---------|---------------------------|
| 1-4     | Select production building |
| 5-8     | Select defense building    |
| R       | Rotate selected building   |
| Esc     | Deselect building          |
| Space   | Pause / Resume             |
| Delete  | Remove building at cursor  |

---

## 7. Responsive Behavior

- Minimum viewport: 1100x740 for game screen
- Below minimum: show message "PIPEWAR requires a larger viewport. Minimum 1100x740."
- Landing page: no minimum, works on mobile
- Panels do not collapse or stack
- Canvas does not resize -- always 640x640

---

## 8. State Management

Use Zustand store with these slices:

```typescript
interface GameStore {
  // Connection
  connected: boolean
  gameId: string | null

  // Grid state (from server)
  grid: GridState

  // Metrics (from server)
  machines: MachineMetric[]
  bottleneck: string | null
  totalTraffic: number

  // Game state
  uptimePct: number
  advancedCircuits: number
  currentWave: number
  gameStatus: 'active' | 'won' | 'lost'
  paused: boolean

  // Attackers
  attackers: Attacker[]

  // Wave
  waveActive: boolean
  waveAttackTypes: string[]
  waveAttackerCount: number

  // Events
  events: GameEvent[]  // last 5

  // UI state (client only)
  selectedBuilding: BuildingType | null
  selectedDirection: Direction
  hoveredCell: { x: number, y: number } | null
}
```

---

## 9. Tailwind Config Extension

```typescript
// tailwind.config.ts
{
  theme: {
    extend: {
      colors: {
        'pw-bg': '#00214d',
        'pw-grid-bg': '#001433',
        'pw-panel-bg': '#001a3d',
        'pw-panel-border': '#0a3d7a',
        'pw-machine': '#38bdf8',
        'pw-machine-text': '#7dd3fc',
        'pw-circuit': '#34d399',
        'pw-iron-ore': '#854d0e',
        'pw-copper-ore': '#b45309',
        'pw-ore-bg': '#0f0a02',
        'pw-belt': '#1e4080',
        'pw-attacker': '#f43f5e',
        'pw-trail': '#7f1d1d',
        'pw-defense': '#1d4ed8',
        'pw-defense-text': '#60a5fa',
        'pw-active': '#34d399',
        'pw-offline': '#2a1a1a',
        'pw-warning': '#f59e0b',
        'pw-critical': '#f43f5e',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
    },
  },
}
```

---

## 10. Handoff Notes for Fullstack Agent

1. Canvas rendering is separate from React lifecycle. Use a ref and raw Canvas 2D API.
2. Interpolate belt item positions between WebSocket ticks for smooth animation.
3. Attacker flicker is in the render loop, not CSS. Toggle draw every ~8 frames.
4. All colors are exact hex values from the tokens above. Do not approximate.
5. JetBrains Mono must be loaded as a web font (Google Fonts or self-hosted).
6. The landing page must work without JavaScript for initial render (SSR).
7. Game page is a client component -- canvas requires browser APIs.
8. Selected building state is client-only. Server confirms placements.
9. Event log is FIFO, max 5 entries. New events push old ones out.
10. No tooltips. No popovers. Information is always visible in panels.
