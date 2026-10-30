import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { forgotPassword, resetPassword } from '../features/auth/authSlice';
import { Link, useNavigate } from 'react-router-dom';

export function ForgotPasswordPage() {
  const [step, setStep] = useState(1); // 1 - запрос email, 2 - ввод токена и нового пароля
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { error, message } = useSelector((state) => state.auth);

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    const result = await dispatch(forgotPassword(email));
    setLoading(false);

    if (forgotPassword.fulfilled.match(result)) {
      setStep(2);
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    if (!token.trim() || !newPassword) return;

    setLoading(true);
    const result = await dispatch(resetPassword({ email, token, newPassword }));
    setLoading(false);

    if (resetPassword.fulfilled.match(result)) {
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '50px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px', backgroundColor: '#f9f9f9' }}>
      <h2 style={{ textAlign: 'center', marginBottom: 20 }}>Восстановление пароля</h2>

      {error && <div style={{ color: 'red', marginBottom: 15, padding: 10, backgroundColor: '#ffe6e6', borderRadius: '4px', fontSize: '14px' }}>{error}</div>}
      {message && <div style={{ color: 'green', marginBottom: 15, padding: 10, backgroundColor: '#e6ffe6', borderRadius: '4px', fontSize: '14px' }}>{message}</div>}

      {step === 1 ? (
        <form onSubmit={handleRequestSubmit}>
          <div style={{ marginBottom: 15 }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: 5 }}>Email</label>
            <input 
              type="email"
              placeholder="Введите ваш email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              style={{ display: 'block', width: '100%', padding: 10, boxSizing: 'border-box', border: '1px solid #ccc', borderRadius: '4px' }} 
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            style={{ width: '100%', padding: 12, backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: loading ? 'not-allowed' : 'pointer' }}
          >
            {loading ? 'Отправка...' : 'Отправить инструкции'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleResetSubmit}>
          <div style={{ marginBottom: 15 }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: 5 }}>Токен из консоли сервера</label>
            <input 
              placeholder="Введите токен" 
              value={token} 
              onChange={(e) => setToken(e.target.value)} 
              style={{ display: 'block', width: '100%', padding: 10, boxSizing: 'border-box', border: '1px solid #ccc', borderRadius: '4px' }} 
            />
          </div>
          <div style={{ marginBottom: 15 }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: 5 }}>Новый пароль</label>
            <input 
              type="password"
              placeholder="Не менее 6 символов" 
              value={newPassword} 
              onChange={(e) => setNewPassword(e.target.value)} 
              style={{ display: 'block', width: '100%', padding: 10, boxSizing: 'border-box', border: '1px solid #ccc', borderRadius: '4px' }} 
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            style={{ width: '100%', padding: 12, backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: loading ? 'not-allowed' : 'pointer' }}
          >
            {loading ? 'Сохранение...' : 'Установить новый пароль'}
          </button>
        </form>
      )}

      <p style={{ marginTop: 20, textAlign: 'center', fontSize: '14px' }}>
        Вспомнили пароль? <Link to="/login" style={{ color: '#007bff' }}>Войти</Link>
      </p>
    </div>
  );
}
