import React, { useState } from 'react';
import VisitForm from './components/VisitForm';
import './styles/App.css';

function App() {
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  const handleSuccess = (msg) => {
    setMessage(msg);
    setMessageType('success');
    setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, 3000);
  };

  const handleError = (msg) => {
    setMessage(msg);
    setMessageType('error');
    setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, 3000);
  };

  return (
    <div className="app-container">
      <div className="background-gradient"></div>
      
      <div className="content-wrapper">
        <header className="app-header">
          <h1 className="app-title">🔮 타로 방문 체크인</h1>
          <p className="app-subtitle">전화번호를 입력하시면 자동으로 방문 기록이 저장됩니다</p>
        </header>

        {message && (
          <div className={`message-box ${messageType}`}>
            <span className="message-icon">{messageType === 'success' ? '✅' : '❌'}</span>
            <span className="message-text">{message}</span>
          </div>
        )}

        <main className="main-content">
          <VisitForm 
            onSuccess={handleSuccess} 
            onError={handleError} 
          />
        </main>

        <footer className="app-footer">
          <p>© 2026 Tarot Visit Tracker</p>
        </footer>
      </div>
    </div>
  );
}

export default App;