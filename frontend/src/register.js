/**
 * Register Component
 * Handles new user registration for the messaging platform
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './style.css';

function Register() {
    // State variables for form inputs and error handling
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const navigate = useNavigate();

    /**
     * Handles the registration form submission
     * @param {Event} event - Form submission event
     */
    const handleRegister = async (event) => {
        event.preventDefault();
        setErrorMessage('');

        const response = await fetch('http://localhost:8000/users/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
        });

        if (response.ok) {
            navigate('/login');
        } else {
            const errorData = await response.json();
            setErrorMessage(errorData.detail);
        }
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
                <h1>Register for Secure Messaging</h1>
            </div>
            <div className="message-header">
                <form onSubmit={handleRegister} className="form-container">
                    <div className="form-group">
                        <label>Username:</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>
                    {errorMessage && <p className="form-error">{errorMessage}</p>}
                    <div className="form-group">
                        <label>Password:</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit" className="logout-button">Register</button>
                </form>
            </div>

            <div className="user-info" style={{ justifyContent: 'right', marginRight: '40px'}}>
            <p>
                Already have an account? <span style={{ cursor: 'pointer', color: 'blue' }} onClick={navigateToLogin}>Login here</span>.
            </p>
            </div>
        </div>
    );
}

export default Register;
