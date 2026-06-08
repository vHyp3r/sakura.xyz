import React from 'react';
import { auth, db } from './firebase';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';

export default function Dashboard() {
  const [user, setUser] = React.useState(() => (auth ? auth.currentUser : null));
  const [tab, setTab] = React.useState('overview');
  const [uploads, setUploads] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    if (!auth) return;
    const unsub = auth.onAuthStateChanged?.(u => setUser(u));
    return () => unsub && unsub();
  }, []);

  React.useEffect(() => {
    if (!user || !db) return;
    setLoading(true);
    const q = query(
      collection(db, 'uploads'),
      where('owner', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(q, (snap) => {
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setUploads(items);
      setLoading(false);
    }, (err) => {
      setError(err.message || String(err));
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

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
      <p>Welcome, <b>{user.email}</b></p>

      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <button onClick={() => setTab('overview')} className={tab === 'overview' ? 'tab active' : 'tab'}>Overview</button>
        <button onClick={() => setTab('uploads')} className={tab === 'uploads' ? 'tab active' : 'tab'}>Uploads</button>
        <button onClick={() => setTab('settings')} className={tab === 'settings' ? 'tab active' : 'tab'}>Settings</button>
      </div>

      <div style={{ marginTop: 16 }}>
        {tab === 'overview' && (
          <>
            <div style={{ display: 'flex', gap: 12, marginTop: 12, marginBottom: 12 }}>
              <div style={{ flex: 1, background: '#1f1f23', padding: 12, borderRadius: 8 }}>
                <div style={{ fontSize: 12, color: '#9aa' }}>Uploads</div>
                <div style={{ fontSize: 20, fontWeight: 700 }}>{uploads.length}</div>
              </div>
              <div style={{ flex: 1, background: '#1f1f23', padding: 12, borderRadius: 8 }}>
                <div style={{ fontSize: 12, color: '#9aa' }}>Active Devices</div>
                <div style={{ fontSize: 20, fontWeight: 700 }}>—</div>
              </div>
              <div style={{ flex: 1, background: '#1f1f23', padding: 12, borderRadius: 8 }}>
                <div style={{ fontSize: 12, color: '#9aa' }}>Pending Tasks</div>
                <div style={{ fontSize: 20, fontWeight: 700 }}>—</div>
              </div>
            </div>
            <p>Quick summary of your account and recent activity.</p>
          </>
        )}

        {tab === 'uploads' && (
          <div>
            <h3>Your uploads</h3>
            {loading && <div>Loading uploads…</div>}
            {error && <div style={{ color: '#fa7897' }}>{error}</div>}
            {!db && <div style={{ color: '#fa7897' }}>No database configured — uploads are unavailable.</div>}
            {!loading && uploads.length === 0 && <div>No uploads yet.</div>}
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {uploads.map(u => (
                <li key={u.id} style={{ padding: 12, borderBottom: '1px solid #222' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontWeight: 700 }}>{u.name || u.filename || 'Untitled'}</div>
                      <div style={{ fontSize: 12, color: '#9aa' }}>{u.description || ''}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 12 }}>{u.createdAt ? new Date(u.createdAt.seconds * 1000).toLocaleString() : ''}</div>
                      <div>
                        {(u.tags || []).map(tag => (
                          <span key={tag} style={{ marginLeft: 6, padding: '2px 6px', background: '#262630', borderRadius: 6, fontSize: 12 }}>{tag}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {tab === 'settings' && (
          <div>
            <h3>Account Settings</h3>
            <p>Manage your account preferences and connected devices here.</p>
            <p>
              <a href="/">Home</a> · <a href="/terms">Terms</a> · <a href="/privacy">Privacy</a>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
