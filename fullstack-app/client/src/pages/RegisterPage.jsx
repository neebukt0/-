import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { registerUser } from '../features/auth/authSlice';
import { Link, useNavigate } from 'react-router-dom';

export function RegisterPage() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [clientError, setClientError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { error } = useSelector((state) => state.auth);

  // Функция для форматирования телефона (простая маска +7 (XXX) XXX-XX-XX)
  const handlePhoneChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.startsWith('7') || value.startsWith('8')) {
      value = value.substring(1);
    }
    
    let formatted = '+7';
    if (value.length > 0) {
      formatted += ' (' + value.substring(0, 3);
    }
    if (value.length >= 4) {
      formatted += ') ' + value.substring(3, 6);
    }
    if (value.length >= 7) {
      formatted += '-' + value.substring(6, 8);
    }
    if (value.length >= 9) {
      formatted += '-' + value.substring(8, 10);
    }
    
    setPhone(formatted);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setClientError('');
    setFieldErrors({});

    const errors = {};
    if (!firstName.trim()) errors.firstName = true;
    if (!lastName.trim()) errors.lastName = true;
    if (!username.trim()) errors.username = true;
    if (!email.trim()) errors.email = true;
    if (!phone.trim()) errors.phone = true;
    if (!birthDate) errors.birthDate = true;
    if (!password) errors.password = true;
    if (!confirmPassword) errors.confirmPassword = true;

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setClientError('Пожалуйста, заполните все обязательные поля');
      return;
    }

    if (password !== confirmPassword) {
      setFieldErrors({ password: true, confirmPassword: true });
      setClientError('Пароли не совпадают');
      return;
    }

    if (password.length < 6) {
      setFieldErrors({ password: true });
      setClientError('Пароль должен содержать не менее 6 символов');
      return;
    }

    setLoading(true);
    const result = await dispatch(
      registerUser({
        firstName,
        lastName,
        username,
        email,
        phone,
        birthDate,
        password,
        confirmPassword,
      })
    );
    setLoading(false);

    if (registerUser.fulfilled.match(result)) {
      navigate('/');
    }
  };

  const inputStyle = (hasError) => ({
    display: 'block',
    width: '100%',
    marginBottom: 10,
    padding: 10,
    boxSizing: 'border-box',
    border: `1px solid ${hasError ? 'red' : '#ccc'}`,
    borderRadius: '4px',
  });

  return (
    <div style={{ maxWidth: 450, margin: '30px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px', backgroundColor: '#f9f9f9' }}>
      <h2 style={{ textAlign: 'center', marginBottom: 20 }}>Регистрация</h2>
      
      {(clientError || error) && (
        <div style={{ color: 'red', marginBottom: 15, padding: 10, backgroundColor: '#ffe6e6', borderRadius: '4px', fontSize: '14px' }}>
          {clientError || error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 10 }}>
          <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Имя *</label>
          <input 
            placeholder="Введите имя" 
            value={firstName} 
            onChange={(e) => setFirstName(e.target.value)} 
            style={inputStyle(fieldErrors.firstName)} 
          />
        </div>

        <div style={{ marginBottom: 10 }}>
          <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Фамилия *</label>
          <input 
            placeholder="Введите фамилию" 
            value={lastName} 
            onChange={(e) => setLastName(e.target.value)} 
            style={inputStyle(fieldErrors.lastName)} 
          />
        </div>

        <div style={{ marginBottom: 10 }}>
          <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Имя пользователя (username) *</label>
          <input 
            placeholder="От 3 до 20 символов (латиница, цифры)" 
            value={username} 
            onChange={(e) => setUsername(e.target.value)} 
            style={inputStyle(fieldErrors.username)} 
          />
        </div>

        <div style={{ marginBottom: 10 }}>
          <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Электронная почта *</label>
          <input 
            placeholder="example@domain.com" 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            style={inputStyle(fieldErrors.email)} 
          />
        </div>

        <div style={{ marginBottom: 10 }}>
          <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Номер телефона *</label>
          <input 
            placeholder="+7 (___) ___-__-__" 
            type="tel" 
            value={phone} 
            onChange={handlePhoneChange} 
            style={inputStyle(fieldErrors.phone)} 
          />
        </div>

        <div style={{ marginBottom: 10 }}>
          <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Дата рождения *</label>
          <input 
            type="date" 
            value={birthDate} 
            onChange={(e) => setBirthDate(e.target.value)} 
            style={inputStyle(fieldErrors.birthDate)} 
          />
        </div>

        <div style={{ marginBottom: 10 }}>
          <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Пароль *</label>
          <div style={{ position: 'relative' }}>
            <input 
              placeholder="Не менее 6 символов" 
              type={showPassword ? 'text' : 'password'} 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              style={{ ...inputStyle(fieldErrors.password), paddingRight: '50px' }} 
            />
            <button 
              type="button" 
              onClick={() => setShowPassword(!showPassword)}
              style={{ position: 'absolute', right: 8, top: 8, background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', color: '#007bff' }}
            >
              {showPassword ? 'Скрыть' : 'Показать'}
            </button>
          </div>
          <small style={{ color: '#666', fontSize: '11px' }}>Требования: минимум 6 символов.</small>
        </div>

        <div style={{ marginBottom: 15 }}>
          <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Подтверждение пароля *</label>
          <div style={{ position: 'relative' }}>
            <input 
              placeholder="Повторите пароль" 
              type={showConfirmPassword ? 'text' : 'password'} 
              value={confirmPassword} 
              onChange={(e) => setConfirmPassword(e.target.value)} 
              style={{ ...inputStyle(fieldErrors.confirmPassword), paddingRight: '50px' }} 
            />
            <button 
              type="button" 
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              style={{ position: 'absolute', right: 8, top: 8, background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', color: '#007bff' }}
            >
              {showConfirmPassword ? 'Скрыть' : 'Показать'}
            </button>
          </div>
        </div>

        <button 
          type="submit" 
          disabled={loading} 
          style={{ width: '100%', padding: 12, backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: loading ? 'not-allowed' : 'pointer' }}
        >
          {loading ? 'Регистрация...' : 'Создать аккаунт'}
        </button>
      </form>

      <p style={{ marginTop: 20, textAlign: 'center', fontSize: '14px' }}>
        Уже есть аккаунт? <Link to="/login" style={{ color: '#007bff' }}>Войти</Link>
      </p>
    </div>
  );
}
