import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * useMoveValidation
 *
 * Handles move validation logic and corner feedback state for the opening trainer.
 *
 * @param {React.MutableRefObject<Chess>} chessRef   - Live chess.js instance
 * @param {string[]}                       moves      - SAN move array for current line
 * @param {number}                         moveIndex  - Index of the next expected move
 *
 * @returns {{
 *   feedback:       { type: 'success'|'error', id: number } | null,
 *   isSourceLegal:  (sourceSquare: string) => boolean,
 *   onSuccess:      () => void,
 *   onError:        () => void,
 * }}
 */
export function useMoveValidation(chessRef, moves, moveIndex) {
  // Each feedback gets a unique id so MoveIndicator can remount (resets CSS animation)
  // even when consecutive attempts produce the same type (e.g., two wrong moves).
  const feedbackIdRef = useRef(0);
  const timerRef      = useRef(null);
  const [feedback, setFeedback] = useState(null);

  // Clear the auto-dismiss timer on unmount to prevent state updates on dead components.
  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  // ── Internal: show feedback and auto-dismiss after 400 ms ──────────────

  const showFeedback = useCallback((type) => {
    // Cancel any in-flight dismiss so rapid attempts don't race.
    if (timerRef.current) clearTimeout(timerRef.current);

    feedbackIdRef.current += 1;
    setFeedback({ type, id: feedbackIdRef.current });

    timerRef.current = setTimeout(() => setFeedback(null), 400);
  }, []);

  // ── Public: trigger success / error ───────────────────────────────────

  const onSuccess = useCallback(() => showFeedback('success'), [showFeedback]);
  const onError   = useCallback(() => showFeedback('error'),   [showFeedback]);

  // ── isSourceLegal ─────────────────────────────────────────────────────
  //
  // Returns true only if `sourceSquare` is the square that the NEXT expected
  // SAN move originates from.  Used by isDraggablePiece to freeze all other pieces.
  //
  // Strategy: ask chess.js for all legal moves in verbose form, find the one
  // whose SAN matches the expected move, then compare its `.from` field.
  // This naturally handles castling, captures, promotions, and ambiguous moves.

  const isSourceLegal = useCallback((sourceSquare) => {
    const expectedRaw = moves[moveIndex];
    if (!expectedRaw) return false;

    // Normalise notation: strip check/mate markers, convert 0-0 → O-O
    const normalize   = s => s.replace(/[+#]/g, '').replace(/0/g, 'O').trim();
    const expectedSan = normalize(expectedRaw);

    const verboseMoves = chessRef.current.moves({ verbose: true });
    const match = verboseMoves.find(m => normalize(m.san) === expectedSan);

    return match ? match.from === sourceSquare : false;
  }, [chessRef, moves, moveIndex]);
  // Note: chessRef is a stable ref object — intentionally omitted from deps.

  return { feedback, isSourceLegal, onSuccess, onError };
}
