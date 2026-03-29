import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Chess } from 'chess.js';
import {
  HiKey,
  HiUpload,
  HiRefresh,
  HiChevronLeft,
  HiChevronRight,
  HiChevronDoubleLeft,
  HiChevronDoubleRight,
  HiPaperAirplane,
  HiX,
  HiLightBulb,
  HiThumbUp,
  HiThumbDown,
  HiPencil,
  HiSwitchHorizontal
} from 'react-icons/hi';
import { getPieceRenderers } from '../chess/pieceRenderers.jsx';
import { addMemory, rateMemory, buildSystemPrompt } from '../hooks/useAIMemory.js';
import { useApp } from '../context/AppContext.jsx';
import { DEFAULT_FEN } from '../chess/analysisHelpers.js';
import './AICoachPage.css';

const DEFAULT_KEY = import.meta.env.VITE_OPENROUTER_API_KEY
const MODEL = "google/gemini-2.0-flash-001";

export default function AICoachPage() {
  const { boardTheme, pieceStyle } = useApp();

  // ============================================
  // API KEY STATE & LOGIC
  // ============================================
  const [apiKey, setApiKey] = useState('');
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [keyInput, setKeyInput] = useState('');

  useEffect(() => {
    const savedKey = localStorage.getItem('openRouterKey');
    if (!savedKey) {
      localStorage.setItem('openRouterKey', DEFAULT_KEY);
      setApiKey(DEFAULT_KEY);
    } else {
      setApiKey(savedKey);
    }
  }, []);

  const handleSaveKey = () => {
    if (keyInput.trim()) {
      localStorage.setItem('openRouterKey', keyInput.trim());
      setApiKey(keyInput.trim());
      setIsKeyModalOpen(false);
      setKeyInput('');
    }
  };

  const callOpenRouter = async (messages) => {
    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ model: MODEL, messages })
      });

      if (response.status === 401) {
        localStorage.removeItem('openRouterKey');
        setApiKey('');
        setIsKeyModalOpen(true);
        throw new Error("Unauthorized: Invalid API Key. Please update your key.");
      }

      if (response.status === 402) {
        setIsKeyModalOpen(true);
        throw new Error("Payment Required: The current API key has no credits or has reached its limit. Please provide your own OpenRouter key.");
      }

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (err) {
      throw err;
    }
  };

  // ============================================
  // PERSISTENT CHAT LOGIC
  // ============================================
  const [chatHistory, setChatHistory] = useState([
    { role: 'assistant', content: 'Hello! I am your AI Chess Coach. Upload a game for review, or ask me any chess question!' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef(null);
  // Track memoryId for the last AI reply so user can rate it
  const lastMemoryIdRef = useRef(null);
  const [ratedMemories, setRatedMemories] = useState({});

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const handleSendMessage = async (msg) => {
    if (!msg.trim() || isChatLoading) return;

    const newChat = [...chatHistory, { role: 'user', content: msg.trim() }];
    setChatHistory(newChat);
    setIsChatLoading(true);

    try {
      // System 3: Dynamic, context-aware system prompt
      const systemPrompt = buildSystemPrompt(currentBoardFen, msg.trim());
      const messages = [
        { role: 'system', content: systemPrompt },
        ...newChat
      ];
      const reply = await callOpenRouter(messages);
      setChatHistory(prev => [...prev, { role: 'assistant', content: reply, _memId: null }]);

      // System 1+2: Store interaction in memory
      const memId = addMemory({ userMsg: msg.trim(), aiReply: reply, fen: currentBoardFen });
      lastMemoryIdRef.current = memId;
      // Tag the last message with its memory ID for rating
      setChatHistory(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = { ...updated[updated.length - 1], _memId: memId };
        return updated;
      });
    } catch (err) {
      setChatHistory(prev => [...prev, { role: 'assistant', content: `Sorry, there was an error: ${err.message}` }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleRateMessage = useCallback((memId, delta) => {
    if (!memId || ratedMemories[memId]) return; // one rating per message
    rateMemory(memId, delta);
    setRatedMemories(prev => ({ ...prev, [memId]: delta }));
  }, [ratedMemories]);

  // ============================================
  // STRENGTHS & WEAKNESSES LOGIC
  // ============================================
  const [weaknesses, setWeaknesses] = useState(() => {
    const saved = localStorage.getItem('aiCoachWeaknesses');
    return saved ? JSON.parse(saved) : [];
  });
  const [strengths, setStrengths] = useState(() => {
    const saved = localStorage.getItem('aiCoachStrengths');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('aiCoachWeaknesses', JSON.stringify(weaknesses));
    localStorage.setItem('aiCoachStrengths', JSON.stringify(strengths));
  }, [weaknesses, strengths]);

  // ============================================
  // LESSONS GENERATION LOGIC
  // ============================================
  const [lessons, setLessons] = useState([]);
  const [isGeneratingLessons, setIsGeneratingLessons] = useState(false);
  const [activeLessonIndex, setActiveLessonIndex] = useState(null);

  const generateLessons = async () => {
    if (weaknesses.length === 0) return;
    setIsGeneratingLessons(true);
    try {
      const prompt = `Based on these weaknesses: ${JSON.stringify(weaknesses)}, generate a personalized training plan with 3 short chess lessons. Return ONLY a valid JSON array of objects with this structure: { "title": "string", "description": "string", "tip": "string" }`;

      const reply = await callOpenRouter([{ role: 'user', content: prompt }]);

      let jsonString = reply.trim();
      if (jsonString.startsWith('```json')) jsonString = jsonString.slice(7, -3).trim();
      else if (jsonString.startsWith('```')) jsonString = jsonString.slice(3, -3).trim();

      const parsedLessons = JSON.parse(jsonString);
      setLessons(parsedLessons);
    } catch (err) {
      console.error("Failed to generate lessons:", err);
    } finally {
      setIsGeneratingLessons(false);
    }
  };

  // ============================================
  // MULTI-IMAGE & BOARD REVIEW LOGIC
  // ============================================
  const [analyzedPositions, setAnalyzedPositions] = useState([]); // Array of parsed position objects
  const [currentBoardFen, setCurrentBoardFen] = useState(DEFAULT_FEN);
  const [currentMoveIndex, setCurrentMoveIndex] = useState(-1);
  const [boardOrientation, setBoardOrientation] = useState('white');
  const [isEditingFen, setIsEditingFen] = useState(false);
  const [manualFen, setManualFen] = useState('');

  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef(null);

  // Derive arrows and squares from current analysis
  const currentAnalysis = analyzedPositions[currentMoveIndex];

  const updateBoardToIndex = useCallback((index) => {
    if (index < 0 || index >= analyzedPositions.length) {
      if (analyzedPositions.length === 0) {
        setCurrentBoardFen(DEFAULT_FEN);
        setCurrentMoveIndex(-1);
      }
      return;
    }

    const pos = analyzedPositions[index];
    setCurrentBoardFen(pos.fen);
    setBoardOrientation(pos.orientation || 'white');
    setCurrentMoveIndex(index);
    setIsEditingFen(false);
    setManualFen(pos.fen);
  }, [analyzedPositions]);



  const processImages = async (files) => {
    if (!files || files.length === 0) return;
    const validFiles = Array.from(files).filter(f => f.type.match('image.*'));
    if (validFiles.length === 0) {
      setUploadError('Please upload image file(s) (PNG/JPG/WEBP).');
      return;
    }

    setUploadError('');
    setIsAnalyzingImage(true);
    setCurrentMoveIndex(-1);
    setCurrentBoardFen(DEFAULT_FEN);
    setAnalyzedPositions([]);

    try {
      // 1. Convert all to base64
      const base64Images = await Promise.all(
        validFiles.map(file => new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = e => resolve(e.target.result.split(',')[1]);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        }))
      );

      const imageContents = base64Images.map(b64 => ({
        type: 'image_url', 
        image_url: { url: `data:image/png;base64,${b64}` }
      }));

      // 2. Build prompt for batch analysis
      const prompt = `You are an expert chess engine and coach. I am providing ${base64Images.length} image(s) representing sequential chess positions from a game.
Analyze ALL images in order. For EACH image, return:
1) "fen": The accurate FEN of the board position.
2) "orientation": "white" if white is at the bottom, "black" if black is at the bottom.
3) "confidence": "High", "Medium", or "Low" based on image clarity.
4) "bestMoveSan": The best move to play (e.g. "Nxd5") or null if game over.
5) "eval": The evaluation score (e.g. "+0.8" or "M3").
6) "threat": 1 short sentence describing the main threat or idea of the last move.
7) "idea": 1 short sentence describing the plan for the next move.
8) "lastMovePlayedSan": The move that resulted in this position (e.g. "e4", "O-O") if deducible, else null.
9) "blunderSquares": Array of squares (e.g. ["d5", "f7"]) where pieces are hanging or weakly defended. Empty array if none.

Return ONLY a valid JSON array of objects, one for each image in order. Example exactly like this:
[
  {
    "fen": "rnbqkbnr/pppppppp/...",
    "orientation": "white",
    "confidence": "High",
    "bestMoveSan": "e4",
    "eval": "+0.5",
    "threat": "Controls center",
    "idea": "Develop knights",
    "lastMovePlayedSan": null,
    "blunderSquares": []
  }
]
IMPORTANT: Return ONLY the raw JSON array. NO markdown blocks. NO unescaped quotes inside strings. NO trailing commas.`;

      const messages = [
        {
          role: 'user', 
          content: [
            { type: 'text', text: prompt },
            ...imageContents
          ]
        }
      ];

      const reply = await callOpenRouter(messages);

      let jsonString = reply.trim();
      
      // Attempt to extract the JSON array robustly using Regex to bypass stray brackets
      const arrayMatch = jsonString.match(/\[\s*\{[\s\S]*\}\s*\]/);
      if (arrayMatch) {
        jsonString = arrayMatch[0];
      } else {
        // Fallback for single object
        const objectMatch = jsonString.match(/\{[\s\S]*\}/);
        if (objectMatch) {
          jsonString = objectMatch[0];
        }
      }

      // Cleanup common JSON formatting errors natively
      jsonString = jsonString.replace(/,\s*([\]}])/g, '$1'); // Remove trailing commas

      let parsedData;
      let isErrorFallback = false;
      try {
        parsedData = JSON.parse(jsonString);
        if (!Array.isArray(parsedData)) parsedData = [parsedData];
      } catch (e) {
        console.error("Raw AI Reply:", reply);
        isErrorFallback = true;
        
        setChatHistory(prev => [
          ...prev, 
          { 
            role: 'assistant', 
            content: `I had trouble structuring the analysis properly, but here is what I found:\n\n${reply}\n\nPlease try uploading a slightly clearer screenshot if the board is empty.`
          }
        ]);
        
        // Dummy fallback so UI doesn't break
        parsedData = [{
          fen: DEFAULT_FEN,
          orientation: 'white',
          confidence: 'Low',
          bestMoveSan: null,
          eval: 'N/A',
          threat: 'Parse failed',
          idea: 'See chat for raw output',
          lastMovePlayedSan: null,
          blunderSquares: []
        }];
      }

      setAnalyzedPositions(parsedData);
      
      if (!isErrorFallback) {
        // Post structured analysis to chat
        const chatDetails = parsedData.map((pos, idx) => {
          return `**Position ${idx + 1}**\n- **Best move:** ${pos.bestMoveSan || 'N/A'}\n- **Eval:** ${pos.eval || '0.0'}\n- **Threat:** ${pos.threat || 'None'}\n- **Idea:** ${pos.idea || 'None'}`;
        }).join('\n\n');

        setChatHistory(prev => [
          ...prev, 
          { 
            role: 'assistant', 
            content: `I've analyzed the uploaded position(s). You can navigate through them on the board!\n\n${chatDetails}`
          }
        ]);
      }

      updateBoardToIndex(0);

    } catch (err) {
      setUploadError(`Analysis failed: ${err.message}`);
    } finally {
      setIsAnalyzingImage(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragActive(false);
    processImages(e.dataTransfer?.files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragActive(false);
  };

  const getQualityBadge = (quality) => {
    if (!quality) return null;
    const q = quality.toLowerCase();
    switch (q) {
      case 'brilliant': return <span className="badge badge-brilliant">✨ Brilliant</span>;
      case 'best': return <span className="badge badge-best">✅ Best</span>;
      case 'good': return <span className="badge badge-good">Good</span>;
      case 'inaccuracy': return <span className="badge badge-inaccuracy">⚠️ Inaccuracy</span>;
      case 'mistake': return <span className="badge badge-mistake">❌ Mistake</span>;
      case 'blunder': return <span className="badge badge-blunder">💀 Blunder</span>;
      default: return null;
    }
  };

  // Helper: derive arrows and squares locally
  const localAnalysisArrows = useMemo(() => {
    if (!currentAnalysis?.bestMoveSan) return [];
    try {
      const temp = new Chess(currentBoardFen);
      const move = temp.move(currentAnalysis.bestMoveSan);
      if (move) {
        return [[move.from, move.to, 'rgba(76, 175, 80, 0.88)']];
      }
    } catch { }
    return [];
  }, [currentAnalysis, currentBoardFen]);

  const localLastMoveSquares = useMemo(() => {
    if (!currentAnalysis?.lastMovePlayedSan) return null;
    try {
      // Very simple heuristic: search backwards if possible, or just ignore 
      // full reverse logic. Actually, if we just want highlight, 
      // creating an arrow for last move isn't usually from current FEN.
      // Easiest is to highlight the 'to' square of the SAN if it matches piece destination.
      // But full parsing requires the previous FEN.
      // If we don't have previous FEN, we can't perfectly highlight 'from'.
      return null;
    } catch { }
    return null;
  }, [currentAnalysis]);

  const blunderStyleMap = useMemo(() => {
    if (!currentAnalysis?.blunderSquares?.length) return {};
    const styles = {};
    currentAnalysis.blunderSquares.forEach(sq => {
      styles[sq.toLowerCase()] = { backgroundColor: 'rgba(229, 57, 53, 0.4)' };
    });
    return styles;
  }, [currentAnalysis]);

  const coachBoardOptions = useMemo(() => {
    const safeFen = currentBoardFen || DEFAULT_FEN;
    const safeOrientation = (boardOrientation || 'white').toLowerCase() === 'black' ? 'black' : 'white';
    
    const opts = {
      id: 'coachBoard',
      position: safeFen,
      boardOrientation: safeOrientation,
      lightSquareStyle: { backgroundColor: boardTheme?.light || '#ebecd0' },
      darkSquareStyle: { backgroundColor: boardTheme?.dark || '#779556' },
      animationDurationInMs: 100,
      showNotation: true,
      arePiecesDraggable: false,
      customSquareStyles: blunderStyleMap,
      arrows: localAnalysisArrows
    };
    
    // Explicitly omit pieces if undefined to prevent react-chessboard v5 from overwriting defaults
    const customPieces = getPieceRenderers(pieceStyle);
    if (customPieces) opts.pieces = customPieces;
    
    return opts;
  }, [currentBoardFen, boardOrientation, boardTheme, blunderStyleMap, localAnalysisArrows, pieceStyle]);


  return (
    <>
      {/* Header overrides - standard page header but with API Key button */}
      <div className="page-heading" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>AI Coach</h1>
          <p>Your personalized chess expert. Upload games for analysis or chat directly.</p>
        </div>
        <button className="btn btn-outline" onClick={() => setIsKeyModalOpen(true)}>
          <HiKey /> Change API Key
        </button>
      </div>

      <div className="coach-layout">
        {/* LEFT COMPONENT - Main View */}
        <div className="coach-main">

          {/* UPLOAD ZONE */}
          {/* UPLOAD ZONE */}
          {analyzedPositions.length === 0 && !isAnalyzingImage && (
            <div
              className={`upload-zone ${isDragActive ? 'drag-active' : ''}`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
            >
              <HiUpload className="upload-icon" />
              <h2>Upload Chess Image(s)</h2>
              <p style={{ color: 'var(--text-secondary)' }}>Select one or multiple game screenshots to analyze.</p>
              {uploadError && <p style={{ color: 'var(--accent-red)', marginTop: 12 }}>{uploadError}</p>}
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                multiple
                accept="image/png, image/jpeg, image/webp"
                onChange={(e) => processImages(e.target.files)}
              />
            </div>
          )}

          {/* SKELETON LOADER FOR ANALYSIS */}
          {isAnalyzingImage && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="skeleton" style={{ height: 480, width: '100%', borderRadius: 12 }}></div>
              <p style={{ textAlign: 'center', color: 'var(--accent-gold)' }}>The AI Coach is analyzing your position(s)...</p>
            </div>
          )}

          {/* NEW BOARD REVIEW COMPONENT */}
          {(!isAnalyzingImage && analyzedPositions.length > 0) && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, width: '100%' }}>
              <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center', padding: '0 8px' }}>
                <span className="badge" style={{ background: 'var(--bg-surface)' }}>
                  Confidence: <span style={{ color: currentAnalysis?.confidence === 'Low' ? 'var(--accent-red)' : 'var(--text-primary)' }}>{currentAnalysis?.confidence || 'Unknown'}</span>
                  {currentAnalysis?.confidence === 'Low' && ' (Consider editing FEN)'}
                </span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-sm btn-ghost" onClick={() => setIsEditingFen(!isEditingFen)}>
                    <HiPencil /> Edit
                  </button>
                  <button className="btn btn-sm btn-ghost" onClick={() => setBoardOrientation(o => o === 'white' ? 'black' : 'white')}>
                    <HiSwitchHorizontal /> Flip
                  </button>
                </div>
              </div>

              {isEditingFen && (
                 <div style={{ width: '100%', display: 'flex', gap: 8, padding: '0 8px' }}>
                   <input className="fen-input" style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'white' }} value={manualFen} onChange={e => setManualFen(e.target.value)} />
                   <button className="btn btn-primary btn-sm" onClick={() => {
                     setCurrentBoardFen(manualFen);
                     setIsEditingFen(false);
                     const newArray = [...analyzedPositions];
                     newArray[currentMoveIndex].fen = manualFen;
                     setAnalyzedPositions(newArray);
                   }}>Save</button>
                 </div>
              )}

              {/* Exact matching shell to AnalysisPage */}
              <div className="chessboard-container premium-board-shell" style={{ width: '100%', maxWidth: 540, margin: '0 auto' }}>
                <Chessboard options={coachBoardOptions} />
              </div>

              {/* Multiple Upload Timeline / Controls */}
              {analyzedPositions.length > 1 && (
                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div className="board-controls" style={{ background: 'var(--bg-surface)', padding: '12px 24px', borderRadius: 12, display: 'flex', gap: 16, alignItems: 'center', margin: '0 auto' }}>
                    <button onClick={() => updateBoardToIndex(0)} disabled={currentMoveIndex <= 0}><HiChevronDoubleLeft size={20} /></button>
                    <button onClick={() => updateBoardToIndex(currentMoveIndex - 1)} disabled={currentMoveIndex <= 0}><HiChevronLeft size={20} /></button>
                    <span style={{ fontSize: 14, fontWeight: 700, minWidth: 60, textAlign: 'center' }}>
                      {currentMoveIndex + 1} / {analyzedPositions.length}
                    </span>
                    <button onClick={() => updateBoardToIndex(currentMoveIndex + 1)} disabled={currentMoveIndex >= analyzedPositions.length - 1}><HiChevronRight size={20} /></button>
                    <button onClick={() => updateBoardToIndex(analyzedPositions.length - 1)} disabled={currentMoveIndex >= analyzedPositions.length - 1}><HiChevronDoubleRight size={20} /></button>
                  </div>

                  <div className="move-timeline" style={{ background: 'var(--bg-surface)', padding: '12px 16px', borderRadius: 12, display: 'flex', flexWrap: 'wrap', gap: 8, fontFamily: "'Roboto Mono', monospace", fontSize: 13, border: '1px solid var(--border)' }}>
                    {analyzedPositions.map((pos, idx) => {
                      const moveText = pos.lastMovePlayedSan || `Pos ${idx + 1}`;
                      const isActive = idx === currentMoveIndex;
                      return (
                        <span 
                          key={idx}
                          onClick={() => updateBoardToIndex(idx)}
                          style={{
                            padding: '4px 8px',
                            borderRadius: 4,
                            cursor: 'pointer',
                            background: isActive ? 'var(--accent-gold-20)' : 'transparent',
                            color: isActive ? 'var(--accent-gold)' : 'var(--text-secondary)',
                            fontWeight: isActive ? 700 : 400
                          }}
                        >
                          {moveText}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
                <button className="btn btn-outline" onClick={() => {
                  setAnalyzedPositions([]);
                  setCurrentBoardFen(DEFAULT_FEN);
                }}>
                  <HiRefresh /> Upload New Game
                </button>
              </div>
            </div>
          )}

          {/* STRENGTHS & WEAKNESSES */}
          {(strengths.length > 0 || weaknesses.length > 0) && (
            <div className="analysis-summary">
              <h2>Your Profile</h2>
              <div className="strengths-weaknesses">
                <div className="sw-card strengths">
                  <h3><span className="badge badge-best">Strengths</span></h3>
                  <ul className="sw-list">
                    {strengths.slice(-5).map((s, i) => <li key={i}>{s}</li>)}
                    {strengths.length === 0 && <li style={{ color: 'var(--text-secondary)' }}>Upload games for analysis to discover your strengths.</li>}
                  </ul>
                </div>
                <div className="sw-card weaknesses">
                  <h3><span className="badge badge-blunder">Areas to Improve</span></h3>
                  <ul className="sw-list">
                    {weaknesses.slice(-5).map((w, i) => <li key={i}>{w}</li>)}
                    {weaknesses.length === 0 && <li style={{ color: 'var(--text-secondary)' }}>Upload games for analysis to discover areas to improve.</li>}
                  </ul>
                </div>
              </div>

              {weaknesses.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <button className="btn btn-primary" onClick={generateLessons} disabled={isGeneratingLessons}>
                    {isGeneratingLessons ? 'Generating...' : <><HiLightBulb /> Generate Custom Lessons</>}
                  </button>
                </div>
              )}

              {isGeneratingLessons && (
                <div className="lessons-grid">
                  <div className="skeleton" style={{ height: 140 }}></div>
                  <div className="skeleton" style={{ height: 140 }}></div>
                  <div className="skeleton" style={{ height: 140 }}></div>
                </div>
              )}

              {lessons.length > 0 && !isGeneratingLessons && (
                <div className="lessons-grid">
                  {lessons.map((lesson, idx) => (
                    <div className="lesson-card" key={idx}>
                      <h4>{lesson.title}</h4>
                      <p>{lesson.description}</p>
                      {activeLessonIndex === idx ? (
                        <div style={{ background: 'var(--accent-gold-10)', padding: 12, borderRadius: 8, fontSize: 13 }}>
                          <strong>💡 Tip: </strong> {lesson.tip}
                        </div>
                      ) : (
                        <button className="btn btn-sm btn-outline" style={{ alignSelf: 'flex-start' }} onClick={() => setActiveLessonIndex(idx)}>
                          Start Lesson
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

        {/* RIGHT COMPONENT - Chat Sidebar */}
        <div className="coach-sidebar">
          <div className="chat-header">
            💬 Chat with Coach
          </div>
          <div className="chat-messages">
            {chatHistory.map((msg, i) => (
              <div key={i} className={`chat-message ${msg.role === 'user' ? 'user' : 'ai'}`}>
                {msg.content}
              </div>
            ))}
            {isChatLoading && (
              <div className="chat-message ai">
                <div className="typing-indicator">
                  <div className="typing-dot"></div>
                  <div className="typing-dot"></div>
                  <div className="typing-dot"></div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
          <form className="chat-input-area" onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage(chatInput);
            setChatInput('');
          }}>
            <div className="chat-input-wrapper">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask a chess question..."
                disabled={isChatLoading}
              />
              <button type="submit" disabled={!chatInput.trim() || isChatLoading}>
                <HiPaperAirplane style={{ transform: 'rotate(-45deg)' }} />
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* API KEY MODAL */}
      {isKeyModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0 }}>Change API Key</h3>
              <button onClick={() => {
                setIsKeyModalOpen(false);
                if (!apiKey) {
                  // If they close without key, fallback
                  localStorage.setItem('openRouterKey', DEFAULT_KEY);
                  setApiKey(DEFAULT_KEY);
                }
              }} style={{ color: 'var(--text-muted)' }}><HiX size={20} /></button>
            </div>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
              Enter your OpenRouter API key. Get one at <a href="https://openrouter.ai/keys" target="_blank" rel="noreferrer" style={{ color: 'var(--accent-gold)' }}>openrouter.ai/keys</a>.
            </p>
            <input
              type="password"
              placeholder="sk-or-v1-..."
              value={keyInput}
              onChange={e => setKeyInput(e.target.value)}
              autoFocus
            />
            <div className="modal-actions">
              <button className="btn btn-primary" onClick={handleSaveKey}>Save Key</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
