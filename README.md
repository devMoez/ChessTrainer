# ♟️ Chess Trainer

A modern, interactive chess training web application built with React and Vite. Master chess through AI-powered coaching, opening practice, and tactical analysis.

## ✨ Features

### 🎮 Game Modes
- **Play vs Stockfish AI** - Challenge the powerful Stockfish engine with adjustable difficulty
- **Human vs Human** - Play against a friend locally
- **Opening Trainer** - Practice 300+ chess openings with interactive guidance
- **Puzzle Mode** - Solve tactical puzzles to improve your skills

### 🤖 AI Coach
- Position analysis and evaluation
- Move-by-move explanations
- Strategic suggestions
- Pattern recognition training
- Powered by OpenRouter AI

### 📊 Analysis Tools
- **Real-time Position Evaluation** - Live Stockfish analysis with depth control
- **Interactive Analysis Board** - Drag-and-drop pieces with instant response
- **Move History Tracking** - Complete game notation and navigation
- **Best Move Suggestions** - Engine-powered recommendations
- **Opening Repertoire** - 300+ opening variations with practice modes

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm

### Installation

1. Clone the repository
```bash
git clone https://github.com/YOUR_USERNAME/chesstrainer.git
cd chesstrainer
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp .env.example .env
```
Edit `.env` and add your OpenRouter API key (optional, for AI Coach feature):
```
VITE_OPENROUTER_API_KEY=your_api_key_here
```

4. Start the development server
```bash
npm run dev
```

5. Open [http://localhost:5173](http://localhost:5173) in your browser

## 🛠️ Tech Stack

- **Frontend**: React 19, React Router
- **Chess Logic**: chess.js
- **Chess UI**: react-chessboard
- **Chess Engine**: Stockfish 17.1 (Latest official release)
- **Styling**: TailwindCSS 4, Framer Motion
- **AI**: OpenRouter API
- **Build Tool**: Vite 7
- **Testing**: Playwright

## 📦 Scripts

```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run preview    # Preview production build
npm run lint       # Run ESLint
npm run test       # Run tests
npm run test:ui    # Run tests with UI
```

## 🔐 Security

- Never commit your `.env` file
- API keys are stored in environment variables
- All sensitive data is gitignored
- Use `.env.example` as a template

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Stockfish](https://stockfishchess.org/) - The powerful chess engine
- [chess.js](https://github.com/jhlywa/chess.js) - Chess logic library
- [react-chessboard](https://github.com/Clariity/react-chessboard) - Beautiful chessboard component
- [OpenRouter](https://openrouter.ai/) - AI API platform

## 📧 Contact

For questions or feedback, please open an issue on GitHub.

---

Made with ♟️ and ❤️
