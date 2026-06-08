import React, { useState } from 'react';
import './App.css';
import { auth, firebaseAuthStatus } from './firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail
} from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';

const SAKURA_ICON_PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAoAAAAKACAIAAACP/WnKAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAlRJREFUeNrs2rENACEIBNE67z/yN9BGNshiVITEE1WJnXO/zrjeu7PwgAAAAAAAAAAAAAAAAAAD8ZsmfMt+Z8K2bp6X7XXvLYux6i6ZPLEw+XoLpovIYMvV6/h+9y+jw+dgRQBX9MsyeX1mNd3raYuCynj+1gOXd3mUvFiUQc4aGs+ytxw1pI6m8/wcB5l2fdjqEmQ3CZXBQJCsFFwVsWBauk/Pf9OMAECBABAgQAECECAAAQIQIEECBAAAQIQIECAAAQP+uAQPmxnAArPYpPAfsmtP2AAAAAElFTkSuQmCC';

export default function App() {
  const [tab, setTab] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [user, setUser] = useState(() => auth !== null ? auth.currentUser : null);
  const [loading, setLoading] = useState(false);

  // Forgot password states
  const [forgot, setForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotMsg, setForgotMsg] = useState("");

  const getAuthUnavailableMessage = () => firebaseAuthStatus.message || 'Authentication service is unavailable.';

  React.useEffect(() => {
    if (!auth) return;
    const unsub = onAuthStateChanged(auth, u => setUser(u));
    return () => unsub();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!auth) { setError(getAuthUnavailableMessage()); return; }
    setLoading(true);
    try {
      if (tab === 'signin') {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      setEmail("");
      setPassword("");
    } catch (err) {
      setError(err.message.replace(/^Firebase: /, ''));
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    if (!auth) return;
    await signOut(auth);
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setForgotMsg("");
    setError("");
    if (!auth) { setError(getAuthUnavailableMessage()); return; }
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, forgotEmail);
      setForgotMsg("Password reset email sent! Check your inbox.");
      setForgotEmail("");
    } catch (err) {
      setForgotMsg("");
      setError(err.message.replace(/^Firebase: /, ''));
    }
    setLoading(false);
  };

  return (
    <div className="main-bg">
      <div className="page-center">
        <img src={SAKURA_ICON_PNG} alt="Sakura Icon" className="sakura-icon" />
        <h1 className="title">Welcome to <b>sakura.xyz</b></h1>
        <h2 className="subtitle">Minecraft Bedrock & Java Hub</h2>
        {user ? (
          <div className="form-card" style={{ textAlign: 'center' }}>
            <div style={{ marginBottom: 20 }}>Signed in as <b>{user.email}</b></div>
            <button className="main-btn" onClick={handleLogout} style={{ marginBottom: 0 }}>Logout</button>
          </div>
        ) : forgot ? (
          <div className="form-card">
            <form autoComplete="off" onSubmit={handleForgotPassword}>
              <label className="input-label">Reset password for:</label>
              <input
                className="input"
                type="email"
                placeholder="your@email.com"
                value={forgotEmail}
                onChange={e => setForgotEmail(e.target.value)}
                required
                disabled={loading}
                style={{ marginBottom: 18 }}
              />
              {forgotMsg && <div style={{ color: '#7afa99', marginBottom: 8 }}>{forgotMsg}</div>}
              {error && <div style={{ color: '#fa7897', marginBottom: 8 }}>{error}</div>}
              <button type="submit" className="main-btn" disabled={loading}>
                {loading ? "Sending..." : "Send Reset Email"}
              </button>
            </form>
            <button
              className="footer-link"
              type="button"
              onClick={() => {
                setForgot(false);
                setForgotEmail("");
                setError("");
                setForgotMsg("");
              }}
              style={{ marginTop: 16 }}
            >
              Back to Sign In
            </button>
          </div>
        ) : (
          <>
            <div className="tab-row">
              <button onClick={() => { setTab('signin'); setError(""); setForgot(false); }} className={tab === 'signin' ? 'tab active' : 'tab'}>
                Sign In
              </button>
              <button onClick={() => { setTab('signup'); setError(""); setForgot(false); }} className={tab === 'signup' ? 'tab active' : 'tab'}>
                Sign Up
              </button>
            </div>
            <div className="form-card">
              <form autoComplete="off" onSubmit={handleSubmit}>
                <label className="input-label">Email</label>
                <input
                  className="input"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
                <label className="input-label">Password</label>
                <input
                  className="input"
                  type="password"
                  placeholder="Password"
                  value={password}
                  minLength={6}
                  onChange={e => setPassword(e.target.value)}
                  required
                  disabled={loading}
                />
                {error && <div style={{ color: '#fa7897', margin: '5px 0', fontSize: '1em' }}>{error}</div>}
                <button type="submit" className="main-btn" disabled={loading}>
                  {loading ? (tab === 'signin' ? 'Signing In...' : 'Signing Up...') : (tab === 'signin' ? 'Sign In' : 'Sign Up')}
                </button>
              </form>
              {tab === 'signin' && (
                <button
                  type="button"
                  className="footer-link"
                  style={{ marginTop: 12, fontSize: '1em', border: 'none', background: 'none', padding: 0 }}
                  onClick={() => {
                    setForgot(true);
                    setEmail("");
                    setPassword("");
                    setError("");
                  }}
                >
                  Forgot password?
                </button>
              )}
            </div>
          </>
        )}
        <div className="footer-text">
          By continuing, you agree to our
          <a href="/terms" className="footer-link"> Terms of Service </a>
          and
          <a href="/privacy" className="footer-link"> Privacy Policy</a>
        </div>
      </div>
    </div>
  );
}
