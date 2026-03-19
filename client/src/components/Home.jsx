import React from 'react';
import { useNavigate } from 'react-router-dom';
import { nanoid } from 'nanoid';
// import '../Home.css';

const Home = () => {
  const navigate = useNavigate();

  const createNewDocument = () => {
    const id = nanoid(10); // Генерируем ID типа "abc-123-xyz"
    navigate(`/document/${id}`);
  };

  return (
    <div className="home-screen" style={{ padding: '50px', textAlign: 'center' }}>
      <h1>Word Online</h1>
      <div 
        onClick={createNewDocument} 
        style={{ 
          width: '150px', height: '200px', border: '1px solid #ccc', 
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', margin: '20px auto', background: 'white' 
        }}
      >
        <span style={{ fontSize: '40px' }}>+</span>
      </div>
      <p>Создать пустой документ</p>
    </div>
  );
};

export default Home;