import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { db, doc, getDocFromServer } from './firebase';

// Global error handler
window.onerror = function(message, source, lineno, colno, error) {
  document.body.innerHTML = `<div style="color:red; padding: 20px; background: white; font-family: monospace;"><b>Error:</b> ${message}<br/>${source}:${lineno}:${colno}<br/>${error?.stack}</div>`;
};
window.onunhandledrejection = function(event) {
  document.body.innerHTML = `<div style="color:red; padding: 20px; background: white; font-family: monospace;"><b>Unhandled Rejection:</b> ${event.reason?.message || event.reason}<br/>${event.reason?.stack}</div>`;
};

// CRITICAL: Connection test as per guidelines
async function testConnection() {
  try {
    // Minimal check to verify connection
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log("Firestore connection verified.");
  } catch (error) {
    if (error instanceof Error && error.message.includes('offline')) {
      console.error("Firestore is offline. Check Firebase configuration.");
    }
  }
}
testConnection();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
