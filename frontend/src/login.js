/**
 * Login Component
 * Handles user authentication for the messaging platform
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function Login() {
  // State variables for form inputs and error handling
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();

  /**
   * Navigates to the registration page
   */
  const navigateToRegister = () => {
    navigate('/register');
  };

  /**
   * Handles the login form submission
   * @param {Event} event - Form submission event
   */
  const handleLogin = async (event) => {
    event.preventDefault();
    try {
      // Send authentication request
      const response = await axios.post(
        'http://localhost:8000/token',
        new URLSearchParams({
          username: username,
          password: password,
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      const accessToken = response.data.access_token;
      const userId = response.data.user_id;

      // Store token, user ID and username in localStorage
      localStorage.setItem('token', accessToken);
      localStorage.setItem('userId', userId);
      localStorage.setItem('username', username);

      // Establish WebSocket connection
      const webSocket = new WebSocket(`ws://localhost:8000/ws/${username}`);
      webSocket.onopen = () => {
        console.log('WebSocket connection established');
      };
      webSocket.onclose = () => {
        console.log('WebSocket connection closed');
      };

      // Login successful, redirect to chat page
      navigate('/chat');
    } catch (error) {
      setErrorMessage('Invalid username or password');
    }
  };




  return (
    <div className="normal-container">
      <div className="chat-header">
      <h1>Login to Secure Messaging</h1>
      </div>
    <div className="message-header">
    {errorMessage && <p className="form-error">{errorMessage}</p>}
    <form onSubmit={handleLogin} className="form-container">
        <div className="form-group">
            <label>Username:</label>
            <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
            />
        </div>
        <div className="form-group">
            <label>Password:</label>
            <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
            />
        </div>
        <button type="submit" className="send-button">Login</button>
      </form>
    </div>
        <div className="user-info" style={{ justifyContent: 'right', marginRight: '40px'}}>
            <p>
                If you don't have an account, <span style={{ cursor: 'pointer', color: 'blue' }} onClick={navigateToRegister}>register here</span>.
            </p>
        </div>
    </div>

  );
}

export default Login;
