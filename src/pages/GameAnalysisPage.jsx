import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { Chess } from 'chess.js';
import { useApp } from '../context/AppContext.jsx';
import ChessBoard from '../components/ChessBoard.jsx';
import { DEFAULT_FEN } from '../chess/analysisHelpers.js';
import {
  HiUpload, HiX, HiRefresh, HiLightBulb, HiPaperAirplane,
  HiChevronLeft, HiChevronRight,
  HiChevronDoubleLeft, HiChevronDoubleRight,
  HiChevronDown,
} from 'react-icons/hi';
import './GameAnalysisPage.css';

// ============================================================
// CONSTANTS & API LAYER
// ============================================================

const MODEL = 'anthropic/claude-sonnet-4-6';
const MAX_TOKENS = 1000;

function getApiKey() {
  return localStorage.getItem('openRouterKey') || '';
}

async function callClaude(messages) {
  const key = getApiKey();
  if (!key) throw new Error('No API key set. Configure one on the AI Coach page.');

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model: MODEL, max_tokens: MAX_TOKENS, messages }),
  });

  if (response.status === 401) throw new Error('Invalid API key. Update it on the AI Coach page.');
  if (response.status === 402) throw new Error('API key has no credits. Update it on the AI Coach page.');
  if (!response.ok) throw new Error(`OpenRouter error: ${response.status}`);

  const data = await response.json();
  return data.choices[0].message.content;
}

// ============================================================
// PGN HELPERS
// ============================================================

function parsePgnText(pgnText) {
  if (!pgnText?.trim()) return [];

  // Split concatenated PGN into individual game blocks
  const blocks = pgnText
    .trim()
    .split(/(?=\[Event\s)/g)
    .map(b => b.trim())
    .filter(b => b.length > 0);

  const games = [];
  for (const block of blocks) {
    try {
      const chess = new Chess();
      chess.loadPgn(block);
      const header = chess.header();
      const allMoves = chess.history({ verbose: true });

      // Build FEN snapshot per half-move
      const fens = [DEFAULT_FEN];
      const tmp = new Chess();
      for (const mv of allMoves) {
        tmp.move(mv.san);
        fens.push(tmp.fen());
      }

      games.push({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        header,
        moves: allMoves,
        fens,
        pgn: block,
        analysis: null, // filled lazily by analyzeGameMoves
      });
    } catch {
      // Skip malformed PGN blocks
    }
  }
  return games;
}

function readFileAsText(file) {
  return new Promise((res, rej) => {
    const reader = new FileReader();
    reader.onload = e => res(e.target.result);
    reader.onerror = rej;
    reader.readAsText(file);
  });
}

function readFileAsBase64(file) {
  return new Promise((res, rej) => {
    const reader = new FileReader();
    reader.onload = e => res(e.target.result.split(',')[1]);
    reader.onerror = rej;
    reader.readAsDataURL(file);
  });
}

const ANNOTATION_CONFIG = {
  Brilliant:  { bg: '#1BACA6', color: '#fff', symbol: '!!' },
  Good:       { bg: '#96BC4B', color: '#fff', symbol: '!'  },
  Inaccuracy: { bg: '#F6C142', color: '#000', symbol: '?!' },
  Mistake:    { bg: '#E57F2A', color: '#fff', symbol: '?'  },
  Blunder:    { bg: '#CA3431', color: '#fff', symbol: '??' },
};

// ============================================================
// SHARED UI COMPONENTS
// ============================================================

function Section({ title, icon, defaultOpen = true, children, badge }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="ga-section">
      <button className="ga-section-header" onClick={() => setOpen(o => !o)}>
        <span className="ga-section-title">
          {icon && <span className="ga-section-icon">{icon}</span>}
          {title}
        </span>
        <div className="ga-section-right">
          {badge && <span className="ga-section-badge">{badge}</span>}
          <HiChevronDown className={`ga-chevron${open ? '' : ' ga-chevron-closed'}`} />
        </div>
      </button>
      {open && <div className="ga-section-body">{children}</div>}
    </div>
  );
}

function AnnotationIcon({ label, size = 'sm' }) {
  const cfg = ANNOTATION_CONFIG[label];
  if (!cfg) return null;
  return (
    <span
      className={`ga-annot-icon ga-annot-${size}`}
      style={{ background: cfg.bg, color: cfg.color }}
      title={label}
    >
      {cfg.symbol}
    </span>
  );
}

function TypingIndicator() {
  return (
    <div className="typing-indicator">
      <div className="typing-dot" />
      <div className="typing-dot" />
      <div className="typing-dot" />
    </div>
  );
}

// ============================================================
// MAIN PAGE COMPONENT
// ============================================================

export default function GameAnalysisPage() {
  useApp(); // ensures theme context is subscribed (ChessBoard reads it internally)

  // ── Feature 1: Image → Board ──────────────────────────────
  const [imageFen, setImageFen] = useState(null);
  const [imageConf, setImageConf] = useState('');
  const [imageNote, setImageNote] = useState('');
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState('');
  const imageInputRef = useRef(null);

  // ── Features 2 & 3: Games ────────────────────────────────
  const [games, setGames] = useState([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [currentMoveIdx, setCurrentMoveIdx] = useState(0);
  const [moveLoading, setMoveLoading] = useState(false);
  const [moveError, setMoveError] = useState('');
  const pgnFileRef = useRef(null);
  const [pgnText, setPgnText] = useState('');
  const [showPaste, setShowPaste] = useState(false);

  // ── Feature 3: Import ─────────────────────────────────────
  const [importUser, setImportUser] = useState('');
  const [importPlatform, setImportPlatform] = useState('lichess');
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState('');

  // ── Feature 4: Coach ──────────────────────────────────────
  const [coachText, setCoachText] = useState(null);
  const [coachLoading, setCoachLoading] = useState(false);
  const [coachError, setCoachError] = useState('');
  const [coachChat, setCoachChat] = useState([]);
  const [coachInput, setCoachInput] = useState('');
  const [coachChatLoading, setCoachChatLoading] = useState(false);
  const coachChatEnd = useRef(null);

  // Derived
  const selectedGame = games[selectedIdx] ?? null;
  const totalMoves = selectedGame?.moves.length ?? 0;
  const currentFen = selectedGame?.fens[currentMoveIdx] ?? DEFAULT_FEN;

  // ── Keyboard navigation ───────────────────────────────────
  useEffect(() => {
    const onKey = e => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (!selectedGame) return;
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setCurrentMoveIdx(i => Math.max(0, i - 1));
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setCurrentMoveIdx(i => Math.min(totalMoves, i + 1));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedGame, totalMoves]);

  // Auto-scroll coach chat
  useEffect(() => {
    coachChatEnd.current?.scrollIntoView({ behavior: 'smooth' });
  }, [coachChat]);

  // ── Feature 1: Image detection ───────────────────────────

  const handleImageUpload = useCallback(async file => {
    if (!file?.type.match('image.*')) {
      setImageError('Please upload an image file (PNG, JPG, WEBP).');
      return;
    }
    setImageLoading(true);
    setImageError('');
    setImageFen(null);

    try {
      const b64 = await readFileAsBase64(file);
      // Use the actual file MIME type so Claude receives correctly-typed image data
      const mimeType = file.type || 'image/png';
      const dataUrl = `data:${mimeType};base64,${b64}`;

      const prompt = `You are an expert chess position reader. Carefully analyze this chess board image.
Return ONLY a raw JSON object — no markdown code fences, no extra text before or after:
{"fen":"<full 6-field FEN>","confidence":"High","note":""}

Rules:
- "fen" must be a complete FEN with all 6 fields, e.g. "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
- "confidence": "High" if board is clear, "Medium" if some pieces are ambiguous, "Low" if the image is partial, rotated, or not a chess board
- "note": one sentence explaining any issues, or empty string "" if confidence is High
- If the board has Black at the bottom (rotated), report the FEN as-if White is at the bottom, and note it`;

      const reply = await callClaude([{
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: dataUrl } },
          { type: 'text', text: prompt },
        ],
      }]);

      // Greedy match to capture the full JSON object (handles multi-line notes)
      const match = reply.match(/\{[\s\S]*\}/);
      if (!match) throw new Error('AI did not return valid JSON. Try a clearer image.');

      let result;
      try {
        result = JSON.parse(match[0]);
      } catch {
        throw new Error('Could not parse AI response. Try a clearer image.');
      }

      if (!result.fen) throw new Error('No FEN found in response. The image may not show a chess board.');

      // Normalise: ensure FEN has all 6 fields (Claude sometimes returns only the board part)
      const fenParts = result.fen.trim().split(/\s+/);
      const fullFen = [
        fenParts[0] || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR',
        fenParts[1] || 'w',
        fenParts[2] || 'KQkq',
        fenParts[3] || '-',
        fenParts[4] || '0',
        fenParts[5] || '1',
      ].join(' ');

      // Validate with chess.js — if invalid, throw so we surface a clear error
      try {
        new Chess(fullFen);
      } catch {
        throw new Error(`Detected FEN is not valid chess: "${fullFen}". Try a clearer image.`);
      }

      setImageFen(fullFen);
      setImageConf(result.confidence || 'Unknown');
      setImageNote(result.note || '');
    } catch (err) {
      setImageError(`Detection failed: ${err.message}`);
    } finally {
      setImageLoading(false);
    }
  }, []);

  // ── Feature 2: PGN loading ───────────────────────────────

  const addGames = useCallback((newGames, label = '') => {
    if (newGames.length === 0) {
      setMoveError(`No valid PGN games found${label ? ` in ${label}` : ''}. Check the format.`);
      return false;
    }
    setMoveError('');
    setGames(prev => {
      const startIdx = prev.length;
      // defer index selection to after state update
      setTimeout(() => {
        setSelectedIdx(startIdx);
        setCurrentMoveIdx(0);
      }, 0);
      return [...prev, ...newGames];
    });
    return true;
  }, []);

  const handlePgnFiles = useCallback(async files => {
    const all = [];
    for (const file of Array.from(files).slice(0, 10)) {
      try {
        const text = await readFileAsText(file);
        all.push(...parsePgnText(text));
      } catch {
        // skip unreadable files
      }
    }
    addGames(all, 'uploaded files');
  }, [addGames]);

  const handlePgnPaste = useCallback(() => {
    const parsed = parsePgnText(pgnText);
    if (addGames(parsed, 'pasted text')) {
      setPgnText('');
      setShowPaste(false);
    }
  }, [pgnText, addGames]);

  const selectGame = useCallback(idx => {
    setSelectedIdx(idx);
    setCurrentMoveIdx(0);
    setMoveError('');
  }, []);

  // ── Feature 2: Move analysis ─────────────────────────────

  const analyzeGameMoves = useCallback(async gameIdx => {
    const game = games[gameIdx];
    if (!game || game.analysis) return;

    setMoveLoading(true);
    setMoveError('');

    try {
      const moveSans = game.moves.map(m => m.san).join(' ');
      const white = game.header.White || 'White';
      const black = game.header.Black || 'Black';

      const prompt = `Chess move quality analysis task.
Game: ${white} vs ${black}${game.header.Result ? ` (${game.header.Result})` : ''}
${game.header.Opening ? `Opening: ${game.header.Opening}` : ''}
Moves in order: ${moveSans}

Classify EVERY move. Return ONLY a valid JSON array, one object per move, in the same order:
[{"move":"e4","label":"Neutral","explanation":""},...]

Rules:
- Labels: "Brilliant" | "Good" | "Neutral" | "Inaccuracy" | "Mistake" | "Blunder"
- Neutral: explanation must be ""
- Brilliant: 2-3 sentences on why it is a strong tactical or strategic idea
- Good: 1 sentence
- Inaccuracy: 1 sentence on what was slightly better
- Mistake / Blunder: 2-3 sentences — name the best alternative and why
- Total response must fit in ${MAX_TOKENS} tokens. Prioritize non-Neutral moves.

Return ONLY the JSON array. No markdown fences.`;

      const reply = await callClaude([{ role: 'user', content: prompt }]);
      const arrMatch = reply.match(/\[[\s\S]*\]/);
      if (!arrMatch) throw new Error('Could not parse move classifications from AI.');
      const analysis = JSON.parse(arrMatch[0]);

      setGames(prev => {
        const updated = [...prev];
        updated[gameIdx] = { ...updated[gameIdx], analysis };
        return updated;
      });
    } catch (err) {
      setMoveError(`Move analysis failed: ${err.message}`);
    } finally {
      setMoveLoading(false);
    }
  }, [games]);

  // ── Feature 3: Platform import ───────────────────────────

  const importGames = useCallback(async () => {
    if (!importUser.trim()) return;
    setImportLoading(true);
    setImportError('');

    try {
      let newGames = [];

      if (importPlatform === 'lichess') {
        const res = await fetch(
          `https://lichess.org/api/games/user/${encodeURIComponent(importUser.trim())}?max=10`,
          { headers: { Accept: 'application/x-chess-pgn' } }
        );
        if (res.status === 404) throw new Error(`User "${importUser}" not found on Lichess.`);
        if (!res.ok) throw new Error(`Lichess returned ${res.status}. Check the username.`);
        const text = await res.text();
        newGames = parsePgnText(text);
      } else {
        // Chess.com: try current month then previous month
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const url = `https://api.chess.com/pub/player/${encodeURIComponent(importUser.trim())}/games/${year}/${month}`;
        const res = await fetch(url);
        if (res.status === 404) {
          // Try archives to find most recent month
          const archRes = await fetch(
            `https://api.chess.com/pub/player/${encodeURIComponent(importUser.trim())}/games/archives`
          );
          if (!archRes.ok) throw new Error(`User "${importUser}" not found on Chess.com.`);
          const archData = await archRes.json();
          const archives = archData.archives || [];
          if (archives.length === 0) throw new Error('No game archives found on Chess.com.');
          const latestArchive = archives[archives.length - 1];
          const archGameRes = await fetch(latestArchive);
          if (!archGameRes.ok) throw new Error(`Chess.com returned ${archGameRes.status}.`);
          const archGameData = await archGameRes.json();
          const gamePgns = (archGameData.games || []).slice(-10).map(g => g.pgn).filter(Boolean);
          for (const pgn of gamePgns) newGames.push(...parsePgnText(pgn));
        } else if (!res.ok) {
          throw new Error(`Chess.com returned ${res.status}. Check the username.`);
        } else {
          const data = await res.json();
          const gamePgns = (data.games || []).slice(-10).map(g => g.pgn).filter(Boolean);
          for (const pgn of gamePgns) newGames.push(...parsePgnText(pgn));
        }
      }

      if (newGames.length === 0) {
        setImportError('No recent games found for this user.');
        return;
      }

      addGames(newGames);
    } catch (err) {
      setImportError(err.message);
    } finally {
      setImportLoading(false);
    }
  }, [importUser, importPlatform, addGames]);

  // ── Feature 4: Coach analysis ────────────────────────────

  const analyzeAllGames = useCallback(async () => {
    if (games.length === 0) return;
    setCoachLoading(true);
    setCoachError('');

    try {
      const gamesContext = games.map((g, i) => {
        const moveLine = g.analysis
          ? g.moves.map((m, j) => {
              const a = g.analysis[j];
              return a && a.label !== 'Neutral' ? `${m.san}(${a.label})` : m.san;
            }).join(' ')
          : g.moves.map(m => m.san).join(' ');

        return `Game ${i + 1}: ${g.header.White || 'White'} vs ${g.header.Black || 'Black'} [${g.header.Result || '?'}]
Opening: ${g.header.Opening || g.header.ECO || 'Unknown'}
Moves: ${moveLine}`;
      }).join('\n\n');

      const systemPrompt = `You are a personal chess coach. Analyze the following game data and provide:
1. Top 3 weaknesses with specific patterns (e.g. hanging pieces in endgame, poor knight outposts)
2. Top 2 strengths observed
3. Concrete improvement plan: one drill or concept per weakness
4. Opening repertoire feedback if patterns detected
Keep tone encouraging but honest. Be specific, not generic.`;

      const reply = await callClaude([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: gamesContext },
      ]);

      setCoachText(reply);
      setCoachChat([{ role: 'assistant', content: reply }]);
    } catch (err) {
      setCoachError(`Analysis failed: ${err.message}`);
    } finally {
      setCoachLoading(false);
    }
  }, [games]);

  const sendCoachMessage = useCallback(async () => {
    if (!coachInput.trim() || coachChatLoading) return;
    const msg = coachInput.trim();
    setCoachInput('');
    setCoachChatLoading(true);

    const updated = [...coachChat, { role: 'user', content: msg }];
    setCoachChat(updated);

    try {
      const reply = await callClaude([
        { role: 'system', content: 'You are a personal chess coach. Answer follow-up questions specifically and encouragingly based on the game analysis you already provided.' },
        ...updated.slice(-8),
      ]);
      setCoachChat(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch (err) {
      setCoachChat(prev => [...prev, { role: 'assistant', content: `Error: ${err.message}` }]);
    } finally {
      setCoachChatLoading(false);
    }
  }, [coachInput, coachChatLoading, coachChat]);

  // ── Derived move pair display ─────────────────────────────

  const movePairs = useMemo(() => {
    if (!selectedGame) return [];
    const pairs = [];
    for (let i = 0; i < selectedGame.moves.length; i += 2) {
      pairs.push({
        number: Math.floor(i / 2) + 1,
        white: { moveIdx: i + 1, san: selectedGame.moves[i].san, analysisIdx: i },
        black: selectedGame.moves[i + 1]
          ? { moveIdx: i + 2, san: selectedGame.moves[i + 1].san, analysisIdx: i + 1 }
          : null,
      });
    }
    return pairs;
  }, [selectedGame]);

  const currentMoveAnalysis =
    selectedGame?.analysis && currentMoveIdx > 0
      ? selectedGame.analysis[currentMoveIdx - 1]
      : null;

  // ── Render ────────────────────────────────────────────────

  return (
    <>
      <div className="page-heading">
        <h1>Game Study</h1>
        <p>
          Detect positions from images, review PGN games with AI move analysis, import from
          Chess.com &amp; Lichess, and get personalized coaching.
        </p>
      </div>

      <div className="ga-container">

        {/* ── UPLOAD GAMES (PGN file, paste, image) ── */}
        <Section title="Upload Games" icon="📂" defaultOpen={false}>
          <div className="ga-upload-section">

            {/* Row of upload actions */}
            <div className="ga-row ga-row-gap">
              <button className="btn btn-primary" onClick={() => pgnFileRef.current?.click()}>
                <HiUpload /> Upload PGN File(s)
              </button>
              <input
                ref={pgnFileRef}
                type="file"
                accept=".pgn,text/plain"
                multiple
                style={{ display: 'none' }}
                onChange={e => handlePgnFiles(e.target.files)}
              />
              <button className="btn btn-outline" onClick={() => setShowPaste(p => !p)}>
                Paste PGN
              </button>
              <button
                className="btn btn-outline"
                onClick={() => imageInputRef.current?.click()}
                disabled={imageLoading}
              >
                <HiUpload /> Upload Image (PNG)
              </button>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                style={{ display: 'none' }}
                onChange={e => e.target.files[0] && handleImageUpload(e.target.files[0])}
              />
            </div>

            {/* Paste PGN area */}
            {showPaste && (
              <div className="ga-paste-area">
                <textarea
                  className="ga-textarea"
                  placeholder="Paste PGN here…"
                  value={pgnText}
                  onChange={e => setPgnText(e.target.value)}
                  rows={6}
                />
                <div className="ga-row ga-row-gap">
                  <button className="btn btn-primary btn-sm" onClick={handlePgnPaste}>
                    Load Game(s)
                  </button>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => { setShowPaste(false); setPgnText(''); }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Image upload feedback */}
            {(imageLoading || imageError) && (
              <div className="ga-row ga-row-gap" style={{ marginTop: 8 }}>
                {imageLoading && <span className="ga-hint">Claude is reading the board…</span>}
                {imageError && <span className="ga-error">{imageError}</span>}
              </div>
            )}

            {imageLoading && <div className="skeleton ga-board-skeleton" style={{ marginTop: 12 }} />}

            {imageFen && !imageLoading && (
              <div className="ga-image-result">
                <div className="ga-board-wrap">
                  <ChessBoard
                    fen={imageFen}
                    isLocked
                    orientation="white"
                    boardId="imageFenBoard"
                    animationDurationInMs={0}
                    className="ga-board-inner"
                  />
                </div>
                <div className="ga-image-info">
                  <div className={`ga-conf-badge conf-${imageConf.toLowerCase()}`}>
                    Detection confidence: <strong>{imageConf}</strong>
                  </div>
                  {imageNote && <div className="ga-note">{imageNote}</div>}
                  <div className="ga-fen-box">
                    <span className="ga-fen-label">FEN</span>
                    <code className="ga-fen-code">{imageFen}</code>
                  </div>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => { setImageFen(null); setImageNote(''); setImageConf(''); }}
                  >
                    <HiX /> Clear
                  </button>
                </div>
              </div>
            )}

            {moveError && <p className="ga-error" style={{ marginTop: 8 }}>{moveError}</p>}
          </div>
        </Section>

        {/* ── FEATURE 3: IMPORT GAMES ── */}
        <Section title="Import Games" icon="⬇️" defaultOpen={false}>
          <div className="ga-import-section">
            <div className="ga-row ga-row-gap ga-row-wrap">
              <input
                type="text"
                className="ga-input ga-username-input"
                placeholder="Username"
                value={importUser}
                onChange={e => setImportUser(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && importGames()}
              />
              <div className="ga-platform-toggle">
                <button
                  className={`ga-platform-btn${importPlatform === 'lichess' ? ' active' : ''}`}
                  onClick={() => setImportPlatform('lichess')}
                >
                  Lichess
                </button>
                <button
                  className={`ga-platform-btn${importPlatform === 'chesscom' ? ' active' : ''}`}
                  onClick={() => setImportPlatform('chesscom')}
                >
                  Chess.com
                </button>
              </div>
              <button
                className="btn btn-primary"
                onClick={importGames}
                disabled={importLoading || !importUser.trim()}
              >
                {importLoading ? 'Importing…' : 'Import Last 10 Games'}
              </button>
            </div>

            {importLoading && (
              <div className="ga-skeleton-list">
                <div className="skeleton ga-skeleton-row" />
                <div className="skeleton ga-skeleton-row" />
                <div className="skeleton ga-skeleton-row" />
              </div>
            )}
            {importError && <p className="ga-error">{importError}</p>}
          </div>
        </Section>

        {/* ── FEATURE 2: PGN GAME VIEWER ── */}
        <div className="ga-viewer-card">
          <div className="ga-pgn-section">

            {games.length > 0 && (
              <div className="ga-row ga-row-gap" style={{ marginBottom: 12 }}>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => {
                    setGames([]);
                    setSelectedIdx(0);
                    setCurrentMoveIdx(0);
                    setCoachText(null);
                    setCoachChat([]);
                    setCoachError('');
                  }}
                >
                  <HiRefresh /> Clear All
                </button>
              </div>
            )}

            {games.length === 0 ? (
              <div className="ga-empty">
                Upload PGN files, paste PGN, upload a board image, or import games above.
              </div>
            ) : (
              <div className="ga-viewer-layout">

                {/* Game list sidebar */}
                <div className="ga-game-list">
                  {games.map((g, idx) => (
                    <button
                      key={g.id}
                      className={`ga-game-item${idx === selectedIdx ? ' active' : ''}`}
                      onClick={() => selectGame(idx)}
                    >
                      <div className="ga-game-players">
                        <span className="ga-player">{g.header.White || 'White'}</span>
                        <span className="ga-result">{g.header.Result || '?'}</span>
                        <span className="ga-player">{g.header.Black || 'Black'}</span>
                      </div>
                      <div className="ga-game-meta">
                        {[g.header.Date, g.header.Opening || g.header.ECO]
                          .filter(Boolean)
                          .join(' · ')}
                      </div>
                    </button>
                  ))}
                </div>

                {/* Board + move list */}
                {selectedGame && (
                  <div className="ga-viewer-main">

                    {/* Game header */}
                    <div className="ga-game-header">
                      <div className="ga-game-title">
                        <strong>{selectedGame.header.White || 'White'}</strong>
                        <span className="ga-vs">vs</span>
                        <strong>{selectedGame.header.Black || 'Black'}</strong>
                        <span className="ga-result">{selectedGame.header.Result || '?'}</span>
                      </div>
                      {(selectedGame.header.Date || selectedGame.header.Opening) && (
                        <div className="ga-game-meta">
                          {[
                            selectedGame.header.Date,
                            selectedGame.header.Event,
                            selectedGame.header.Opening || selectedGame.header.ECO,
                          ]
                            .filter(Boolean)
                            .join(' · ')}
                        </div>
                      )}
                    </div>

                    <div className="ga-viewer-body">

                      {/* Board column */}
                      <div className="ga-board-col">
                        <div className="ga-board-wrap">
                          <ChessBoard
                            fen={currentFen}
                            isLocked
                            orientation={currentMoveIdx % 2 === 0 ? 'white' : 'black'}
                            boardId="pgnViewerBoard"
                            animationDurationInMs={100}
                            className="ga-board-inner"
                          />
                          {currentMoveAnalysis && currentMoveAnalysis.label !== 'Neutral' && (
                            <div className="ga-board-annotation">
                              <AnnotationIcon label={currentMoveAnalysis.label} size="lg" />
                            </div>
                          )}
                        </div>

                        {/* Navigation */}
                        <div className="ga-nav">
                          <button
                            className="ga-nav-btn"
                            onClick={() => setCurrentMoveIdx(0)}
                            disabled={currentMoveIdx === 0}
                            title="Start"
                          >
                            <HiChevronDoubleLeft size={18} />
                          </button>
                          <button
                            className="ga-nav-btn"
                            onClick={() => setCurrentMoveIdx(i => Math.max(0, i - 1))}
                            disabled={currentMoveIdx === 0}
                            title="Previous (←)"
                          >
                            <HiChevronLeft size={18} />
                          </button>
                          <span className="ga-move-counter">
                            {currentMoveIdx} / {totalMoves}
                          </span>
                          <button
                            className="ga-nav-btn"
                            onClick={() => setCurrentMoveIdx(i => Math.min(totalMoves, i + 1))}
                            disabled={currentMoveIdx === totalMoves}
                            title="Next (→)"
                          >
                            <HiChevronRight size={18} />
                          </button>
                          <button
                            className="ga-nav-btn"
                            onClick={() => setCurrentMoveIdx(totalMoves)}
                            disabled={currentMoveIdx === totalMoves}
                            title="End"
                          >
                            <HiChevronDoubleRight size={18} />
                          </button>
                        </div>

                        {/* Analyze button */}
                        {!selectedGame.analysis && !moveLoading && (
                          <button
                            className="btn btn-primary ga-analyze-btn"
                            onClick={() => analyzeGameMoves(selectedIdx)}
                          >
                            <HiLightBulb /> Analyze All Moves with AI
                          </button>
                        )}
                        {moveLoading && (
                          <div className="skeleton ga-analyze-skeleton" />
                        )}

                        {/* Current move analysis panel */}
                        {currentMoveIdx > 0 && selectedGame.analysis && (
                          <div className="ga-move-analysis-panel">
                            <div className="ga-move-analysis-header">
                              <span className="ga-move-san">
                                {Math.ceil(currentMoveIdx / 2)}.
                                {currentMoveIdx % 2 === 0 ? '..' : ''}
                                {' '}{selectedGame.moves[currentMoveIdx - 1]?.san}
                              </span>
                              {currentMoveAnalysis && (
                                <AnnotationIcon label={currentMoveAnalysis.label} size="md" />
                              )}
                              {currentMoveAnalysis && currentMoveAnalysis.label !== 'Neutral' && (
                                <span className="ga-annot-label" style={{ color: ANNOTATION_CONFIG[currentMoveAnalysis.label]?.bg }}>
                                  {currentMoveAnalysis.label}
                                </span>
                              )}
                            </div>
                            {currentMoveAnalysis?.explanation && (
                              <p className="ga-move-explanation">
                                {currentMoveAnalysis.explanation}
                              </p>
                            )}
                            {selectedGame.analysis && !currentMoveAnalysis && (
                              <p className="ga-hint">Neutral — no significant issues.</p>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Move list */}
                      <div className="ga-move-list">
                        <div className="ga-move-list-header">Moves</div>
                        <div className="ga-moves-scroll">
                          <div
                            className={`ga-move-item${currentMoveIdx === 0 ? ' active' : ''}`}
                            onClick={() => setCurrentMoveIdx(0)}
                          >
                            <span className="ga-move-num">—</span>
                            <span className="ga-move-san">Start</span>
                          </div>
                          {movePairs.map(pair => (
                            <div key={pair.number} className="ga-move-pair">
                              <span className="ga-move-num">{pair.number}.</span>

                              <MoveToken
                                moveIdx={pair.white.moveIdx}
                                san={pair.white.san}
                                analysis={selectedGame.analysis?.[pair.white.analysisIdx]}
                                isActive={currentMoveIdx === pair.white.moveIdx}
                                onClick={() => setCurrentMoveIdx(pair.white.moveIdx)}
                              />

                              {pair.black && (
                                <MoveToken
                                  moveIdx={pair.black.moveIdx}
                                  san={pair.black.san}
                                  analysis={selectedGame.analysis?.[pair.black.analysisIdx]}
                                  isActive={currentMoveIdx === pair.black.moveIdx}
                                  onClick={() => setCurrentMoveIdx(pair.black.moveIdx)}
                                />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── FEATURE 4: AI COACH ANALYSIS ── */}
        {games.length > 0 && (
          <Section title="AI Coach Analysis" icon="🎓" defaultOpen={false}>
            <div className="ga-coach-section">

              {!coachText && !coachLoading && (
                <div className="ga-coach-cta">
                  <p>
                    Get a personalized coaching report based on your{' '}
                    <strong>{games.length}</strong> loaded game{games.length !== 1 ? 's' : ''}.
                    {games.some(g => g.analysis) && ' Move analysis is included for richer feedback.'}
                  </p>
                  <button className="btn btn-primary" onClick={analyzeAllGames}>
                    <HiLightBulb /> Analyze My Games
                  </button>
                  {coachError && <p className="ga-error" style={{ marginTop: 12 }}>{coachError}</p>}
                </div>
              )}

              {coachLoading && (
                <div className="ga-coach-skeleton">
                  <div className="skeleton" style={{ height: 28, width: '55%' }} />
                  <div className="skeleton" style={{ height: 100 }} />
                  <div className="skeleton" style={{ height: 80 }} />
                  <div className="skeleton" style={{ height: 80 }} />
                </div>
              )}

              {coachText && !coachLoading && (
                <div className="ga-coach-result">

                  {/* Analysis panel */}
                  <div className="ga-coach-panel">
                    <div className="ga-coach-panel-header">
                      <span>Your Coaching Report</span>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => { setCoachText(null); setCoachChat([]); }}
                      >
                        <HiRefresh /> Re-analyze
                      </button>
                    </div>
                    <div className="ga-coach-text">
                      {coachText}
                    </div>
                  </div>

                  {/* Follow-up chat */}
                  <div className="ga-coach-chat">
                    <div className="ga-coach-chat-header">Ask a follow-up question</div>
                    <div className="ga-coach-chat-msgs">
                      {coachChat.slice(1).map((msg, i) => (
                        <div key={i} className={`ga-coach-msg ${msg.role}`}>
                          {msg.content}
                        </div>
                      ))}
                      {coachChatLoading && (
                        <div className="ga-coach-msg assistant">
                          <TypingIndicator />
                        </div>
                      )}
                      <div ref={coachChatEnd} />
                    </div>
                    <div className="ga-coach-chat-input">
                      <input
                        type="text"
                        placeholder="Ask your coach…"
                        value={coachInput}
                        onChange={e => setCoachInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendCoachMessage()}
                        disabled={coachChatLoading}
                      />
                      <button
                        onClick={sendCoachMessage}
                        disabled={!coachInput.trim() || coachChatLoading}
                      >
                        <HiPaperAirplane style={{ transform: 'rotate(-45deg)' }} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Section>
        )}

      </div>
    </>
  );
}

// ── Move token sub-component ─────────────────────────────────

function MoveToken({ san, analysis, isActive, onClick }) {
  const label = analysis?.label;
  const hasAnnotation = label && label !== 'Neutral' && ANNOTATION_CONFIG[label];
  const labelClass = hasAnnotation ? `ga-label-${label.toLowerCase()}` : '';

  return (
    <span
      className={`ga-move-token ${labelClass}${isActive ? ' active' : ''}`}
      onClick={onClick}
      title={analysis?.explanation || ''}
    >
      {san}
      {hasAnnotation && <AnnotationIcon label={label} size="sm" />}
    </span>
  );
}
