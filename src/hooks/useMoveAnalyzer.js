import { useCallback, useState } from 'react';
import { fetchOpenRouter } from '../utils/openRouterKeys.js';

const SYSTEM_PROMPT = `You are a chess move analyzer integrated into a chess board UI.

You will receive the current board state as a FEN string and the move
just played (in algebraic notation like "e4", "Nf3", "O-O", "Rxe5").

YOUR JOB: Analyze the move and return a JSON response ONLY. No prose. No markdown.
No explanation outside the JSON. Just the raw JSON object.

MOVE CLASSIFICATION — classify into exactly one of:
  brilliant   → truly stunning, non-obvious sacrifice or idea
  great       → excellent move, not the only good one but very strong
  best        → the engine's top choice
  good        → solid, reasonable, no real downside
  book        → known opening theory move
  inaccuracy  → slightly suboptimal, better move existed
  mistake     → clearly wrong, loses material or positional advantage
  blunder     → losing move, drops significant material or the game

ICONS (return as icon field):
  brilliant → "!!"   great → "!"   best → "★"   good → "□"
  book → "≡"   inaccuracy → "?!"   mistake → "?"   blunder → "??"

COLORS (return as color field):
  brilliant → "#1bada6"   great → "#5c8fff"   best → "#98bc49"   good → "#98bc49"
  book → "#a88865"   inaccuracy → "#f0c15d"   mistake → "#e87b2e"   blunder → "#ca3431"

EXPLANATION: Write 1–2 lines max. Be direct. Chess player tone.
Mention concrete consequences. Keep under 30 words.
For inaccuracy/mistake/blunder — provide bestMove and bestMoveExplanation.
For good/great/best/brilliant/book — set bestMove and bestMoveExplanation to null.

RESPONSE FORMAT — return exactly this JSON shape, nothing else:
{
  "move": "Nf3",
  "classification": "best",
  "icon": "★",
  "color": "#98bc49",
  "explanation": "Develops the knight to its most natural square, controls e5 and d4.",
  "bestMove": null,
  "bestMoveExplanation": null
}

STRICT RULES:
- Return ONLY the JSON object. Nothing before or after it.
- Never return markdown code blocks. Raw JSON only.
- classification must be one of the 8 categories exactly as spelled above.
- icon must be exactly as listed above, no variations.`;

const MODEL = 'google/gemini-2.0-flash-001';

export default function useMoveAnalyzer() {
  const [analyses, setAnalyses] = useState({});
  const [latestAnalysis, setLatestAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzeMove = useCallback(async (index, san, fenBeforeMove) => {
    setIsAnalyzing(true);
    try {
      const response = await fetchOpenRouter({
        model: MODEL,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `FEN: ${fenBeforeMove}\nMove: ${san}` },
        ],
      });

      if (!response.ok) return;
      const data = await response.json();
      const raw = data.choices[0].message.content.trim();
      // Strip markdown fences if the model wraps the JSON anyway
      const jsonStr = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
      const analysis = JSON.parse(jsonStr);

      setAnalyses(prev => ({ ...prev, [index]: analysis }));
      setLatestAnalysis({ index, ...analysis });
    } catch {
      // Silently fail — move analysis is non-critical
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const resetAnalyses = useCallback(() => {
    setAnalyses({});
    setLatestAnalysis(null);
  }, []);

  return { analyses, latestAnalysis, isAnalyzing, analyzeMove, resetAnalyses };
}
