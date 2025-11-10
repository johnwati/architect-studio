import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './src/presentation/components/App';
import './src/presentation/styles/index.css';

console.log('🚀 Application starting...');
console.log('Root element:', document.getElementById('root'));

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('❌ Root element not found!');
  throw new Error('Root element (#root) not found in DOM');
}

try {
  const root = ReactDOM.createRoot(rootElement);
  console.log('✅ React root created');
  
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  
  console.log('✅ App rendered successfully');
} catch (error) {
  console.error('❌ Error rendering app:', error);
  rootElement.innerHTML = `
    <div style="padding: 20px; font-family: sans-serif;">
      <h1 style="color: red;">⚠️ Application Error</h1>
      <p><strong>Error:</strong> ${error instanceof Error ? error.message : 'Unknown error'}</p>
      <p>Please check the browser console for more details.</p>
    </div>
  `;
}
