import React from 'react';
import { auth, db, storage } from './firebase';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref as storageRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

export default function Dashboard() {
  const [user, setUser] = React.useState(() => (auth ? auth.currentUser : null));
  const [tab, setTab] = React.useState('overview');
  const [uploads, setUploads] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [file, setFile] = React.useState(null);
  const [name, setName] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [tags, setTags] = React.useState('');
  const [uploading, setUploading] = React.useState(false);
  const [uploadProgress, setUploadProgress] = React.useState(0);

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

            <div style={{ margin: '12px 0', padding: 12, border: '1px solid #222', borderRadius: 8 }}>
              <div style={{ marginBottom: 8 }}>
                <label style={{ display: 'block', marginBottom: 6 }}>File</label>
                <input type="file" onChange={e => setFile(e.target.files?.[0] || null)} />
              </div>
              <div style={{ marginBottom: 8 }}>
                <label style={{ display: 'block', marginBottom: 6 }}>Name</label>
                <input value={name} onChange={e => setName(e.target.value)} className="input" />
              </div>
              <div style={{ marginBottom: 8 }}>
                <label style={{ display: 'block', marginBottom: 6 }}>Description</label>
                <input value={description} onChange={e => setDescription(e.target.value)} className="input" />
              </div>
              <div style={{ marginBottom: 8 }}>
                <label style={{ display: 'block', marginBottom: 6 }}>Tags (comma separated)</label>
                <input value={tags} onChange={e => setTags(e.target.value)} className="input" />
              </div>
              <div>
                <button className="main-btn" disabled={!file || uploading} onClick={async () => {
                  if (!file || !db || !storage || !user) return;
                  setUploading(true);
                  setUploadProgress(0);
                  try {
                    const path = `uploads/${user.uid}/${Date.now()}_${file.name}`;
                    const sRef = storageRef(storage, path);
                    const uploadTask = uploadBytesResumable(sRef, file);
                    uploadTask.on('state_changed', (snapshot) => {
                      const prog = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
                      setUploadProgress(prog);
                    }, (err) => {
                      setError(err.message || String(err));
                      setUploading(false);
                    }, async () => {
                      const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                      await addDoc(collection(db, 'uploads'), {
                        owner: user.uid,
                        name: name || file.name,
                        filename: file.name,
                        storagePath: path,
                        downloadURL,
                        description,
                        tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [],
                        createdAt: serverTimestamp(),
                      });
                      setFile(null);
                      setName('');
                      setDescription('');
                      setTags('');
                      setUploadProgress(0);
                      setUploading(false);
                    });
                  } catch (err) {
                    setError(err.message || String(err));
                    setUploading(false);
                  }
                }}>{uploading ? `Uploading ${uploadProgress}%` : 'Upload'}</button>
                {uploadProgress > 0 && <div style={{ marginTop: 8 }}>Progress: {uploadProgress}%</div>}
              </div>
            </div>

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
                      <div style={{ fontSize: 12 }}>{u.createdAt ? (u.createdAt.seconds ? new Date(u.createdAt.seconds * 1000).toLocaleString() : new Date(u.createdAt).toLocaleString()) : ''}</div>
                      <div>
                        {(u.tags || []).map(tag => (
                          <span key={tag} style={{ marginLeft: 6, padding: '2px 6px', background: '#262630', borderRadius: 6, fontSize: 12 }}>{tag}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                  {u.downloadURL && <div style={{ marginTop: 8 }}><a href={u.downloadURL} target="_blank" rel="noreferrer">Download</a></div>}
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
