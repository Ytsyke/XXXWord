import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Editor from './components/Editor';
import Login from './components/Login';
import Home from './components/Home'; // Нужно будет создать этот компонент
import './App.css';

function App() {
  // Проверка авторизации
  const isAuthenticated = !!localStorage.getItem('token');

  return (
    <Router>
      <div className="App">
        {/* Показываем синюю шапку Word только если юзер вошел */}
        {isAuthenticated && (
          <div className="word-top-bar">
            <div className="word-logo"></div>
            {/* Сюда можно будет прокинуть стейт с названием файла */}
            <span className="document-name">Документ Word</span>
          </div>
        )}
        
        <Routes>
          {/* Страница логина */}
          <Route path="/login" element={<Login />} />

          {/* Главная страница со списком документов и кнопкой "Создать" */}
          <Route 
            path="/" 
            element={isAuthenticated ? <Home /> : <Navigate to="/login" />} 
          />

          {/* Страница редактора с динамическим ID документа */}
          <Route 
            path="/document/:docId" 
            element={isAuthenticated ? <Editor /> : <Navigate to="/login" />} 
          />

          {/* Редирект со старого пути /editor на главную или в конкретный док */}
          <Route path="/editor" element={<Navigate to="/" />} />
          
          {/* Обработка несуществующих страниц */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;