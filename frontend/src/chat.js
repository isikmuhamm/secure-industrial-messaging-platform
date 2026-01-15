/**
 * Chat Component
 * Handles real-time messaging between users via WebSocket
 * Manages user lists, message history, and live communication
 */
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaUser, FaSignOutAlt, FaComments, FaPaperPlane, FaGlobeAmericas } from 'react-icons/fa';
import './style.css';

function Chat() {
  // State variables for messages and user management
  const [messageList, setMessageList] = useState([]);
  const [userList, setUserList] = useState([]);
  const [chatUserList, setChatUserList] = useState([]);
  const [onlineUserList, setOnlineUserList] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const navigate = useNavigate();
  const webSocketRef = useRef(null);

  /**
   * Handles user logout
   * Clears local storage and closes WebSocket connection
   */
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('userId');
    if (webSocketRef.current) {
      webSocketRef.current.close();
    }
    navigate('/');
  };

  /**
   * Effect hook to initialize WebSocket connection and fetch user data
   * Runs on component mount and handles cleanup on unmount
   */
  useEffect(() => {
    const accessToken = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    const currentUsername = localStorage.getItem('username');
    if (!accessToken) {
      navigate('/');
    }

    // Establish WebSocket connection
    webSocketRef.current = new WebSocket(`ws://localhost:8000/ws/${currentUsername}`);

    webSocketRef.current.onopen = () => {
      console.log('WebSocket connection established');
    };

    webSocketRef.current.onmessage = (event) => {
      const incomingMessage = JSON.parse(event.data);
      setMessageList((prevMessages) => [...prevMessages, incomingMessage]);
    };

    webSocketRef.current.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    webSocketRef.current.onclose = () => {
      console.log('WebSocket connection closed');
    };

    /**
     * Fetches all required user data from the server
     */
    const fetchUserData = async () => {
      try {
        // Fetch all users
        const userResponse = await axios.get('http://localhost:8000/users/', {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        const filteredUsers = userResponse.data.filter(user => user.username !== currentUsername);
        setUserList(filteredUsers);

        // Fetch users with existing chat history
        const chatUserResponse = await axios.get(`http://localhost:8000/users/chat/?user_id=${userId}`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        const filteredChatUsers = chatUserResponse.data.filter(user => user.username !== currentUsername);
        setChatUserList(filteredChatUsers);

        // Fetch online users
        const onlineUserResponse = await axios.get('http://localhost:8000/online-users/', {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        setOnlineUserList(onlineUserResponse.data);
      } catch (error) {
        console.log('Error fetching data:', error.response ? error.response.data : error.message);
      }
    };

    fetchUserData();

    // Cleanup: close WebSocket on component unmount
    return () => {
      webSocketRef.current.close();
    };
  }, [navigate]);

  /**
   * Fetches message history with a specific user
   * @param {number} recipientId - The ID of the recipient user
   * @param {string} recipientUsername - The username of the recipient
   */
  const fetchMessagesWithUser = async (recipientId, recipientUsername) => {
    const accessToken = localStorage.getItem('token');
    try {
      setSelectedUser({ id: recipientId, username: recipientUsername });

      const response = await axios.get(`http://localhost:8000/messages/?user_id=${localStorage.getItem('userId')}&target_user_id=${recipientId}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      setMessageList(response.data.messages);
    } catch (error) {
      console.log('Error fetching messages with user:', error.response ? error.response.data : error.message);
    }
  };

  /**
   * Sends a new message via WebSocket
   * Validates connection state before sending
   */
  const sendMessage = async () => {
    if (!webSocketRef.current || webSocketRef.current.readyState !== WebSocket.OPEN) {
      console.error('WebSocket connection closed, message could not be sent');
      return;
    }

    const senderId = localStorage.getItem('userId');
    const messagePayload = {
      sender_id: senderId,
      recipient_id: selectedUser.id,
      content: newMessage,
    };
    console.log('Sending message:', messagePayload);

    webSocketRef.current.send(JSON.stringify(messagePayload));

    // Add message to local state immediately for instant feedback
    setMessageList((prevMessages) => [
      ...prevMessages,
      {
        id: Date.now(),
        sender_id: parseInt(senderId, 10),
        recipient_id: selectedUser.id,
        content: newMessage,
      },
    ]);

    setNewMessage('');
  };

  const currentUsername = localStorage.getItem('username');

  return (
    <div className="chat-container">
      <header className="chat-header">
        <h2>Secure Messaging</h2>
        <div className="user-info">
          {currentUsername && <p>Welcome, {currentUsername}!</p>}
          <button onClick={handleLogout} className="logout-button">
            <FaSignOutAlt className="icon" />
            Logout
          </button>
        </div>
      </header>
      
      <div className="chat-content">
        <div className="sidebar">
          <div className="users-list">
            <h3>Recent Messages</h3>
            {chatUserList
              .sort((a, b) => {
                const aIsOnline = onlineUserList.some((onlineUser) => onlineUser.username === a.username);
                const bIsOnline = onlineUserList.some((onlineUser) => onlineUser.username === b.username);
                return bIsOnline - aIsOnline;
              })
              .map((user) => (
                <div
                  key={user.id}
                  onClick={() => fetchMessagesWithUser(user.id, user.username)}
                  className={`user-item ${onlineUserList.some((onlineUser) => onlineUser.id === user.id) ? 'online' : ''}`}
                >
                  <FaUser className="icon" />
                  {user.username}
                  {onlineUserList.some((onlineUser) => onlineUser.id === user.id) && (
                    <FaGlobeAmericas className="online-icon" />
                  )}
                </div>
              ))}

            <h3>All Users</h3>
            {userList
              .filter(user => !chatUserList.some(chatUser => chatUser.id === user.id))
              .sort((a, b) => {
                const aIsOnline = onlineUserList.some((onlineUser) => onlineUser.username === a.username);
                const bIsOnline = onlineUserList.some((onlineUser) => onlineUser.username === b.username);
                return bIsOnline - aIsOnline;
              })
              .map((user) => (
                <div
                  key={user.id}
                  onClick={() => fetchMessagesWithUser(user.id, user.username)}
                  className={`user-item ${onlineUserList.some((onlineUser) => onlineUser.username === user.username) ? 'online' : ''}`}
                >
                  <FaUser className="icon" />
                  {user.username}
                  {onlineUserList.some((onlineUser) => onlineUser.username === user.username) && (
                    <FaGlobeAmericas className="online-icon" />
                  )}
                </div>
              ))}
          </div>
        </div>
        
        <div className="message-area">
          {selectedUser ? (
            <>
              <div className="message-header">
                <h3>Message to {selectedUser.username}</h3>
              </div>
              <div className="message-list">
                {messageList.length > 0 ? (
                  messageList.map((message, index) => (
                    <div
                      key={`${message.id}-${index}`}
                      className={`message ${message.sender_id === parseInt(localStorage.getItem('userId'), 10) ? 'sent' : 'received'}`}
                    >
                      <span className="message-content">
                        <strong>
                          {message.sender_id === parseInt(localStorage.getItem('userId'), 10) ? 'Me' : selectedUser.username}:
                        </strong> {message.content}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="no-messages">No message history</p>
                )}
              </div>
              <div className="message-input">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                />
                <button onClick={sendMessage} className="send-button">
                  <FaPaperPlane className="icon" />
                  Send
                </button>
              </div>
            </>
          ) : (
            <div className="no-user-selected">
              <FaComments className="large-icon" />
              <p>Select a user to start messaging!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Chat;