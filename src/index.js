import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import Dashboard from './Dashboard';
import Terms from './Terms';
import Privacy from './Privacy';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));

function renderApp() {
  const path = window.location.pathname || '/';
  if (path.startsWith('/dashboard')) {
    root.render(
      <React.StrictMode>
        <Dashboard />
      </React.StrictMode>
    );
    return;
  }
  if (path === '/terms') {
    root.render(
      <React.StrictMode>
        <Terms />
      </React.StrictMode>
    );
    return;
  }
  if (path === '/privacy') {
    root.render(
      <React.StrictMode>
        <Privacy />
      </React.StrictMode>
    );
    return;
  }

  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

renderApp();

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
