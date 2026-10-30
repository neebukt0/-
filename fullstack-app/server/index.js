import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { initDB } from './db.js';
import crypto from 'crypto';

const app = express();
const PORT = 5000;

// СЕКРЕТНЫЕ КЛЮЧИ: В продакшене берутся из process.env
const ACCESS_SECRET = 'super-access-secret-key-123';
const REFRESH_SECRET = 'super-refresh-secret-key-456';

let db;

// 1. MIDDLEWARE ПАРСИНГА
app.use(express.json());
app.use(cookieParser());

// 2. НАСТРОЙКА CORS
app.use(
  cors({
    origin: 'http://localhost:5173',
    credentials: true,
  })
);

// Вспомогательная функция генерации токенов
const generateTokens = (payload) => {
  const accessToken = jwt.sign(payload, ACCESS_SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.sign(payload, REFRESH_SECRET, { expiresIn: '7d' });
  return { accessToken, refreshToken };
};

// Функция для формирования полного объекта пользователя
const formatUserPayload = (user) => ({
  userId: user.id || user.userId,
  firstName: user.firstName,
  lastName: user.lastName,
  username: user.username,
  email: user.email,
  phone: user.phone,
  birthDate: user.birthDate,
  createdAt: user.createdAt,
  isActivated: !!user.isActivated,
});

// --- РОУТ 1: РЕГИСТРАЦИЯ ---
app.post('/api/auth/register', async (req, res) => {
  try {
    const { firstName, lastName, username, email, phone, birthDate, password, confirmPassword } = req.body;

    if (!firstName || !lastName || !username || !email || !phone || !birthDate || !password || !confirmPassword) {
      return res.status(400).json({ message: 'Заполните все обязательные поля' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Пароли не совпадают' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Некорректный адрес электронной почты' });
    }

    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!usernameRegex.test(username)) {
      return res.status(400).json({ message: 'Имя пользователя должно содержать от 3 до 20 символов (латиница, цифры, _)' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Пароль должен содержать не менее 6 символов' });
    }

    const phoneRegex = /^\+?[0-9]{10,15}$/;
    if (!phoneRegex.test(phone.replace(/[\s()-]/g, ''))) {
      return res.status(400).json({ message: 'Некорректный номер телефона' });
    }

    const existingUser = await db.get(
      'SELECT * FROM users WHERE email = ? OR username = ?',
      [email, username]
    );

    if (existingUser) {
      if (existingUser.email === email) {
        return res.status(400).json({ message: 'Пользователь с таким email уже существует' });
      }
      if (existingUser.username === username) {
        return res.status(400).json({ message: 'Имя пользователя уже занято' });
      }
    }

    const activationToken = Math.floor(100000 + Math.random() * 900000).toString();
    const activationExpires = Date.now() + 15 * 60 * 1000;
    const createdAt = new Date().toISOString();

    const hashedPassword = await bcrypt.hash(password, 10);

    try { await db.exec(`ALTER TABLE users ADD COLUMN isActivated INTEGER DEFAULT 0`); } catch (e) {}
    try { await db.exec(`ALTER TABLE users ADD COLUMN activationToken TEXT`); } catch (e) {}
    try { await db.exec(`ALTER TABLE users ADD COLUMN activationExpires INTEGER`); } catch (e) {}
    try { await db.exec(`ALTER TABLE users ADD COLUMN resetTokenHash TEXT`); } catch (e) {}
    try { await db.exec(`ALTER TABLE users ADD COLUMN resetTokenExpires INTEGER`); } catch (e) {}
    try { await db.exec(`ALTER TABLE users ADD COLUMN createdAt TEXT`); } catch (e) {}

    const result = await db.run(
      'INSERT INTO users (firstName, lastName, username, email, phone, birthDate, password, isActivated, activationToken, activationExpires, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)',
      [firstName, lastName, username, email, phone, birthDate, hashedPassword, activationToken, activationExpires, createdAt]
    );

    console.log(`\n----------------------------------------`);
    console.log(`[ЭЛЕКТРОННАЯ ПОЧТА] Письмо для: ${email}`);
    console.log(`Код подтверждения: ${activationToken}`);
    console.log(`----------------------------------------\n`);

    const newUser = await db.get('SELECT * FROM users WHERE id = ?', [result.lastID]);
    const userPayload = formatUserPayload(newUser);
    const { accessToken, refreshToken } = generateTokens(userPayload);
    
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({ accessToken, user: userPayload });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Ошибка сервера при регистрации' });
  }
});

// --- РОУТ 2: АВТОРИЗАЦИЯ (ВХОД) ---
app.post('/api/auth/login', async (req, res) => {
  try {
    const { login, password } = req.body;

    if (!login || !password) {
      return res.status(400).json({ message: 'Заполните логин и пароль' });
    }

    const user = await db.get('SELECT * FROM users WHERE email = ? OR username = ?', [login, login]);
    if (!user) {
      return res.status(400).json({ message: 'Неверный логин или пароль' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Неверный логин или пароль' });
    }

    const userPayload = formatUserPayload(user);
    const { accessToken, refreshToken } = generateTokens(userPayload);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({ accessToken, user: userPayload });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Ошибка сервера при входе' });
  }
});

// --- РОУТ 2.1: ПОДТВЕРЖДЕНИЕ EMAIL ---
app.post('/api/auth/activate', async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ message: 'Введите email и код подтверждения' });
    }

    const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) {
      return res.status(400).json({ message: 'Пользователь не найден' });
    }

    if (user.isActivated) {
      return res.status(400).json({ message: 'Электронная почта уже подтверждена' });
    }

    if (user.activationToken !== code) {
      return res.status(400).json({ message: 'Неверный код подтверждения' });
    }

    if (Date.now() > user.activationExpires) {
      return res.status(400).json({ message: 'Срок действия кода истек. Запросите новый.' });
    }

    await db.run('UPDATE users SET isActivated = 1, activationToken = NULL, activationExpires = NULL WHERE email = ?', [email]);

    const updatedUser = await db.get('SELECT * FROM users WHERE email = ?', [email]);
    const userPayload = formatUserPayload(updatedUser);
    const { accessToken, refreshToken } = generateTokens(userPayload);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({ message: 'Email успешно подтвержден', accessToken, user: userPayload });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: 'Ошибка сервера при подтверждении email' });
  }
});

// --- РОУТ 2.2: ПОВТОРНАЯ ОТПРАВКА КОДА ---
app.post('/api/auth/resend-activation', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Укажите email' });
    }

    const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) {
      return res.status(400).json({ message: 'Пользователь не найден' });
    }

    if (user.isActivated) {
      return res.status(400).json({ message: 'Электронная почта уже подтверждена' });
    }

    const activationToken = Math.floor(100000 + Math.random() * 900000).toString();
    const activationExpires = Date.now() + 15 * 60 * 1000;

    await db.run('UPDATE users SET activationToken = ?, activationExpires = ? WHERE email = ?', [activationToken, activationExpires, email]);

    console.log(`\n----------------------------------------`);
    console.log(`[ПОВТОРНАЯ ОТПРАВКА] Письмо для: ${email}`);
    console.log(`Новый код подтверждения: ${activationToken}`);
    console.log(`----------------------------------------\n`);

    return res.json({ message: 'Код подтверждения отправлен повторно' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: 'Ошибка при повторной отправке' });
  }
});

// --- РОУТ 2.3: ЗАПРОС ВОССТАНОВЛЕНИЯ ПАРОЛЯ ---
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Укажите email' });
    }

    const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
    if (user) {
      const rawToken = crypto.randomBytes(32).toString('hex');
      const resetTokenHash = await bcrypt.hash(rawToken, 10);
      const resetTokenExpires = Date.now() + 15 * 60 * 1000;

      try { await db.exec(`ALTER TABLE users ADD COLUMN resetTokenHash TEXT`); } catch (e) {}
      try { await db.exec(`ALTER TABLE users ADD COLUMN resetTokenExpires INTEGER`); } catch (e) {}

      await db.run(
        'UPDATE users SET resetTokenHash = ?, resetTokenExpires = ? WHERE email = ?',
        [resetTokenHash, resetTokenExpires, email]
      );

      console.log(`\n----------------------------------------`);
      console.log(`[ВОССТАНОВЛЕНИЕ ПАРОЛЯ] Для: ${email}`);
      console.log(`Токен сброса: ${rawToken}`);
      console.log(`----------------------------------------\n`);
    }

    return res.json({ message: 'Если такой email зарегистрирован, инструкции по восстановлению отправлены.' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: 'Ошибка сервера при запросе восстановления' });
  }
});

// --- РОУТ 2.4: СБРОС ПАРОЛЯ С ИСПОЛЬЗОВАНИЕМ ТОКЕНА ---
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { email, token, newPassword } = req.body;

    if (!email || !token || !newPassword) {
      return res.status(400).json({ message: 'Заполните все поля' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Новый пароль должен содержать не менее 6 символов' });
    }

    const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
    if (!user || !user.resetTokenHash || !user.resetTokenExpires) {
      return res.status(400).json({ message: 'Недействительный или просроченный токен' });
    }

    if (Date.now() > user.resetTokenExpires) {
      return res.status(400).json({ message: 'Срок действия токена истек' });
    }

    const isTokenValid = await bcrypt.compare(token.trim(), user.resetTokenHash);
    if (!isTokenValid) {
      return res.status(400).json({ message: 'Неверный токен восстановления' });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    await db.run(
      'UPDATE users SET password = ?, resetTokenHash = NULL, resetTokenExpires = NULL WHERE email = ?',
      [hashedNewPassword, email]
    );

    res.clearCookie('refreshToken');

    return res.json({ message: 'Пароль успешно изменен. Теперь вы можете войти с новым паролем.' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: 'Ошибка сервера при сбросе пароля' });
  }
});

// --- РОУТ 3: ОБНОВЛЕНИЕ ТОКЕНА (SILENT REFRESH) ---
app.get('/api/auth/refresh', async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ message: 'Сессия истекла (нет куки)' });
    }

    const decoded = jwt.verify(refreshToken, REFRESH_SECRET);
    const userFromDb = await db.get('SELECT * FROM users WHERE id = ?', [decoded.userId]);
    
    if (!userFromDb) {
      return res.status(401).json({ message: 'Пользователь не найден' });
    }

    const userPayload = formatUserPayload(userFromDb);
    const tokens = generateTokens(userPayload);

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({ accessToken: tokens.accessToken, user: userPayload });
  } catch (error) {
    res.clearCookie('refreshToken');
    return res.status(401).json({ message: 'Невалидный refresh токен' });
  }
});

// --- РОУТ 4: ВЫХОД (LOGOUT) ---
app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('refreshToken');
  return res.json({ message: 'Успешный выход' });
});

// --- ЗАЩИЩЕННЫЙ РОУТ ---
app.get('/api/protected-data', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: 'Нет токена' });

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, ACCESS_SECRET);
    return res.json({ message: 'Секретные данные полученные по токену', user: decoded });
  } catch (e) {
    return res.status(401).json({ message: 'Токен протух или подделан' });
  }
});

// Инициализируем БД и запускаем сервер
initDB().then((database) => {
  db = database;
  app.listen(PORT, () => console.log(`Сервер запущен на http://localhost:${PORT}`));
});
