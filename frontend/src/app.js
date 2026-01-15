/**
 * Main Application Component
 * Entry point for the Secure Industrial Messaging Platform
 * Handles routing configuration for all application views
 */
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './home';
import Login from './login';
import Chat from './chat';
import Register from './register';

/**
 * App Component
 * Configures client-side routing for the messaging platform
 * @returns {JSX.Element} Router with configured routes
 */
function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/chat" element={<Chat />} />
                <Route path="/register" element={<Register />} />
            </Routes>
        </Router>
    );
}

export default App;
