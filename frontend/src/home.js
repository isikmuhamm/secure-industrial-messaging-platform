/**
 * Home Component
 * Landing page for the Secure Industrial Messaging Platform
 * Provides navigation to login and registration pages
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import './style.css';

const Home = () => {
    const navigate = useNavigate();

    /**
     * Navigates to the registration page
     */
    const navigateToRegister = () => {
        navigate('/register');
    };

    /**
     * Navigates to the login page
     */
    const navigateToLogin = () => {
        navigate('/login');
    };

    return (
        <div className="normal-container">
            <div className="chat-header">
                <h1>Secure Industrial Messaging</h1>
            </div>
            <div className="message-header">
                <h1>Start secure communication today!</h1>
                <div className="user-info" style={{ alignItems: 'center', marginBottom: '40px'}}>
                <button onClick={navigateToLogin} className="send-button" >Login</button>
                <button onClick={navigateToRegister} className="logout-button">Register</button>
                </div>
            </div>
        </div>
    );
};

export default Home;
