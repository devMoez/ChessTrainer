# Preview Board System Documentation

## Overview

Unified preview chessboard system for openings and puzzles with instant rendering and zero flicker.

## Architecture

### Core Components

1. **PreviewBoard.jsx** - Unified preview board component
   - Input: FEN string (required)
   - Output: Static chessboard display
   - Features: Zero flicker, instant rendering, no animations

2. **openingCache.js** - Global opening cache store
   - Singleton pattern
   - Preloads all opening FENs on app mount
   - O(1) FEN lookups

3. **puzzleCache.js** - Global puzzle cache store
   - Singleton pattern
   - Preloads all puzzle FENs on app mount
   - O(1) FEN lookups

4. **useCacheInitializer.js** - Global cache initialization hook
   - Runs once on app mount
   - Preloads both opening and puzzle caches
   - Ensures instant preview rendering

### Data Flow

```
App Mount
  ↓
AppProvider (useCacheInitializer)
  ↓
Preload openingCache + puzzleCache
  ↓
Cards render with cached FEN
  ↓
PreviewBoard displays instantly (no flicker)
```

## Performance Optimizations

### 1. Global Caching
- All FENs preloaded into memory on app initialization
- Map-based O(1) lookups
- Zero re-fetching or recomputation
- Memory footprint: ~40KB for all data

### 2. React Optimizations
- `React.memo` with custom comparison
- `useMemo` for all derived values
- Stable board IDs prevent re-mounting
- CSS containment for layout isolation

### 3. Board Rendering
- Zero animations (`animationDuration: 0`)
- Disabled dragging (`arePiecesDraggable: false`)
- Disabled arrows (`areArrowsAllowed: false`)
- Memoized piece renderers
- ResizeObserver for efficient sizing

### 4. Virtualization Safety
- FEN persisted in global cache (outside components)
- Stable keys prevent re-mounting on scroll
- Board state never lost during filtering/sorting

## Usage

### Opening Cards

```jsx
import OpeningCard from './components/OpeningCard.jsx';

// Opening data structure
const opening = {
  id: 'ruy-lopez-main',
  name: 'Ruy Lopez: Main Line',
  fen: 'r1bq1rk1/1pp2pbp/3ppn2/1p2p3/4P3/1BP2N1P/PPP3PP/RNBQR1K1 b - - 0 9',
  moves: '1. e4 e5 2. Nf3 Nc6 3. Bb5 a6...',
  color: 'White',
  difficulty: 'Advanced',
  winRate: 50,
  popularity: 80
};

<OpeningCard opening={opening} onClick={handleClick} />
```

### Puzzle Cards

```jsx
import PuzzleCard from './components/PuzzleCard.jsx';

// Puzzle data structure
const puzzle = {
  id: 'm1-001',
  fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4',
  category: 'Mate in 1',
  difficulty: 'Easy',
  moves: ['Qxf7#'],
  tags: ['mate', 'scholar']
};

<PuzzleCard puzzle={puzzle} />
```

### Direct PreviewBoard Usage

```jsx
import PreviewBoard from './components/PreviewBoard.jsx';

<PreviewBoard
  fen="rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR"
  orientation="white"
  lightColor="#F0D9B5"
  darkColor="#B58863"
/>
```

## Requirements Met

✅ **Unified Board System**
- Single `PreviewBoard` component for both openings and puzzles

✅ **Data Structure**
- Openings and puzzles have FEN strings in data
- All FENs validated before rendering

✅ **No Empty Board / No Flicker**
- Boards never render until FEN is ready
- Skeleton fallback for invalid FEN
- Boards appear instantly filled

✅ **Instant Rendering**
- All FEN data preloaded and cached globally
- Cards render boards instantly on mount

✅ **Global Cache**
- Both stores use singleton pattern
- Never refetch or recompute FEN

✅ **Performance Optimization**
- `React.memo` for PreviewBoard
- `useMemo` for board config
- Zero re-renders unless FEN changes

✅ **Static Preview Mode**
- Dragging disabled
- Animations disabled
- Sound effects not applicable (static boards)

✅ **Stable Rendering**
- Stable keys (`key={item.id}`)
- No inline objects causing re-renders

✅ **Virtualization Safe**
- FEN persisted in global cache
- Board state never lost on scroll

✅ **UI Consistency**
- Fixed board size (280px-320px via CSS)
- Same styling across all cards
- No layout shift on load

## Cache Statistics

Access cache statistics in development console:

```javascript
import openingCacheStore from './stores/openingCache.js';
import puzzleCacheStore from './stores/puzzleCache.js';

console.log(openingCacheStore.getStats());
// {
//   totalOpenings: 50,
//   cacheHits: 150,
//   cacheMisses: 0,
//   hitRate: "100.00%",
//   initialized: true,
//   preloading: false
// }

console.log(puzzleCacheStore.getStats());
// Similar output for puzzles
```

## Testing

### Manual Testing
1. Open `/openings` page
2. Verify all opening cards show correct positions instantly
3. Scroll through list - boards should remain stable
4. Filter/sort - boards should not flicker

5. Open `/puzzles` page
6. Verify all puzzle cards show correct positions instantly
7. Scroll through list - boards should remain stable
8. Filter by difficulty - boards should not flicker

### Performance Testing
1. Open DevTools Performance tab
2. Record while navigating to `/openings`
3. Verify zero layout shifts
4. Verify zero board re-renders on scroll

## File Structure

```
src/
├── components/
│   ├── PreviewBoard.jsx       # Unified preview board
│   ├── OpeningCard.jsx         # Updated to use PreviewBoard
│   ├── PuzzleCard.jsx          # Updated to use PreviewBoard
│   └── MiniBoard.jsx           # Legacy (can be deprecated)
├── stores/
│   ├── openingCache.js         # Opening cache store
│   └── puzzleCache.js          # Puzzle cache store
├── hooks/
│   └── useCacheInitializer.js  # Cache initialization hook
├── context/
│   └── AppProvider.jsx         # Updated with cache initializer
└── data/
    ├── openings.js             # Opening data with FENs
    └── puzzles.js              # Puzzle data with FENs
```

## Migration Notes

### From MiniBoard to PreviewBoard
The new `PreviewBoard` component is a drop-in replacement for `MiniBoard`:

```jsx
// Before
<MiniBoard fen={fen} lightColor={light} darkColor={dark} />

// After
<PreviewBoard fen={fen} lightColor={light} darkColor={dark} />
```

Both components have identical APIs and can be used interchangeably.

## Future Optimizations (Optional)

### Image-Based Previews
For even faster rendering, generate static PNG images:

```javascript
// Generate preview images at build time
import { generateBoardImage } from './utils/boardImageGenerator.js';

const previewImage = generateBoardImage(fen);
// Show image instantly, load real board on interaction
```

### Lazy Loading
For very large datasets (1000+ items), implement pagination:

```jsx
import { useVirtualizer } from '@tanstack/react-virtual';

// Virtual scrolling for 1000+ cards
const rowVirtualizer = useVirtualizer({
  count: openings.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 400,
});
```

## Troubleshooting

### Issue: Boards flicker on scroll
**Solution:** Ensure stable keys and FEN is cached globally

### Issue: Empty boards on initial load
**Solution:** Check that `useCacheInitializer` is called in AppProvider

### Issue: Slow rendering with many cards
**Solution:** Verify React.memo is applied to card components

### Issue: Layout shifts during load
**Solution:** Set fixed board dimensions in parent container

## Support

For questions or issues, check:
1. Browser console for cache initialization logs
2. Cache statistics via `getStats()` methods
3. React DevTools for component re-renders
