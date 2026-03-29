import { Chess } from 'chess.js';

export class PuzzleGenerator {
  constructor(stockfishPath = "/stockfish/stockfish-18-lite-single.js") {
    this.stockfishPath = stockfishPath;
    this.worker = null;
    this.isReady = false;
  }

  init() {
    return new Promise((resolve) => {
      this.worker = new Worker(this.stockfishPath);
      this.worker.onmessage = (e) => {
        if (e.data === 'uciok') {
          this.worker.postMessage('isready');
        } else if (e.data === 'readyok') {
          this.isReady = true;
          resolve();
        }
      };
      this.worker.postMessage('uci');
    });
  }

  analyze(fen, depth = 15) {
    return new Promise((resolve) => {
      let bestMove = null;
      let score = 0;
      let multiPv = [];

      const onMessage = (e) => {
        const line = e.data;
        if (line.startsWith('info ')) {
          const scoreMatch = line.match(/score cp (-?\d+)/);
          const mateMatch = line.match(/score mate (-?\d+)/);
          const pvMatch = line.match(/pv (.+)/);
          
          if (pvMatch) {
            const pv = pvMatch[1].split(' ');
            const cp = scoreMatch ? parseInt(scoreMatch[1]) : (mateMatch ? (parseInt(mateMatch[1]) > 0 ? 10000 : -10000) : 0);
            
            const multipvMatch = line.match(/multipv (\d+)/);
            const pvIdx = multipvMatch ? parseInt(multipvMatch[1]) - 1 : 0;
            
            multiPv[pvIdx] = { cp, pv };
          }
        } else if (line.startsWith('bestmove ')) {
          this.worker.removeEventListener('message', onMessage);
          resolve(multiPv);
        }
      };

      this.worker.addEventListener('message', onMessage);
      this.worker.postMessage(`setoption name MultiPV value 3`);
      this.worker.postMessage(`position fen ${fen}`);
      this.worker.postMessage(`go depth ${depth}`);
    });
  }

  async generateFromFen(fen) {
    if (!this.isReady) await this.init();
    
    const analysis = await this.analyze(fen);
    if (!analysis || analysis.length < 2) return null;

    // Detect a tactical opportunity:
    // 1. One move is significantly better than others (e.g., > 200cp difference)
    // 2. Or a mate is found
    const best = analysis[0];
    const secondBest = analysis[1];

    if (!best || !secondBest) return null;

    const diff = best.cp - secondBest.cp;
    
    // For the side to move
    if (diff > 200 || best.cp > 500) {
        // We found a tactic!
        const game = new Chess(fen);
        const moves = [];
        
        // Take the first 3-5 moves of the PV as the solution
        for (let i = 0; i < Math.min(best.pv.length, 5); i++) {
           try {
             const move = game.move(best.pv[i]);
             if (move) moves.push(move.san);
           } catch (e) { break; }
        }

        return {
            id: Date.now(),
            title: "Generated Tactic",
            difficulty: diff > 500 ? "Advanced" : "Intermediate",
            fen: fen,
            moves: moves
        };
    }

    return null;
  }

  terminate() {
    if (this.worker) {
      this.worker.terminate();
    }
  }
}
