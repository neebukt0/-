import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser } from '../features/auth/authSlice';
import { Link, useNavigate } from 'react-router-dom';

export function LoginPage() {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [clientError, setClientError] = useState('');
  
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { error } = useSelector((state) => state.auth);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setClientError('');

    if (!login.trim() || !password) {
      setClientError('Пожалуйста, заполните все поля');
      return;
    }

    setLoading(true);
    // Передаем поле login (оно может быть как email, так и username)
    const result = await dispatch(loginUser({ login, password }));
    setLoading(false);

    if (loginUser.fulfilled.match(result)) {
      navigate('/');
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '50px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px', backgroundColor: '#f9f9f9' }}>
      <h2 style={{ textAlign: 'center', marginBottom: 20 }}>Вход в систему</h2>
      
      {(clientError || error) && (
        <div style={{ color: 'red', marginBottom: 15, padding: 10, backgroundColor: '#ffe6e6', borderRadius: '4px', fontSize: '14px' }}>
          {clientError || error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 15 }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: 5 }}>Email или Username</label>
          <input 
            placeholder="Введите email или username" 
            value={login} 
            onChange={(e) => setLogin(e.target.value)} 
            style={{ display: 'block', width: '100%', padding: 10, boxSizing: 'border-box', border: '1px solid #ccc', borderRadius: '4px' }} 
          />
        </div>

        <div style={{ marginBottom: 10 }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: 5 }}>Пароль</label>
          <div style={{ position: 'relative' }}>
            <input 
              placeholder="Введите пароль" 
              type={showPassword ? 'text' : 'password'} 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              style={{ display: 'block', width: '100%', padding: 10, paddingRight: '50px', boxSizing: 'border-box', border: '1px solid #ccc', borderRadius: '4px' }} 
            />
            <button 
              type="button" 
              onClick={() => setShowPassword(!showPassword)}
              style={{ position: 'absolute', right: 8, top: 10, background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', color: '#007bff' }}
            >
              {showPassword ? 'Скрыть' : 'Показать'}
            </button>
          </div>
        </div>

        <div style={{ textAlign: 'right', marginBottom: 15 }}>
          <Link to="/forgot-password" style={{ fontSize: '12px', color: '#007bff', textDecoration: 'none' }}>Забыли пароль?</Link>
        </div>

        <button 
          type="submit" 
          disabled={loading}
          style={{ width: '100%', padding: 12, backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: loading ? 'not-allowed' : 'pointer' }}
        >
          {loading ? 'Вход...' : 'Войти'}
        </button>
      </form>

      <p style={{ marginTop: 20, textAlign: 'center', fontSize: '14px' }}>
        Нет аккаунта? <Link to="/register" style={{ color: '#007bff' }}>Зарегистрироваться</Link>
      </p>
    </div>
  );
}
