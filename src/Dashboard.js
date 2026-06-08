import React from 'react';
import { auth } from './firebase';

export default function Dashboard() {
  const [user, setUser] = React.useState(() => auth ? auth.currentUser : null);

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
      <p>Welcome, <b>{user.email}</b> — this is a minimal dashboard placeholder.</p>
      <p>Expand this page with your admin widgets, stats, and links.</p>
    </div>
  );
}
