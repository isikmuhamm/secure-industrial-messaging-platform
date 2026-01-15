/**
 * Application Entry Point
 * Renders the main App component to the DOM
 */
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './app';
import './index.css';

// Create root element and render the application
const rootElement = document.getElementById('root');
const root = ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
