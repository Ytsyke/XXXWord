import React, { useState } from 'react';
import axios from 'axios'; 
import { useNavigate } from 'react-router-dom';
import './Login.css';

// Принимаем onLogin как пропс
const Login = ({ onLogin }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const endpoint = isRegister ? 'register' : 'login';
    try {
      const { data } = await axios.post(`https://xxxword.onrender.com/api/auth/${endpoint}`, {
        username, password
      });

      if (!isRegister) {
        // ВЫЗЫВАЕМ ФУНКЦИЮ ИЗ App.jsx
        onLogin(data.token); 
        
        // Переходим на главную. Больше никакой перезагрузки!
        navigate('/'); 
      } else {
        alert('Успешно! Теперь войдите.');
        setIsRegister(false);
      }
    } catch (err) {
      alert(err.response?.data?.msg || 'Ошибка');
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h2>{isRegister ? 'Регистрация' : 'Вход в Word Cloud'}</h2>
        <form onSubmit={handleSubmit}>
          <input type="text" placeholder="Логин" onChange={(e) => setUsername(e.target.value)} required />
          <input type="password" placeholder="Пароль" onChange={(e) => setPassword(e.target.value)} required />
          <button type="submit">{isRegister ? 'Создать аккаунт' : 'Войти'}</button>
        </form>
        <p onClick={() => setIsRegister(!isRegister)} style={{cursor: 'pointer'}}>
          {isRegister ? 'Уже есть аккаунт? Войти' : 'Нет аккаунта? Зарегистрироваться'}
        </p>
      </div>
    </div>
  );
};

export default Login;