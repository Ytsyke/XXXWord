import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Editor from './components/Editor';
import Login from './components/Login';
import Home from './components/Home';
import './App.css';
import React, { useState } from 'react';

function App() {
  // Используем useState, чтобы компонент перерисовывался при входе
  const [token, setToken] = useState(localStorage.getItem('token'));

  // Функция для входа, которую мы прокинем в компонент Login
  const handleLogin = (newToken) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
  };

  const isAuthenticated = !!token;

  return (
    <Router basename="/XXXWord">
      <div className="App">
        {/* Шапка показывается сразу, как только стейт обновился */}
        {isAuthenticated && (
          <div className="word-top-bar">
            <div className="word-logo"></div>
            <span className="document-name">Документ Word</span>
          </div>
        )}
        
        <Routes>
          {/* Передаем функцию handleLogin в компонент Login */}
          <Route path="/login" element={<Login onLogin={handleLogin} />} />

          <Route 
            path="/" 
            element={isAuthenticated ? <Home /> : <Navigate to="/login" />} 
          />

          <Route 
            path="/document/:docId" 
            element={isAuthenticated ? <Editor /> : <Navigate to="/login" />} 
          />

          <Route path="/editor" element={<Navigate to="/" />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;