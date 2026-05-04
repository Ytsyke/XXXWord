import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Editor from './components/Editor';
import Login from './components/Login';
import Home from './components/Home';
import './App.css';
import React, { useState } from 'react';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));

  const handleLogin = (newToken) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
  };

  const isAuthenticated = !!token;

  return (
    <Router>
      <div className="App">
        {isAuthenticated && (
          <div className="word-top-bar" style={{
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            padding: '0 20px',
            background: '#2b579a',
            color: 'white',
            height: '40px'
          }}>
            <div style={{fontWeight: 'bold'}}>XXXWord Online</div>
            <button 
              onClick={handleLogout}
              style={{
                background: 'rgba(255,255,255,0.2)', 
                border: 'none', 
                color: 'white', 
                padding: '4px 12px', 
                cursor: 'pointer',
                borderRadius: '2px'
              }}
            >
              Выйти
            </button>
          </div>
        )}
        
        <Routes>
          <Route path="/login" element={!isAuthenticated ? <Login onLogin={handleLogin} /> : <Navigate to="/" />} />
          <Route path="/" element={isAuthenticated ? <Home token={token} /> : <Navigate to="/login" />} />
          <Route path="/document/:docId" element={isAuthenticated ? <Editor token={token} /> : <Navigate to="/login" />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;