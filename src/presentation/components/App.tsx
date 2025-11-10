import { Component, ErrorInfo, ReactNode, useEffect, useState } from 'react';
import { initDatabase } from '../../infrastructure/database/sqlite';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import Login from './Login';
import SDDApp from './SDDApp';
import Signup from './Signup';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      console.error('ErrorBoundary caught error:', this.state.error);
      return (
        <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', fontFamily: 'sans-serif' }}>
          <div style={{ maxWidth: '42rem', width: '100%', backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', padding: '2rem' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#b91c1c', marginBottom: '1rem' }}>⚠️ Application Error</h1>
            <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '0.5rem', padding: '1rem', marginBottom: '1rem' }}>
              <p style={{ color: '#991b1b', fontWeight: '600', marginBottom: '0.5rem' }}>Error Details:</p>
              <pre style={{ fontSize: '0.75rem', color: '#7f1d1d', overflow: 'auto', whiteSpace: 'pre-wrap' }}>
                {this.state.error?.message || 'Unknown error'}
                {this.state.error?.stack && `\n\n${this.state.error.stack}`}
              </pre>
            </div>
            <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '0.5rem', padding: '1rem', marginBottom: '1rem' }}>
              <p style={{ color: '#1e40af', fontWeight: '600', marginBottom: '0.5rem' }}>Common Solutions:</p>
              <ul style={{ listStyle: 'disc', paddingLeft: '1.5rem', fontSize: '0.875rem', color: '#1e3a8a' }}>
                <li>Check browser console (F12) for more details</li>
                <li>Verify your API key is set in .env file</li>
                <li>Ensure you have internet connection</li>
                <li>Try hard refreshing the page (Cmd+Shift+R or Ctrl+Shift+R)</li>
              </ul>
            </div>
            <button
              onClick={() => window.location.reload()}
              style={{ width: '100%', backgroundColor: '#b91c1c', color: 'white', padding: '0.5rem 1rem', borderRadius: '0.5rem', border: 'none', cursor: 'pointer', fontSize: '1rem', fontWeight: '600' }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#991b1b'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#b91c1c'}
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function AppContent() {
  const { isAuthenticated, loading } = useAuth();
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

  // Check URL hash for auth mode
  useEffect(() => {
    const hash = window.location.hash;
    if (hash === '#signup') {
      setAuthMode('signup');
    } else if (hash === '#login') {
      setAuthMode('login');
    }
  }, []);

  // Update URL hash when mode changes
  useEffect(() => {
    if (!isAuthenticated) {
      window.location.hash = authMode;
    }
  }, [authMode, isAuthenticated]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-purple-200">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    if (authMode === 'signup') {
      return <Signup onSwitchToLogin={() => setAuthMode('login')} />;
    }
    return <Login onSwitchToSignup={() => setAuthMode('signup')} />;
  }

  return <SDDApp />;
}

export default function App() {
  console.log('📱 App component rendering...');
  
  // Initialize SQLite database early (default storage)
  useEffect(() => {
    (async () => {
      try {
        await initDatabase();
        console.log('✅ SQLite database ready (default storage)');
      } catch (error) {
        console.error('❌ Failed to initialize SQLite database:', error);
      }
    })();
  }, []);
  
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ErrorBoundary>
  );
}

