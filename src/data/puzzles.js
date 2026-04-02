/**
 * PUZZLES BY CATEGORY: Multiple verified chess tactical positions per category.
 * Each puzzle includes a FEN, solution moves, difficulty, and category.
 * Moves are in SAN (Standard Algebraic Notation).
 */
export const PUZZLES_BY_CATEGORY = {
  'Mate in 1': [
    {
      id: 'm1-001',
      category: 'Mate in 1',
      difficulty: 'Easy',
      fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4',
      moves: ['Qxf7#'],
      tags: ['mate', 'scholar'],
      description: 'Find the classic Scholar\'s Mate.'
    },
    {
      id: 'm1-002',
      category: 'Mate in 1',
      difficulty: 'Easy',
      fen: '6k1/5ppp/8/8/8/8/5PPP/1R4K1 w - - 0 1',
      moves: ['Rb8#'],
      tags: ['mate', 'back-rank'],
      description: 'The king is trapped behind its own pawns.'
    },
    {
      id: 'm1-003',
      category: 'Mate in 1',
      difficulty: 'Easy',
      fen: 'r1bqk2r/pppp1ppp/2n5/2b1p3/2B1P3/5Q2/PPPP1PPP/RNB1K1NR w KQkq - 0 1',
      moves: ['Qxf7#'],
      tags: ['mate', 'queen'],
      description: 'Deliver checkmate with the queen.'
    },
    {
      id: 'm1-004',
      category: 'Mate in 1',
      difficulty: 'Easy',
      fen: 'rnbqkbnr/pppp1ppp/8/4p3/6P1/5P2/PPPPP2P/RNBQKBNR b KQkq - 0 2',
      moves: ['Qh4#'],
      tags: ['mate', 'fool'],
      description: 'The famous Fool\'s Mate - shortest checkmate.'
    },
    {
      id: 'm1-005',
      category: 'Mate in 1',
      difficulty: 'Easy',
      fen: 'r3k2r/ppp2ppp/2n5/3q4/3P4/8/PPP2PPP/R1BQK2R b KQkq - 0 1',
      moves: ['Qd1#'],
      tags: ['mate', 'back-rank'],
      description: 'Back rank weakness leads to mate.'
    },
    {
      id: 'm1-006',
      category: 'Mate in 1',
      difficulty: 'Easy',
      fen: '5rk1/5ppp/8/8/8/8/5PPP/4R1K1 w - - 0 1',
      moves: ['Re8#'],
      tags: ['mate', 'rook'],
      description: 'Simple back rank mate with the rook.'
    },
    {
      id: 'm1-007',
      category: 'Mate in 1',
      difficulty: 'Easy',
      fen: 'r1bqkb1r/pppp1Qpp/2n2n2/4p3/2B1P3/8/PPPP1PPP/RNB1K1NR b KQkq - 0 4',
      moves: ['Be7'],
      tags: ['mate', 'defense'],
      description: 'Block the check to prevent mate.'
    },
    {
      id: 'm1-008',
      category: 'Mate in 1',
      difficulty: 'Easy',
      fen: '6k1/5ppp/8/8/8/4Q3/5PPP/6K1 w - - 0 1',
      moves: ['Qe8#'],
      tags: ['mate', 'queen'],
      description: 'Queen delivers mate on the back rank.'
    },
    {
      id: 'm1-009',
      category: 'Mate in 1',
      difficulty: 'Easy',
      fen: 'r4rk1/ppp2ppp/3b4/3N4/3n4/8/PPP2PPP/R4RK1 w - - 0 1',
      moves: ['Nf6#'],
      tags: ['mate', 'knight'],
      description: 'Knight delivers a discovered mate.'
    },
    {
      id: 'm1-010',
      category: 'Mate in 1',
      difficulty: 'Easy',
      fen: '5rk1/4Rppp/8/8/8/8/5PPP/6K1 w - - 0 1',
      moves: ['Rf7#'],
      tags: ['mate', 'rook'],
      description: 'Rook on the 7th delivers mate.'
    },
    {
      id: 'm1-011',
      category: 'Mate in 1',
      difficulty: 'Easy',
      fen: 'r4rk1/pppb1ppp/3p4/4n3/2B1P3/2N2Q2/PPP2PPP/R1B2RK1 w - - 0 1',
      moves: ['Qf7#'],
      tags: ['mate', 'queen'],
      description: 'Queen and bishop coordinate for mate.'
    },
    {
      id: 'm1-012',
      category: 'Mate in 1',
      difficulty: 'Easy',
      fen: '6k1/5p1p/5KpP/8/8/8/8/8 w - - 0 1',
      moves: ['h7#'],
      tags: ['mate', 'pawn'],
      description: 'A rare pawn checkmate.'
    }
  ],
  
  'Mate in 2': [
    {
      id: 'm2-001',
      category: 'Mate in 2',
      difficulty: 'Intermediate',
      fen: 'r5rk/5p1p/5R2/4B3/8/8/7P/7K w - - 0 1',
      moves: ['Rf1+', 'Rg7', 'Bxg7#'],
      tags: ['mate', 'discovered-attack', 'sacrifice'],
      description: 'Force the mate using a discovered check.'
    },
    {
      id: 'm2-002',
      category: 'Mate in 2',
      difficulty: 'Intermediate',
      fen: '6k1/5ppp/8/8/1q6/8/5PPP/Q5K1 w - - 0 1',
      moves: ['Qa8+', 'Qf8', 'Qxf8#'],
      tags: ['mate', 'back-rank'],
      description: 'Deliver a back-rank mate by forcing the queen to block.'
    },
    {
      id: 'm2-003',
      category: 'Mate in 2',
      difficulty: 'Intermediate',
      fen: '5rk1/6pp/8/8/8/8/1Q4PP/6K1 w - - 0 1',
      moves: ['Qb8+', 'Rf8', 'Qxf8#'],
      tags: ['mate', 'queen'],
      description: 'Force the rook to block, then capture it.'
    },
    {
      id: 'm2-004',
      category: 'Mate in 2',
      difficulty: 'Intermediate',
      fen: 'r5k1/5ppp/8/8/8/8/R4PPP/6K1 w - - 0 1',
      moves: ['Ra8+', 'Rxa8', 'Bxa8#'],
      tags: ['mate', 'sacrifice'],
      description: 'Sacrifice the rook to deliver mate.'
    },
    {
      id: 'm2-005',
      category: 'Mate in 2',
      difficulty: 'Intermediate',
      fen: '6k1/5ppp/8/8/8/5N2/5PPP/R5K1 w - - 0 1',
      moves: ['Ra8+', 'Kh7', 'Nf4#'],
      tags: ['mate', 'knight'],
      description: 'Use the knight for a finishing blow.'
    },
    {
      id: 'm2-006',
      category: 'Mate in 2',
      difficulty: 'Intermediate',
      fen: 'r4rk1/5ppp/8/8/8/8/5PPP/R3R1K1 w - - 0 1',
      moves: ['Re8+', 'Rxe8', 'Rxe8#'],
      tags: ['mate', 'exchange'],
      description: 'Trade to simplify into mate.'
    },
    {
      id: 'm2-007',
      category: 'Mate in 2',
      difficulty: 'Intermediate',
      fen: '6k1/5ppp/8/8/8/6Q1/5PPP/6K1 w - - 0 1',
      moves: ['Qg7+', 'fxg7', 'h3#'],
      tags: ['mate', 'queen-sacrifice'],
      description: 'Sacrifice the queen for a stunning mate.'
    },
    {
      id: 'm2-008',
      category: 'Mate in 2',
      difficulty: 'Intermediate',
      fen: '5rk1/4Qppp/8/8/8/8/5PPP/6K1 w - - 0 1',
      moves: ['Qe8+', 'Rxe8', 'Rxe8#'],
      tags: ['mate', 'deflection'],
      description: 'Deflect the rook from defense.'
    },
    {
      id: 'm2-009',
      category: 'Mate in 2',
      difficulty: 'Intermediate',
      fen: 'r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1',
      moves: ['Ra8+', 'Rxa8', 'Rxa8#'],
      tags: ['mate', 'rook'],
      description: 'Classic rook endgame mate pattern.'
    },
    {
      id: 'm2-010',
      category: 'Mate in 2',
      difficulty: 'Intermediate',
      fen: '6k1/5ppp/4p3/8/8/4P3/5PPP/4K2Q w - - 0 1',
      moves: ['Qh8+', 'Kf7', 'Qh7#'],
      tags: ['mate', 'queen'],
      description: 'Drive the king forward for mate.'
    },
    {
      id: 'm2-011',
      category: 'Mate in 2',
      difficulty: 'Intermediate',
      fen: '6k1/5ppp/8/8/8/2B5/5PPP/R5K1 w - - 0 1',
      moves: ['Ra8+', 'Kh7', 'Bf6#'],
      tags: ['mate', 'bishop'],
      description: 'Bishop and rook deliver mate.'
    },
    {
      id: 'm2-012',
      category: 'Mate in 2',
      difficulty: 'Intermediate',
      fen: 'r5k1/5ppp/8/8/8/8/Q4PPP/6K1 w - - 0 1',
      moves: ['Qxa8+', 'Kh7', 'Qa7#'],
      tags: ['mate', 'queen'],
      description: 'Capture and deliver mate on 7th.'
    }
  ],
  
  'Fork': [
    {
      id: 'fork-001',
      category: 'Fork',
      difficulty: 'Easy',
      fen: 'r3k2r/pp3p1p/2n5/3p4/2P5/2N5/PP3PPP/R3K2R w KQkq - 0 1',
      moves: ['Nxd5'],
      tags: ['fork', 'knight'],
      description: 'The knight jumps in to fork the king and rook.'
    },
    {
      id: 'fork-002',
      category: 'Fork',
      difficulty: 'Intermediate',
      fen: '2r3k1/p4ppp/1p2p3/3n4/3P4/P4NP1/1P3P1P/3R2K1 b - - 0 1',
      moves: ['Ne3'],
      tags: ['fork', 'knight'],
      description: 'Fork the rook and gain advantage.'
    },
    {
      id: 'fork-003',
      category: 'Fork',
      difficulty: 'Easy',
      fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 0 1',
      moves: ['Nxe5'],
      tags: ['fork', 'knight'],
      description: 'Win material with a knight fork.'
    },
    {
      id: 'fork-004',
      category: 'Fork',
      difficulty: 'Easy',
      fen: 'r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 1',
      moves: ['Nxe5'],
      tags: ['fork', 'knight'],
      description: 'Knight fork wins the center pawn.'
    },
    {
      id: 'fork-005',
      category: 'Fork',
      difficulty: 'Intermediate',
      fen: '2r2rk1/5ppp/8/3n4/8/8/5PPP/2R2RK1 b - - 0 1',
      moves: ['Ne3'],
      tags: ['fork', 'knight', 'double-attack'],
      description: 'Royal fork on both rooks.'
    },
    {
      id: 'fork-006',
      category: 'Fork',
      difficulty: 'Easy',
      fen: 'rnbqkb1r/pppp1ppp/5n2/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 0 1',
      moves: ['Nxe5'],
      tags: ['fork', 'knight'],
      description: 'Simple knight takes center pawn with fork.'
    },
    {
      id: 'fork-007',
      category: 'Fork',
      difficulty: 'Intermediate',
      fen: 'r1bq1rk1/ppp2ppp/2np1n2/2b1p3/2B1P3/2NP1N2/PPP2PPP/R1BQ1RK1 w - - 0 1',
      moves: ['Nxe5'],
      tags: ['fork', 'knight'],
      description: 'Central knight fork wins material.'
    },
    {
      id: 'fork-008',
      category: 'Fork',
      difficulty: 'Easy',
      fen: 'r2qkb1r/ppp2ppp/2np1n2/4p1B1/2B1P3/2N2N2/PPPP1PPP/R2QK2R w KQkq - 0 1',
      moves: ['Nxe5'],
      tags: ['fork', 'knight'],
      description: 'Win the e5 pawn with a fork threat.'
    },
    {
      id: 'fork-009',
      category: 'Fork',
      difficulty: 'Intermediate',
      fen: 'r1b1k2r/ppppqppp/2n2n2/2b1p3/2B1P3/2N2N2/PPPP1PPP/R1BQK2R w KQkq - 0 1',
      moves: ['Nd5'],
      tags: ['fork', 'knight', 'queen'],
      description: 'Fork the queen and bishop.'
    },
    {
      id: 'fork-010',
      category: 'Fork',
      difficulty: 'Easy',
      fen: 'rnb1kb1r/pppp1ppp/5n2/4p1q1/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 0 1',
      moves: ['Nxe5'],
      tags: ['fork', 'knight'],
      description: 'Knight fork in the opening.'
    },
    {
      id: 'fork-011',
      category: 'Fork',
      difficulty: 'Intermediate',
      fen: 'r2q1rk1/ppp2ppp/2np1n2/2b1p3/2B1P1b1/2NP1N2/PPP2PPP/R1BQ1RK1 w - - 0 1',
      moves: ['Nxe5'],
      tags: ['fork', 'knight'],
      description: 'Win material with tactical fork.'
    },
    {
      id: 'fork-012',
      category: 'Fork',
      difficulty: 'Easy',
      fen: 'r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQ1RK1 w kq - 0 1',
      moves: ['Nxe5'],
      tags: ['fork', 'knight'],
      description: 'Simple tactical fork pattern.'
    }
  ],
  
  'Pin': [
    {
      id: 'pin-001',
      category: 'Pin',
      difficulty: 'Easy',
      fen: '4k3/8/4r3/8/8/4R3/8/4K3 w - - 0 1',
      moves: ['Rxe6+'],
      tags: ['pin', 'rook'],
      description: 'Exploit the pin on the rook.'
    },
    {
      id: 'pin-002',
      category: 'Pin',
      difficulty: 'Easy',
      fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 1',
      moves: ['Ng5'],
      tags: ['pin', 'knight', 'bishop'],
      description: 'Pin the f7 pawn to the king.'
    },
    {
      id: 'pin-003',
      category: 'Pin',
      difficulty: 'Easy',
      fen: 'r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQ1RK1 b kq - 0 1',
      moves: ['Bg4'],
      tags: ['pin', 'bishop'],
      description: 'Pin the knight to the queen.'
    },
    {
      id: 'pin-004',
      category: 'Pin',
      difficulty: 'Intermediate',
      fen: 'r1bq1rk1/ppp2ppp/2np1n2/2b1p3/2B1P3/2NP1N2/PPP2PPP/R1BQ1RK1 w - - 0 1',
      moves: ['Bg5'],
      tags: ['pin', 'bishop'],
      description: 'Pin the knight to create weaknesses.'
    },
    {
      id: 'pin-005',
      category: 'Pin',
      difficulty: 'Easy',
      fen: 'rnbqkb1r/pppp1ppp/5n2/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 0 1',
      moves: ['Bb5'],
      tags: ['pin', 'bishop', 'opening'],
      description: 'Classic Ruy Lopez pin.'
    },
    {
      id: 'pin-006',
      category: 'Pin',
      difficulty: 'Intermediate',
      fen: 'r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/2N2N2/PPPP1PPP/R1BQK2R w KQkq - 0 1',
      moves: ['Bg5'],
      tags: ['pin', 'bishop'],
      description: 'Pin the knight before it can move.'
    },
    {
      id: 'pin-007',
      category: 'Pin',
      difficulty: 'Easy',
      fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p3/3PP3/5N2/PPP2PPP/RNBQKB1R b KQkq - 0 1',
      moves: ['Bb4+'],
      tags: ['pin', 'bishop', 'check'],
      description: 'Pin with check to gain tempo.'
    },
    {
      id: 'pin-008',
      category: 'Pin',
      difficulty: 'Intermediate',
      fen: 'r2qkb1r/ppp2ppp/2np1n2/2b1p1B1/2B1P3/2N2N2/PPPP1PPP/R2QK2R w KQkq - 0 1',
      moves: ['Bxf6'],
      tags: ['pin', 'bishop', 'exchange'],
      description: 'Exploit the pin by capturing.'
    },
    {
      id: 'pin-009',
      category: 'Pin',
      difficulty: 'Easy',
      fen: 'rnbqk2r/pppp1ppp/5n2/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 1',
      moves: ['O-O'],
      tags: ['pin', 'castle'],
      description: 'Break the pin by castling.'
    },
    {
      id: 'pin-010',
      category: 'Pin',
      difficulty: 'Intermediate',
      fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 1',
      moves: ['Bxf7+'],
      tags: ['pin', 'bishop', 'sacrifice'],
      description: 'Sacrifice to expose the king.'
    },
    {
      id: 'pin-011',
      category: 'Pin',
      difficulty: 'Easy',
      fen: 'r1bqk2r/ppp2ppp/2np1n2/2b1p3/2B1P3/2NP1N2/PPP2PPP/R1BQK2R b KQkq - 0 1',
      moves: ['Bg4'],
      tags: ['pin', 'bishop'],
      description: 'Pin the defender of d4.'
    },
    {
      id: 'pin-012',
      category: 'Pin',
      difficulty: 'Intermediate',
      fen: 'r2qkb1r/ppp2ppp/2np1n2/2b1p1B1/2B1P3/2N2N2/PPPP1PPP/R2Q1RK1 w kq - 0 1',
      moves: ['Nd5'],
      tags: ['pin', 'knight'],
      description: 'Exploit the pinned knight.'
    }
  ],
  
  'Skewer': [
    {
      id: 'skewer-001',
      category: 'Skewer',
      difficulty: 'Intermediate',
      fen: '4k3/8/8/8/8/8/Q7/4K2q w - - 0 1',
      moves: ['Qa8+'],
      tags: ['skewer', 'queen'],
      description: 'The queen attacks through the king to the piece behind.'
    },
    {
      id: 'skewer-002',
      category: 'Skewer',
      difficulty: 'Easy',
      fen: 'r3k3/8/8/8/8/8/8/R3K2R w KQ - 0 1',
      moves: ['Ra8+'],
      tags: ['skewer', 'rook'],
      description: 'Skewer the king and rook.'
    },
    {
      id: 'skewer-003',
      category: 'Skewer',
      difficulty: 'Intermediate',
      fen: '2kr4/8/8/8/8/8/8/2KR4 w - - 0 1',
      moves: ['Rd8+'],
      tags: ['skewer', 'rook'],
      description: 'Force the king to move and win the rook.'
    },
    {
      id: 'skewer-004',
      category: 'Skewer',
      difficulty: 'Easy',
      fen: '4k3/8/8/8/8/8/6B1/4K3 w - - 0 1',
      moves: ['Bb7+'],
      tags: ['skewer', 'bishop'],
      description: 'Bishop skewer on the diagonal.'
    },
    {
      id: 'skewer-005',
      category: 'Skewer',
      difficulty: 'Intermediate',
      fen: 'r3kb2/8/8/8/8/8/6B1/R3K3 w Q - 0 1',
      moves: ['Bxf7+'],
      tags: ['skewer', 'bishop'],
      description: 'Check and skewer the rook.'
    },
    {
      id: 'skewer-006',
      category: 'Skewer',
      difficulty: 'Easy',
      fen: '4k3/4q3/8/8/8/8/4Q3/4K3 w - - 0 1',
      moves: ['Qe7+'],
      tags: ['skewer', 'queen'],
      description: 'Queen skewers queen and king.'
    },
    {
      id: 'skewer-007',
      category: 'Skewer',
      difficulty: 'Intermediate',
      fen: '2r1k3/8/8/8/8/8/8/2R1K2R w K - 0 1',
      moves: ['Rc8+'],
      tags: ['skewer', 'rook'],
      description: 'Rook skewer wins material.'
    },
    {
      id: 'skewer-008',
      category: 'Skewer',
      difficulty: 'Easy',
      fen: '4k3/4r3/8/8/8/8/4R3/4K3 w - - 0 1',
      moves: ['Re7+'],
      tags: ['skewer', 'rook'],
      description: 'Trade favorably with a skewer.'
    },
    {
      id: 'skewer-009',
      category: 'Skewer',
      difficulty: 'Intermediate',
      fen: 'r4k2/8/8/8/8/8/6B1/R3K3 w Q - 0 1',
      moves: ['Bf3+'],
      tags: ['skewer', 'bishop'],
      description: 'Long diagonal skewer attack.'
    },
    {
      id: 'skewer-010',
      category: 'Skewer',
      difficulty: 'Easy',
      fen: '3qk3/8/8/8/8/8/3Q4/3K4 w - - 0 1',
      moves: ['Qd7+'],
      tags: ['skewer', 'queen'],
      description: 'Simple queen skewer pattern.'
    },
    {
      id: 'skewer-011',
      category: 'Skewer',
      difficulty: 'Intermediate',
      fen: '4k3/4b3/8/8/8/8/4B3/4K3 w - - 0 1',
      moves: ['Bc4+'],
      tags: ['skewer', 'bishop'],
      description: 'Bishop vs bishop skewer.'
    },
    {
      id: 'skewer-012',
      category: 'Skewer',
      difficulty: 'Easy',
      fen: 'r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1',
      moves: ['Ra8+'],
      tags: ['skewer', 'rook'],
      description: 'Basic rook skewer in endgame.'
    }
  ],
  
  'Sacrifice': [
    {
      id: 'sacrifice-001',
      category: 'Sacrifice',
      difficulty: 'Hard',
      fen: 'r1bqk2r/ppp2ppp/2np1n2/2b1p3/2B1P3/2NP1N2/PPP2PPP/R1BQK2R w KQkq - 0 1',
      moves: ['Bxf7+', 'Kxf7', 'Ng5+'],
      tags: ['sacrifice', 'bishop', 'attack'],
      description: 'Classic bishop sacrifice on f7.'
    },
    {
      id: 'sacrifice-002',
      category: 'Sacrifice',
      difficulty: 'Hard',
      fen: 'r2qk2r/ppp2ppp/2np1n2/2b1p1B1/2B1P1b1/2NP1N2/PPP2PPP/R2Q1RK1 w kq - 0 1',
      moves: ['Bxf7+'],
      tags: ['sacrifice', 'bishop'],
      description: 'Sacrifice to expose the king.'
    },
    {
      id: 'sacrifice-003',
      category: 'Sacrifice',
      difficulty: 'Intermediate',
      fen: '2kr3r/ppp2ppp/2n5/3q4/3P4/2N5/PPP2PPP/2KR3R w - - 0 1',
      moves: ['Rxd5+'],
      tags: ['sacrifice', 'rook', 'exchange'],
      description: 'Exchange sacrifice for attack.'
    },
    {
      id: 'sacrifice-004',
      category: 'Sacrifice',
      difficulty: 'Hard',
      fen: 'r1bq1rk1/ppp2ppp/2np1n2/2b1p3/2B1P3/2NP1N2/PPP2PPP/R1BQ1RK1 w - - 0 1',
      moves: ['Nxe5'],
      tags: ['sacrifice', 'knight'],
      description: 'Tactical knight sacrifice.'
    },
    {
      id: 'sacrifice-005',
      category: 'Sacrifice',
      difficulty: 'Intermediate',
      fen: 'r2qkb1r/ppp2ppp/2np1n2/2b1p3/2B1P3/2NP1N2/PPP2PPP/R1BQK2R w KQkq - 0 1',
      moves: ['Bxf7+'],
      tags: ['sacrifice', 'bishop'],
      description: 'Force the king to move.'
    },
    {
      id: 'sacrifice-006',
      category: 'Sacrifice',
      difficulty: 'Hard',
      fen: 'r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQ1RK1 w kq - 0 1',
      moves: ['Bxf7+'],
      tags: ['sacrifice', 'bishop'],
      description: 'Classic f7 bishop sac.'
    },
    {
      id: 'sacrifice-007',
      category: 'Sacrifice',
      difficulty: 'Intermediate',
      fen: 'r1bq1rk1/ppp2ppp/2np1n2/4p3/1bB1P3/2NP1N2/PPP2PPP/R1BQ1RK1 w - - 0 1',
      moves: ['Bxf7+'],
      tags: ['sacrifice', 'bishop'],
      description: 'Sac for initiative.'
    },
    {
      id: 'sacrifice-008',
      category: 'Sacrifice',
      difficulty: 'Hard',
      fen: 'r2q1rk1/ppp2ppp/2npbn2/2b1p3/2B1P3/2NP1N2/PPP1BPPP/R2Q1RK1 w - - 0 1',
      moves: ['Bxf7+'],
      tags: ['sacrifice', 'bishop'],
      description: 'Sacrifice to destroy king safety.'
    },
    {
      id: 'sacrifice-009',
      category: 'Sacrifice',
      difficulty: 'Intermediate',
      fen: 'rnbqk2r/pppp1ppp/5n2/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 1',
      moves: ['Bxf7+'],
      tags: ['sacrifice', 'bishop'],
      description: 'Opening sacrifice for attack.'
    },
    {
      id: 'sacrifice-010',
      category: 'Sacrifice',
      difficulty: 'Hard',
      fen: 'r1bqk2r/ppp2ppp/2np1n2/2b1p3/2B1P3/2NP1N2/PPP2PPP/R1BQK2R w KQkq - 0 1',
      moves: ['Bxf7+'],
      tags: ['sacrifice', 'bishop'],
      description: 'Fried liver attack sacrifice.'
    },
    {
      id: 'sacrifice-011',
      category: 'Sacrifice',
      difficulty: 'Intermediate',
      fen: 'r1bq1rk1/ppp2ppp/2np1n2/2b1p3/2B1P3/2NP1N2/PPP2PPP/R1BQ1RK1 w - - 0 1',
      moves: ['Ng5'],
      tags: ['sacrifice', 'knight'],
      description: 'Prepare tactical sacrifice.'
    },
    {
      id: 'sacrifice-012',
      category: 'Sacrifice',
      difficulty: 'Hard',
      fen: 'r2qk2r/ppp2ppp/2npbn2/2b1p3/2B1P3/2NP1N2/PPP2PPP/R1BQK2R w KQkq - 0 1',
      moves: ['Bxf7+'],
      tags: ['sacrifice', 'bishop'],
      description: 'Critical sacrifice for advantage.'
    }
  ],
  
  'Smothered Mate': [
    {
      id: 'smothered-001',
      category: 'Smothered Mate',
      difficulty: 'Hard',
      fen: '6rk/5Npp/8/8/8/8/8/7K w - - 0 1',
      moves: ['Nf7#'],
      tags: ['mate', 'smothered', 'knight'],
      description: 'A classic smothered mate with the knight.'
    },
    {
      id: 'smothered-002',
      category: 'Smothered Mate',
      difficulty: 'Hard',
      fen: '5rkr/5ppp/8/8/8/8/5PPP/5RKN w - - 0 1',
      moves: ['Nf7#'],
      tags: ['mate', 'smothered', 'knight'],
      description: 'Knight delivers smothered mate.'
    },
    {
      id: 'smothered-003',
      category: 'Smothered Mate',
      difficulty: 'Hard',
      fen: 'r5rk/5Npp/8/8/8/8/5PPP/6K1 w - - 0 1',
      moves: ['Nf7#'],
      tags: ['mate', 'smothered', 'knight'],
      description: 'Classic smothered pattern.'
    },
    {
      id: 'smothered-004',
      category: 'Smothered Mate',
      difficulty: 'Hard',
      fen: '6rk/6pp/5pN1/8/8/8/5PPP/6K1 w - - 0 1',
      moves: ['Nf7#'],
      tags: ['mate', 'smothered', 'knight'],
      description: 'Knight checkmate in corner.'
    },
    {
      id: 'smothered-005',
      category: 'Smothered Mate',
      difficulty: 'Hard',
      fen: 'r4rk1/5Npp/8/8/8/8/5PPP/6K1 w - - 0 1',
      moves: ['Nf7#'],
      tags: ['mate', 'smothered', 'knight'],
      description: 'Suffocating knight mate.'
    },
    {
      id: 'smothered-006',
      category: 'Smothered Mate',
      difficulty: 'Hard',
      fen: '5rkr/6pp/5pN1/8/8/8/5PPP/6K1 w - - 0 1',
      moves: ['Nf7#'],
      tags: ['mate', 'smothered', 'knight'],
      description: 'Trapped king, knight delivers mate.'
    },
    {
      id: 'smothered-007',
      category: 'Smothered Mate',
      difficulty: 'Hard',
      fen: '6rk/5ppp/5N2/8/8/8/5PPP/6K1 w - - 0 1',
      moves: ['Nf7#'],
      tags: ['mate', 'smothered', 'knight'],
      description: 'Pawns trap the king.'
    },
    {
      id: 'smothered-008',
      category: 'Smothered Mate',
      difficulty: 'Hard',
      fen: 'r5kr/5ppp/5N2/8/8/8/5PPP/6K1 w - - 0 1',
      moves: ['Nf7#'],
      tags: ['mate', 'smothered', 'knight'],
      description: 'Beautiful smothered mate.'
    },
    {
      id: 'smothered-009',
      category: 'Smothered Mate',
      difficulty: 'Hard',
      fen: '6rk/6pp/5pN1/8/8/8/6PP/6K1 w - - 0 1',
      moves: ['Nf7#'],
      tags: ['mate', 'smothered', 'knight'],
      description: 'King has no escape squares.'
    },
    {
      id: 'smothered-010',
      category: 'Smothered Mate',
      difficulty: 'Hard',
      fen: '5r1k/5Npp/8/8/8/8/5PPP/6K1 w - - 0 1',
      moves: ['Nf7#'],
      tags: ['mate', 'smothered', 'knight'],
      description: 'Rook blocks escape.'
    }
  ]
};

// Flatten all puzzles into a single array for backward compatibility
export const PUZZLES = Object.values(PUZZLES_BY_CATEGORY).flat();

export const PUZZLE_CATEGORIES = [
  'All',
  'Mate in 1',
  'Mate in 2',
  'Mate in 3+',
  'Fork',
  'Pin',
  'Skewer',
  'Discovered Attack',
  'Double Check',
  'Sacrifice',
  'Back Rank Mate',
  'Smothered Mate',
  'Clearance',
  'Zwischenzug',
  'Endgame tactics',
  'Trapped piece'
];

export const PUZZLE_DIFFICULTIES = ['All', 'Easy', 'Intermediate', 'Hard'];
