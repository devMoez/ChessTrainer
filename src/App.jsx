import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppProvider.jsx';
import Sidebar from './components/Sidebar.jsx';
import Header from './components/Header.jsx';

// Code-splitting for better initial load performance
const HomePage = lazy(() => import('./pages/HomePage.jsx'));
const PlayPage = lazy(() => import('./pages/PlayPage.jsx'));
const OpeningsPage = lazy(() => import('./pages/OpeningsPage.jsx'));
const AnalysisPage = lazy(() => import('./pages/AnalysisPage.jsx'));
const SettingsPage = lazy(() => import('./pages/SettingsPage.jsx'));
const ProfilePage = lazy(() => import('./pages/ProfilePage.jsx'));
const OpeningTrainerPage = lazy(() => import('./pages/OpeningTrainerPage.jsx'));
const PuzzlesPage = lazy(() => import('./pages/PuzzlesPage.jsx'));
const PuzzlePage = lazy(() => import('./pages/PuzzlePage.jsx'));
const AICoachPage = lazy(() => import('./pages/AICoachPage.jsx'));

// New Play & Review Pages
const PlayComputerPage = lazy(() => import('./pages/PlayComputerPage.jsx'));
const PlayHumanPage = lazy(() => import('./pages/PlayHumanPage.jsx'));
const ReviewPage = lazy(() => import('./pages/ReviewPage.jsx'));

// Loading fallback component
const PageLoader = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)' }}>
    <div className="loader">Loading...</div>
  </div>
);

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 40, color: 'white', background: '#900', minHeight: '100vh' }}>
          <h1>Something went wrong.</h1>
          <pre style={{ background: '#000', padding: 20, marginTop: 20, overflow: 'auto' }}>
            {this.state.error?.stack || this.state.error?.toString()}
          </pre>
          <button 
            onClick={() => window.location.reload()}
            style={{ marginTop: 20, padding: '10px 20px', background: 'white', color: 'black', borderRadius: 4 }}
          >
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <div className="app-shell">
          <Sidebar />
          <div className="app-main-area">
            <Header />
            <main className="app-content" id="main-content">
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/play" element={<PlayPage />} />
                  <Route path="/play/computer" element={<PlayComputerPage />} />
                  <Route path="/play/human" element={<PlayHumanPage />} />
                  <Route path="/openings" element={<OpeningsPage />} />
                  <Route path="/trainer" element={<OpeningTrainerPage />} />
                  <Route path="/puzzles" element={<PuzzlesPage />} />
                  <Route path="/puzzle" element={<PuzzlePage />} />
                  <Route path="/analysis" element={<AnalysisPage />} />
                  <Route path="/coach" element={<AICoachPage />} />
                  <Route path="/review" element={<ReviewPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </main>
          </div>
        </div>
      </AppProvider>
    </ErrorBoundary>
  );
}

function NotFound() {
  return (
    <div style={{ textAlign: 'center', padding: '80px 20px' }}>
      <div style={{ fontSize: 64, marginBottom: 16 }}>♟</div>
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>404 — Page Not Found</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>This square is off the board.</p>
      <a href="/" className="btn btn-primary">Back to Home</a>
    </div>
  );
}
