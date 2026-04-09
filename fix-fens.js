import { Chess } from 'chess.js';
import fs from 'fs';

const openingsPath = './src/data/openings.js';
let content = fs.readFileSync(openingsPath, 'utf-8');

function generateFenFromMoves(movesString) {
  const chess = new Chess();
  
  // Parse the moves string (e.g., "1. e4 e5 2. Nf3 Nc6")
  const moves = movesString
    .replace(/\d+\./g, '') // Remove move numbers
    .trim()
    .split(/\s+/) // Split by whitespace
    .filter(m => m.length > 0);
  
  try {
    for (const move of moves) {
      const result = chess.move(move, { sloppy: true });
      if (!result) {
        console.error(`  ❌ Invalid move "${move}" in sequence: ${movesString}`);
        return null;
      }
    }
    return chess.fen();
  } catch (error) {
    console.error(`  ❌ Error processing moves: ${movesString}`, error.message);
    return null;
  }
}

let fixedCount = 0;
let errorCount = 0;
let processedCount = 0;

// Find all opening/variation entries with moves and fen
const entryPattern = /moves:\s*'([^']+)',\s*fen:\s*'([^']+)'/g;

content = content.replace(entryPattern, (match, moves, currentFen) => {
  processedCount++;
  const correctFen = generateFenFromMoves(moves);
  
  if (!correctFen) {
    console.error(`❌ Failed to generate FEN for moves: ${moves.substring(0, 50)}...`);
    errorCount++;
    return match; // Keep original
  }
  
  if (correctFen !== currentFen) {
    console.log(`\n✓ Fixed FEN:`);
    console.log(`  Moves: ${moves.substring(0, 60)}...`);
    console.log(`  Old FEN: ${currentFen}`);
    console.log(`  New FEN: ${correctFen}`);
    fixedCount++;
    return `moves: '${moves}', fen: '${correctFen}'`;
  }
  
  return match; // Already correct
});

// Write the fixed content back
fs.writeFileSync(openingsPath, content, 'utf-8');

console.log(`\n${'='.repeat(60)}`);
console.log(`📊 Processed ${processedCount} entries`);
console.log(`✅ Fixed ${fixedCount} FEN positions`);
console.log(`❌ Errors: ${errorCount}`);
console.log(`📝 Updated ${openingsPath}`);
