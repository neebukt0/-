import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { logoutUser } from '../features/auth/authSlice';
import { api } from '../api/axios';

export function DashboardPage() {
  const { user, accessToken } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const [protectedData, setProtectedData] = useState('');

  // Запрос защищенных данных с ручной передачей Access Token в заголовке
  const handleFetchProtectedData = async () => {
    try {
      const response = await api.get('/protected-data', {
        headers: {
          Authorization: `Bearer ${accessToken}`, // ПЕРЕДАЧА ACCESS TOKEN В БЕЗОПАСНОМ ЗАГОЛОВКЕ
        },
      });
      setProtectedData(response.data.message);
    } catch (e) {
      setProtectedData('Ошибка получения данных (токен недействителен)');
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Защищенная панель управления</h1>
      <p>Вы вошли как: <strong>{user?.email}</strong> (ID: {user?.userId})</p>
      
      <button onClick={handleFetchProtectedData}>Запросить защищенные данные с сервера</button>
      {protectedData && <p style={{ color: 'green' }}>{protectedData}</p>}

      <br /><br />
      <button onClick={() => dispatch(logoutUser())} style={{ background: 'red', color: 'white' }}>Выйти</button>
    </div>
  );
}