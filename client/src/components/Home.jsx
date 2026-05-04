import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { nanoid } from 'nanoid';
import axios from 'axios';

const Home = ({ token }) => {
  const navigate = useNavigate();
  const [docs, setDocs] = useState([]);

  useEffect(() => {
    axios.get('https://xxxword.onrender.com/api/auth/documents', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => setDocs(res.data))
      .catch(err => console.error("Ошибка загрузки списка:", err));
  }, [token]);

  const createNewDocument = () => {
    const id = nanoid(10);
    navigate(`/document/${id}`);
  };

  return (
    <div className="home-screen" style={{ padding: '50px', textAlign: 'center' }}>
      <h1>Ваши документы</h1>
      <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
        <div onClick={createNewDocument} style={{ 
          width: '150px', height: '200px', border: '2px dashed #ccc', 
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', background: 'white', borderRadius: '8px'
        }}>
          <span style={{ fontSize: '50px', color: '#2b579a' }}>+</span>
          <p style={{color: '#666'}}>Создать новый</p>
        </div>

        {docs.map(doc => (
          <div key={doc._id} onClick={() => navigate(`/document/${doc._id}`)} style={{ 
            width: '150px', height: '200px', border: '1px solid #ddd', 
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', background: 'white', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
          }}>
            <div style={{fontSize: '40px'}}>📄</div>
            <p style={{fontSize: '12px', overflow: 'hidden', padding: '0 10px'}}>{doc._id}</p>
            <p style={{ fontSize: '11px', color: '#2b579a' }}>{doc.isOwner ? 'Ваш документ' : 'Вам открыт доступ'}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Home;