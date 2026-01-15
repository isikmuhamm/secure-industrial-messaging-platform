/**
 * SUGGESTED FILE RENAME: chat_backup.js
 * 
 * Chat Component (Backup/Alternative Version)
 * This file appears to be a backup or alternative implementation of the Chat component
 * Handles real-time messaging between users via WebSocket
 */
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaUser, FaSignOutAlt, FaComments, FaPaperPlane, FaGlobeAmericas } from 'react-icons/fa';
import './chat.css';

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
   */
  useEffect(() => {
    const accessToken = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    const currentUsername = localStorage.getItem('username');
    if (!token) {
      navigate('/'); // Eğer token yoksa login sayfasına yönlendir
    }

    // WebSocket bağlantısını aç
    socket.current = new WebSocket(`ws://localhost:8000/ws/${username}`);

    socket.current.onopen = () => {
      console.log('WebSocket bağlantısı kuruldu');
    };

    socket.current.onmessage = (event) => {
      const messageData = JSON.parse(event.data);
      setMessages((prevMessages) => [...prevMessages, messageData]);
    };

    socket.current.onerror = (error) => {
      console.error('WebSocket hatası:', error);
    };

    socket.current.onclose = () => {
      console.log('WebSocket bağlantısı kapandı');
    };

    const fetchData = async () => {
      try {
        const userResponse = await axios.get('http://localhost:8000/users/', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const filteredUsers = userResponse.data.filter(user => user.username !== username);
        setUsers(filteredUsers);

        const chatUserResponse = await axios.get(`http://localhost:8000/users/chat/?user_id=${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const filteredChatUsers = chatUserResponse.data.filter(user => user.username !== username);
        setChatUsers(filteredChatUsers);

        const onlineUserResponse = await axios.get('http://localhost:8000/online-users/', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setOnlineUsers(onlineUserResponse.data);
      } catch (err) {
        console.log('Error fetching data:', err.response ? err.response.data : err.message);
      }
    };

    fetchData();

    return () => {
      socket.current.close();
    };
  }, [navigate]);

  const fetchMessagesWithUser = async (recipient_id, username) => {
    const token = localStorage.getItem('token');
    try {
      setSelectedUser({ id: recipient_id, username: username });

      const response = await axios.get(`http://localhost:8000/messages/?user_id=${localStorage.getItem('userId')}&target_user_id=${recipient_id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setMessages(response.data.messages);
    } catch (err) {
      console.log('Error fetching messages with user:', err.response ? err.response.data : err.message);
    }
  };

  const sendMessage = async () => {
    if (!socket.current || socket.current.readyState !== WebSocket.OPEN) {
      console.error('WebSocket bağlantısı kapalı, mesaj gönderilemedi');
      return;
    }

    const senderId = localStorage.getItem('userId');
    const messageToSend = {
      sender_id: senderId,
      recipient_id: selectedUser.id,
      content: newMessage,
    };
    console.log('Mesaj gönderiliyor:', messageToSend);

    socket.current.send(JSON.stringify(messageToSend));

    setMessages((prevMessages) => [
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

  const username = localStorage.getItem('username');

  return (
    <div className="chat-container">
      <header className="chat-header">
        <h2>Chat</h2>
        <div className="user-info">
          {username && <p>{username}, hoş geldin!</p>}
          <button onClick={handleLogout} className="logout-button">
            <FaSignOutAlt className="icon" />
            Oturumu Kapat
          </button>
        </div>
      </header>
      
      <div className="chat-content">
        <div className="sidebar">
          <div className="users-list">
            <h3>Eski Mesajlar</h3>
            {chatUsers
              .sort((a, b) => {
                const aIsOnline = onlineUsers.some((onlineUser) => onlineUser.username === a.username);
                const bIsOnline = onlineUsers.some((onlineUser) => onlineUser.username === b.username);
                return bIsOnline - aIsOnline;
              })
              .map((user) => (
                <div
                  key={user.id}
                  onClick={() => fetchMessagesWithUser(user.id, user.username)}
                  className={`user-item ${onlineUsers.some((onlineUser) => onlineUser.id === user.id) ? 'online' : ''}`}
                >
                  <FaUser className="icon" />
                  {user.username}
                  {onlineUsers.some((onlineUser) => onlineUser.id === user.id) && (
                    <FaGlobeAmericas className="online-icon" />
                  )}
                </div>
              ))}

            <h3>Tüm Kullanıcılar</h3>
            {users
              .filter(user => !chatUsers.some(chatUser => chatUser.id === user.id))
              .sort((a, b) => {
                const aIsOnline = onlineUsers.some((onlineUser) => onlineUser.username === a.username);
                const bIsOnline = onlineUsers.some((onlineUser) => onlineUser.username === b.username);
                return bIsOnline - aIsOnline;
              })
              .map((user) => (
                <div
                  key={user.id}
                  onClick={() => fetchMessagesWithUser(user.id, user.username)}
                  className={`user-item ${onlineUsers.some((onlineUser) => onlineUser.username === user.username) ? 'online' : ''}`}
                >
                  <FaUser className="icon" />
                  {user.username}
                  {onlineUsers.some((onlineUser) => onlineUser.username === user.username) && (
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
                <h3>{selectedUser.username}'e Mesaj</h3>
              </div>
              <div className="message-list">
                {messages.length > 0 ? (
                  messages.map((message, index) => (
                    <div
                      key={`${message.id}-${index}`}
                      className={`message ${message.sender_id === parseInt(localStorage.getItem('userId'), 10) ? 'sent' : 'received'}`}
                    >
                      <span className="message-content">
                        {message.content}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="no-messages">Geçmiş mesaj yok</p>
                )}
              </div>
              <div className="message-input">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Mesajınızı yazın..."
                />
                <button onClick={sendMessage} className="send-button">
                  <FaPaperPlane className="icon" />
                  Gönder
                </button>
              </div>
            </>
          ) : (
            <div className="no-user-selected">
              <FaComments className="large-icon" />
              <p>Mesaj göndermek için kullanıcı seçin</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Chat;


/* -Her mesajın başında gönderen kişinin adını yazmak 
"Ben: mesaj" şeklinde göstermek istiyoruz. 
Ayrıca göndericisi oturum açan kişi olan mesajları sağa, 
selectedUser olan mesajları da sola yaslayabiliriz.  

-Son olarak tüm bu oluşturduğumuz 
bileşeni ekranın içinde kenarlarında 
boşluklar olan bir rounded rectangular
 kutu şeklinde yerleştirmek istiyorum. */