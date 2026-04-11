# CLAUDE.md — Chess Trainer Project Reference

> **Read this file before every session. Do not re-explore the codebase.**

---

## Project Overview

**Name:** chesstrainer-new-antigravity  
**Type:** Client-side React chess training web application  
**Entry point:** `src/main.jsx` → `src/App.jsx`  
**Dev server:** `npm run dev` → http://localhost:5173  
**Build:** `npm run build` → `dist/`  
**No backend.** All data is static or localStorage. AI features require `VITE_OPENROUTER_API_KEY`.

---

## Tech Stack & Dependencies

### Runtime
| Package | Version | Purpose |
|---|---|---|
| react | 19.2.0 | UI library |
| react-dom | 19.2.0 | Rendering |
| react-router-dom | 7.13.1 | Client-side routing |
| chess.js | 1.4.0 | Move validation, FEN parsing, PGN loading |
| react-chessboard | 5.10.0 | Interactive board with drag/drop |
| stockfish | 17.1.0 | UCI chess engine (WASM) |
| framer-motion | 12.38.0 | Animations |
| @radix-ui/react-dialog | 1.1.15 | Accessible modal dialogs |
| @radix-ui/react-tooltip | 1.2.8 | Accessible tooltips |
| lucide-react | 1.7.0 | SVG icon set |
| react-icons | 5.6.0 | Additional icons (HiXxx) |

### Dev
| Package | Purpose |
|---|---|
| vite 6.0.0 | Build tool & HMR |
| @vitejs/plugin-react 5.1.1 | JSX + Fast Refresh |
| tailwindcss 4.2.2 | Utility CSS |
| postcss + autoprefixer | CSS processing |
| eslint 9.39.1 | Linting |
| @playwright/test 1.58.2 | E2E testing |

---

## Full Project Structure

```
chesstrainer-new/
├── index.html                      # Entry HTML; detects theme from localStorage; loads Inter + Roboto Mono fonts
├── package.json                    # Dependencies and npm scripts
├── vite.config.js                  # Vite config (@vitejs/plugin-react, default settings)
├── eslint.config.js                # ESLint rules; ignores dist/ and public/stockfish/
├── playwright.config.js            # E2E test config
├── .env.example                    # Template: VITE_OPENROUTER_API_KEY=...
├── CLAUDE.md                       # This file
│
├── src/
│   ├── main.jsx                    # React root; wraps app in <BrowserRouter>
│   ├── App.jsx                     # ErrorBoundary + AppProvider + Sidebar + Header + lazy Routes
│   ├── App.css                     # Minimal app-shell layout CSS
│   ├── index.css                   # Global design system (4852 lines); CSS vars; dark-first theme
│   │
│   ├── pages/
│   │   ├── HomePage.jsx            # Hero section + popular openings cards (241 lines)
│   │   ├── PlayPage.jsx            # Game mode selection UI (167 lines)
│   │   ├── PlayComputerPage.jsx    # Thin wrapper → PlayWorkspace vs Stockfish
│   │   ├── PlayHumanPage.jsx       # Thin wrapper → PlayWorkspace vs Human
│   │   ├── OpeningsPage.jsx        # Opening library; search, filter by color/difficulty (532 lines)
│   │   ├── OpeningTrainerPage.jsx  # Opening practice with line selection + rep tracking (479 lines)
│   │   ├── OpeningTrainerPage.css  # Styles for trainer page
│   │   ├── AnalysisPage.jsx        # Real-time Stockfish analysis board (1485 lines)
│   │   ├── GameAnalysisPage.jsx    # PGN import & game study (1048 lines)
│   │   ├── GameAnalysisPage.css    # Styles for game study page
│   │   ├── PuzzlesPage.jsx         # Puzzle library grid with filters (305 lines)
│   │   ├── PuzzlePage.jsx          # Puzzle solver interface (282 lines)
│   │   ├── ReviewPage.jsx          # Post-game review with move categorization (405 lines)
│   │   ├── AICoachPage.jsx         # OpenRouter AI coaching chat (726 lines)
│   │   ├── AICoachPage.css         # Styles for AI coach page
│   │   ├── SettingsPage.jsx        # Piece style, board theme, display toggles (221 lines)
│   │   └── ProfilePage.jsx         # User profile placeholder (118 lines)
│   │
│   ├── components/
│   │   ├── Sidebar.jsx             # Left nav with 6 main routes + Settings
│   │   ├── Header.jsx              # Top bar; search field (shows 6 opening results); theme toggle
│   │   ├── Logo.jsx                # Brand logo SVG component
│   │   ├── PlayWorkspace.jsx       # Full game board workspace (handles both vs-computer and vs-human)
│   │   ├── ChessBoard.jsx          # Core interactive chessboard (wraps react-chessboard)
│   │   ├── PreviewBoard.jsx        # Static memo-optimized board for opening/puzzle cards
│   │   ├── MiniBoard.jsx           # Alternative small board renderer
│   │   ├── EvalBar.jsx             # Visual engine evaluation bar (white/black score)
│   │   ├── MoveList.jsx            # PGN move display with click-to-navigate
│   │   ├── LineNavigator.jsx       # Prev/Next controls for opening lines
│   │   ├── LineSelector.jsx        # Dropdown to pick an opening variation
│   │   ├── VariationControlBar.jsx # Variation management toolbar
│   │   ├── MoveIndicator.jsx       # Highlights the current move with feedback
│   │   ├── RepetitionCounter.jsx   # Displays training rep count per line
│   │   ├── OpeningCard.jsx         # Card with PreviewBoard + opening metadata
│   │   ├── PuzzleCard.jsx          # Card with PreviewBoard + puzzle metadata
│   │   ├── PuzzleCardSkeleton.jsx  # Animated loading placeholder for puzzle cards
│   │   ├── AnalysisSettingsModal.jsx  # Modal for depth/engine settings
│   │   ├── PracticeSetupModal.jsx  # Modal to configure training session
│   │   ├── GameResultModal.jsx     # Win/loss/draw result overlay
│   │   ├── VariationSelectorModal.jsx # Modal to pick opening line variation
│   │   ├── ExtraPiecesTray.jsx     # Tray of extra pieces for analysis board
│   │   ├── CursorLockedElement.jsx # Drag interaction wrapper utility
│   │   ├── ChessPieces.jsx         # Custom SVG piece renderers
│   │   ├── PremiumResultIcons.jsx  # Trophy/medal icons for game results
│   │   ├── ZeroFlashCardGrid.jsx   # Card grid with instant render (no flicker)
│   │   └── lines.css               # Styles for line selector/navigator components
│   │
│   ├── context/
│   │   ├── AppContext.jsx          # Context definition; 5 settings + 5 board themes
│   │   └── AppProvider.jsx         # Context provider with localStorage persistence
│   │
│   ├── hooks/
│   │   ├── useCacheInitializer.js  # Preloads all opening + puzzle FENs on app mount
│   │   ├── useOpeningLines.js      # Line selection state + repetition/mastery tracking
│   │   ├── usePuzzleCache.js       # Reads from puzzleCache store
│   │   ├── useChessDragClass.js    # Tracks drag state for CSS class toggling
│   │   ├── useChessSounds.js       # Web Audio API: move, capture, check, game-end sounds
│   │   ├── useMoveValidation.js    # Validates moves via chess.js
│   │   └── useAIMemory.js          # Manages AI coaching conversation context/history
│   │
│   ├── stores/
│   │   ├── openingCache.js         # Singleton store; Map<id, opening> with FENs pre-computed
│   │   └── puzzleCache.js          # Singleton store; Map<id, puzzle> with FENs pre-computed
│   │
│   ├── chess/
│   │   ├── analysisHelpers.js      # 100+ pure functions: move classification, PGN helpers, eval formatting
│   │   ├── ReviewEngine.js         # Categorizes moves as best/excellent/good/inaccuracy/mistake/blunder
│   │   └── pieceRenderers.jsx      # Cached SVG piece renderers; global cache to avoid re-render
│   │
│   ├── utils/
│   │   ├── chessUtils.js           # Turn toggle, ELO clamping, humanization weights
│   │   ├── openingFenCache.js      # One-time synchronous FEN computation for all openings (chess.js)
│   │   ├── moveNotation.js         # SAN ↔ coordinate move format conversion
│   │   └── puzzleGenerator.js      # Puzzle generation utilities
│   │
│   ├── data/
│   │   ├── openings.js             # 50+ openings with variations, ECO codes, FENs (450 lines)
│   │   └── puzzles.js              # 100+ puzzles by category/difficulty (789 lines)
│   │
│   └── assets/
│       └── react.svg               # Default Vite asset (unused in production)
│
└── [Misc / scratch files in root]
    ├── diary/                      # Dev notes directory
    ├── sessions/                   # Session logs directory
    ├── test-cache.js               # Manual cache test script
    ├── test-full-flow.js           # Manual flow test script
    ├── test-italian.js             # Manual Italian opening test
    └── OPENING_PREVIEW_FIX.md     # Historical fix notes (safe to ignore)
```

> **Note:** `src/pages/HomePage.jsx.tmp.1512.1775748843875` is a leftover temp file from an editor crash. It is safe to delete but do not read or modify it.

---

## Routes

| Route | Component | Description |
|---|---|---|
| `/` | HomePage | Hero + featured openings |
| `/play` | PlayPage | Mode selection |
| `/play/computer` | PlayComputerPage | vs Stockfish |
| `/play/human` | PlayHumanPage | vs Human (local) |
| `/openings` | OpeningsPage | Opening library |
| `/trainer` | OpeningTrainerPage | Opening practice |
| `/puzzles` | PuzzlesPage | Puzzle grid |
| `/puzzle` | PuzzlePage | Puzzle solver (receives state via router) |
| `/analysis` | AnalysisPage | Stockfish analysis board |
| `/study` | GameAnalysisPage | PGN import & study |
| `/review` | ReviewPage | Post-game move review |
| `/settings` | SettingsPage | Appearance customization |
| `/profile` | ProfilePage | User profile |
| `*` | NotFound (inline) | 404 page |

---

## Finished Features

### Game Modes
- Play vs Stockfish (adjustable Elo 600–3200)
- Play vs Human (local, same device)
- Opening Trainer (50+ openings, multiple variations each)
- Puzzle Solver (100+ puzzles by difficulty/category)
- Analysis Board (real-time Stockfish eval, adjustable depth)
- Game Review (move categorization: best / excellent / good / inaccuracy / mistake / blunder)
- PGN Study (import and step through saved games)

### Analysis Tools
- Real-time engine evaluation bar
- Best move suggestions
- Move history with click-to-navigate
- Position editor (extra pieces tray)

### AI Coaching
- OpenRouter integration (default: Google Gemini 2.0 Flash)
- Persistent conversation history per session (`useAIMemory`)
- Position-aware coaching (sends current FEN + move context)

### Board Features
- Multiple piece styles (classic, 2D, 3D)
- 5 board themes: Classic, Green, Blue, Purple, Night
- Legal move dot indicators
- Threat highlight (optional)
- En passant auto-handling
- Synthesized sounds via Web Audio API

### Training System
- Rep counting per opening line
- Mastery score (0–100) per line
- Last-trained timestamp
- All stats persisted to localStorage

### UI/UX
- Dark/light theme toggle (localStorage)
- Zero-flash card rendering (boards appear instantly, no flicker)
- Responsive layout (sidebar + main area)
- Search in Header (opening name/ECO, max 6 results)
- Filter/sort on OpeningsPage and PuzzlesPage
- Code-split lazy page loading
- Error boundary with stack trace + reload button
- Accessible modals (Radix UI)

---

## Known Issues / TODO

- No explicit TODO/FIXME comments in source code as of last audit.
- `src/pages/HomePage.jsx.tmp.1512.1775748843875` — stale temp file, can be deleted.
- `diary/`, `sessions/`, `test-*.js` files in root — dev scratch files, not part of app.
- **AICoachPage** requires `VITE_OPENROUTER_API_KEY` in `.env`; silently fails if missing.
- ProfilePage is a placeholder — no user account system exists.
- Online multiplayer is not implemented (only local human vs human).
- No ELO rating system for the user.
- Stockfish loads from `public/stockfish/` (excluded from ESLint); if missing, analysis silently breaks.

---

## Key Coding Patterns

### State Management
- **AppContext** — global settings (theme, piece style, board theme). Use `useContext(AppContext)`.
- **Singleton stores** — `openingCache` and `puzzleCache` are module-level singletons. Never instantiate them; import the default export.
- **localStorage** — theme, line selection, training stats. Managed in AppProvider and `useOpeningLines`.
- **useState + useCallback** — local component state; always useCallback for handlers passed to children.

### Performance Rules
- `React.memo` is used on `PreviewBoard`, modals. Do not remove without measuring.
- `useMemo` wraps filtered opening/puzzle lists. Do not remove.
- All opening and puzzle FENs are pre-computed synchronously in `openingFenCache.js` and loaded into stores on mount via `useCacheInitializer`. Never re-compute FENs at render time.
- Pages are code-split with `lazy()` in App.jsx. All new pages must be added with `lazy()`.

### Component Conventions
- **PascalCase** for all components and files.
- **camelCase** for functions, variables, hook names.
- **UPPER_SNAKE_CASE** for top-level constants (e.g., `START_FEN`, `BOARD_THEMES`).
- Event handlers use `handle` prefix: `handleMove`, `handlePieceDrop`.
- Boolean state/flags use `is`/`has` prefix: `isLoading`, `hasError`.

### Styling Rules
- `index.css` owns all CSS variables (`--bg-app`, `--accent-gold`, `--text-primary`, etc.). Do not hardcode colors inline.
- Dark theme is the default. Light theme overrides with `[data-theme="light"]` selector.
- Use CSS classes from `index.css` before adding new ones. Check for existing `.btn`, `.card`, `.modal-*` classes.
- Tailwind is available but used sparingly. Prefer the existing CSS class system for consistency.
- Inline styles are acceptable for purely dynamic values (e.g., computed widths, runtime colors).

### Chess Logic
- Always use `chess.js` (`Chess` class) for move validation. Never roll your own move legality.
- FEN strings are the canonical way to pass board positions between components.
- PGN is used for game history; `chess.js` handles parsing.
- `analysisHelpers.js` has 100+ utility functions — check there before writing new chess logic.

---

## Things to Never Touch

- `public/stockfish/` — Stockfish WASM binary. Do not modify or move.
- `src/index.css` CSS variables at the top — renaming breaks the entire design system.
- `src/stores/openingCache.js` and `src/stores/puzzleCache.js` singleton constructors — they initialize synchronously; making them async breaks the cache guarantee.
- `src/utils/openingFenCache.js` — pre-computes FENs once. Do not call it per-component.
- The `lazy()` imports in `App.jsx` — removing them kills code splitting.
- `eslint.config.js` `ignores` for `public/stockfish/` — required or ESLint errors on WASM files.

---

## Data Shapes

### Opening
```js
{
  id: string,
  name: string,
  eco: string,           // e.g. "C89"
  difficulty: "Beginner" | "Intermediate" | "Advanced",
  winRate: number,       // e.g. 54
  popularity: number,    // 0–100
  color: "White" | "Black",
  description: string,
  moves: string,         // PGN e.g. "1. e4 e5 2. Nf3"
  fen: string,           // Final position FEN
  tags: string[],
  variations?: [{
    id: string,
    name: string,
    moves: string,
    fen: string,
    description: string,
    isMain: boolean
  }]
}
```

### Puzzle
```js
{
  id: string,
  category: string,      // "Tactics", "Endgame", etc.
  difficulty: "Easy" | "Medium" | "Hard",
  fen: string,           // Starting position FEN
  moves: string[],       // Solution in SAN notation
  description: string,
  tags: string[],
  solution?: string      // Optional text description
}
```

### Line Stats (localStorage key: `lineStats`)
```js
{
  [lineId]: {
    repetitions: number,
    lastTrained: string,   // ISO 8601
    masteryScore: number   // 0–100
  }
}
```

---

## Environment Variables

```
VITE_OPENROUTER_API_KEY=   # Required for AICoachPage; optional otherwise
```

Copy `.env.example` to `.env` and fill in the key.

---

## Scripts

```bash
npm run dev          # Dev server on :5173 with HMR
npm run build        # Production build → dist/
npm run preview      # Serve dist/ locally
npm run lint         # ESLint check
npm run test         # Playwright E2E tests (headless)
npm run test:ui      # Playwright interactive UI
npm run test:headed  # Playwright with visible browser
```
