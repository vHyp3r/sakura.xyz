import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import Dashboard from './Dashboard';
import Terms from './Terms';
import Privacy from './Privacy';
import reportWebVitals from './reportWebVitals';
import { ThemeProvider } from './theme';

const root = ReactDOM.createRoot(document.getElementById('root'));

function renderApp() {
  const path = window.location.pathname || '/';
  const hash = window.location.hash || '';
  // Support both normal path routing and hash-based routing (e.g. gh-pages)
  const effective = hash.startsWith('#/') ? hash.slice(1) : path;
  if (effective.startsWith('/dashboard')) {
    root.render(
      <React.StrictMode>
        <ThemeProvider>
          <Dashboard />
        </ThemeProvider>
      </React.StrictMode>
    );
    return;
  }
  if (effective === '/terms') {
    root.render(
      <React.StrictMode>
        <ThemeProvider>
          <Terms />
        </ThemeProvider>
      </React.StrictMode>
    );
    return;
  }
  if (effective === '/privacy') {
    root.render(
      <React.StrictMode>
        <ThemeProvider>
          <Privacy />
        </ThemeProvider>
      </React.StrictMode>
    );
    return;
  }

  root.render(
    <React.StrictMode>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </React.StrictMode>
  );
}

renderApp();

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
