/**
 * useAIMemory — Client-side RAG + Self-Improvement Memory System
 *
 * Systems implemented:
 *  System 1: Track interactions + quality signals
 *  System 2: Retrieve relevant past memories (keyword-match RAG)
 *  System 3: User profile auto-built from usage patterns
 *  System 6: Safety — quota guard, low-rating pruning
 */

const MEMORY_KEY = 'aiCoach_memory';
const PROFILE_KEY = 'aiCoach_userProfile';
const MAX_MEMORIES = 80;
const MIN_RATING_TO_KEEP = -2; // prune if rated down more than twice

// ─── Helpers ──────────────────────────────────────────────────────────────────

function loadMemories() {
  try {
    const raw = localStorage.getItem(MEMORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveMemories(memories) {
  try {
    localStorage.setItem(MEMORY_KEY, JSON.stringify(memories));
  } catch {
    // localStorage full — prune oldest quarter
    const pruned = memories.slice(Math.floor(memories.length / 4));
    localStorage.setItem(MEMORY_KEY, JSON.stringify(pruned));
  }
}

function loadProfile() {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    return raw ? JSON.parse(raw) : {
      topicsDiscussed: [],
      openingsStudied: [],
      weakAreas: [],
      strongAreas: [],
      totalInteractions: 0,
      preferredStyle: 'balanced', // 'tactical', 'positional', 'balanced'
    };
  } catch {
    return { topicsDiscussed: [], openingsStudied: [], weakAreas: [], strongAreas: [], totalInteractions: 0, preferredStyle: 'balanced' };
  }
}

function saveProfile(profile) {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch {}
}

// Extract chess keywords from text for lightweight retrieval
const CHESS_TOPIC_PATTERNS = [
  { pattern: /open(ing)?s?|sicilian|ruy lopez|king's indian|french|caro.kann|english|queen's gambit/i, topic: 'openings' },
  { pattern: /tactic|fork|pin|skewer|discovery|sacrifice|combination/i, topic: 'tactics' },
  { pattern: /endgame|king and pawn|rook ending|bishop|knight vs/i, topic: 'endgames' },
  { pattern: /strateg|plan|pawn structure|weak square|outpost|initiative/i, topic: 'strategy' },
  { pattern: /blunder|mistake|inaccuracy|losing move|best move/i, topic: 'mistakes' },
  { pattern: /attack|assault|kingside|queenside|h-file|g-file/i, topic: 'attacking' },
  { pattern: /position|eval|advantage|equal|winning|losing/i, topic: 'evaluation' },
];

function extractTopics(text) {
  return CHESS_TOPIC_PATTERNS
    .filter(({ pattern }) => pattern.test(text))
    .map(({ topic }) => topic);
}

function scoreMemoryRelevance(memory, query) {
  const qTopics = extractTopics(query);
  const mTopics = memory.topics || [];
  const overlap = mTopics.filter(t => qTopics.includes(t)).length;
  const ratingBonus = (memory.rating || 0) * 0.5;
  const recencyBonus = memory.timestamp ? (memory.timestamp / Date.now()) * 2 : 0;
  return overlap + ratingBonus + recencyBonus;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Add a new interaction to memory.
 * @param {{ userMsg: string, aiReply: string, fen?: string }} entry
 * @returns {string} id of the new memory entry
 */
export function addMemory({ userMsg, aiReply, fen }) {
  const memories = loadMemories();
  const id = `mem_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const topics = extractTopics(userMsg + ' ' + aiReply);

  const entry = {
    id,
    userMsg: userMsg.slice(0, 300),   // cap for storage
    aiReply: aiReply.slice(0, 600),
    fen: fen || null,
    topics,
    rating: 0,
    timestamp: Date.now(),
  };

  memories.push(entry);

  // Prune if over limit — remove worst-rated + oldest
  if (memories.length > MAX_MEMORIES) {
    memories.sort((a, b) => (b.rating - a.rating) || (b.timestamp - a.timestamp));
    memories.splice(MAX_MEMORIES);
  }

  // Also remove any deeply negative entries
  const filtered = memories.filter(m => m.rating > MIN_RATING_TO_KEEP);
  saveMemories(filtered);

  // Update user profile
  const profile = loadProfile();
  profile.totalInteractions += 1;
  const newTopics = topics.filter(t => !profile.topicsDiscussed.includes(t));
  profile.topicsDiscussed = [...new Set([...profile.topicsDiscussed, ...newTopics])].slice(0, 20);
  if (topics.includes('openings')) {
    // Try to extract opening name
    const match = userMsg.match(/(?:sicilian|ruy lopez|king's indian|french|caro.kann|english|queen's gambit|london|italian|spanish)/i);
    if (match) {
      profile.openingsStudied = [...new Set([...profile.openingsStudied, match[0].toLowerCase()])].slice(0, 15);
    }
  }
  saveProfile(profile);

  return id;
}

/**
 * Rate a memory entry.
 * @param {string} id
 * @param {1 | -1} delta
 */
export function rateMemory(id, delta) {
  const memories = loadMemories();
  const entry = memories.find(m => m.id === id);
  if (entry) {
    entry.rating = (entry.rating || 0) + delta;
    saveMemories(memories);
  }
}

/**
 * Get top-N relevant memory entries for a given query.
 * @param {string} query
 * @param {number} n
 * @returns {Array}
 */
export function topMemories(query, n = 3) {
  const memories = loadMemories();
  return memories
    .map(m => ({ ...m, _score: scoreMemoryRelevance(m, query) }))
    .filter(m => m._score > 0 && m.rating >= 0)
    .sort((a, b) => b._score - a._score)
    .slice(0, n);
}

/**
 * Get the current user profile.
 * @returns {object}
 */
export function getUserProfile() {
  return loadProfile();
}

/**
 * Update weak/strong areas from AI-detected patterns.
 * @param {{ weak?: string[], strong?: string[] }} updates
 */
export function updateUserProfile(updates) {
  const profile = loadProfile();
  if (updates.weak) profile.weakAreas = [...new Set([...profile.weakAreas, ...updates.weak])].slice(0, 10);
  if (updates.strong) profile.strongAreas = [...new Set([...profile.strongAreas, ...updates.strong])].slice(0, 10);
  saveProfile(profile);
}

/**
 * Build an optimized, context-aware system prompt.
 * @param {string} currentFen - current board FEN if available
 * @param {string} userQuery - current user query
 * @returns {string}
 */
export function buildSystemPrompt(currentFen, userQuery) {
  const profile = getUserProfile();
  const relevant = topMemories(userQuery, 3);

  const parts = [
    'You are a world-class chess coach. Be concise, insightful, and friendly.',
    'CRITICAL: Only answer chess-related questions. Politely decline anything off-topic.',
  ];

  // System 3: Personalized context
  if (profile.totalInteractions > 2) {
    const profileParts = [];
    if (profile.weakAreas.length > 0) profileParts.push(`Known weaknesses: ${profile.weakAreas.join(', ')}.`);
    if (profile.strongAreas.length > 0) profileParts.push(`Known strengths: ${profile.strongAreas.join(', ')}.`);
    if (profile.openingsStudied.length > 0) profileParts.push(`Openings studied: ${profile.openingsStudied.join(', ')}.`);
    if (profile.topicsDiscussed.length > 0) profileParts.push(`Topics of interest: ${profile.topicsDiscussed.join(', ')}.`);
    if (profileParts.length > 0) {
      parts.push('USER PROFILE: ' + profileParts.join(' ') + ' Tailor your explanation to this player.');
    }
  }

  // System 4: Board position context
  if (currentFen && currentFen !== 'start') {
    parts.push(`CURRENT BOARD POSITION (FEN): ${currentFen}. Reference this position when relevant.`);
  }

  // System 2: RAG — inject top relevant past context
  if (relevant.length > 0) {
    const memContext = relevant.map(m =>
      `Q: "${m.userMsg.slice(0, 100)}" → A: "${m.aiReply.slice(0, 200)}"`
    ).join('\n');
    parts.push(`RELEVANT PAST CONTEXT (use to inform but do not repeat verbatim):\n${memContext}`);
  }

  // System 5: Quality instruction
  parts.push('Before responding, verify: Is this correct? Is this clear? Is this useful? If not, refine.');

  return parts.join('\n\n');
}
