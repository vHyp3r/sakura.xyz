import React from 'react';
import { auth } from './firebase';

export default function Dashboard() {
  const [user, setUser] = React.useState(() => (auth ? auth.currentUser : null));

  React.useEffect(() => {
    if (!auth) return;
    const unsub = auth.onAuthStateChanged?.(u => setUser(u));
    return () => unsub && unsub();
  }, []);

  if (!user) {
    return (
      <div style={{ padding: 24 }}>
        <h2>Dashboard</h2>
        <p>You must be signed in to access the dashboard. Please sign in from the homepage.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <h2>Dashboard</h2>
      <p>Welcome, <b>{user.email}</b> — this is your Sakura control panel.</p>
      <div style={{ display: 'flex', gap: 12, marginTop: 12, marginBottom: 12 }}>
        <div style={{ flex: 1, background: '#1f1f23', padding: 12, borderRadius: 8 }}>
          <div style={{ fontSize: 12, color: '#9aa' }}>Uploads</div>
          <div style={{ fontSize: 20, fontWeight: 700 }}>12</div>
        </div>
        <div style={{ flex: 1, background: '#1f1f23', padding: 12, borderRadius: 8 }}>
          <div style={{ fontSize: 12, color: '#9aa' }}>Active Devices</div>
          <div style={{ fontSize: 20, fontWeight: 700 }}>3</div>
        </div>
        <div style={{ flex: 1, background: '#1f1f23', padding: 12, borderRadius: 8 }}>
          <div style={{ fontSize: 12, color: '#9aa' }}>Pending Tasks</div>
          <div style={{ fontSize: 20, fontWeight: 700 }}>0</div>
        </div>
      </div>
      <p>Use the links below to manage your uploads and preferences.</p>
      <p>
        <a href="/">Home</a> · <a href="/terms">Terms</a> · <a href="/privacy">Privacy</a>
      </p>
    </div>
  );
}
