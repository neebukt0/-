import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { initDB } from './db.js';

const app = express();
const PORT = 5000;

// СЕКРЕТНЫЕ КЛЮЧИ: В продакшене берутся из process.env
const ACCESS_SECRET = 'super-access-secret-key-123';
const REFRESH_SECRET = 'super-refresh-secret-key-456';

let db;

// 1. MIDDLEWARE ПАРСИНГА
app.use(express.json()); // Парсит JSON-тело входящих запросов (req.body)
app.use(cookieParser()); // Парсит HttpOnly куки из заголовков (req.cookies)

// 2. НАСТРОЙКА CORS (ОБЯЗАТЕЛЬНО ДЛЯ КУК)
app.use(
  cors({
    origin: 'http://localhost:5173', // URL нашего Vite React приложения
    credentials: true,               // РАЗРЕШАЕТ передачу HttpOnly кук между портами
  })
);

// Вспомогательная функция генерации токенов
const generateTokens = (payload) => {
  // Access Token живет 15 минут (для защиты API)
  const accessToken = jwt.sign(payload, ACCESS_SECRET, { expiresIn: '15m' });
  // Refresh Token живет 7 дней (для автообновления)
  const refreshToken = jwt.sign(payload, REFRESH_SECRET, { expiresIn: '7d' });
  return { accessToken, refreshToken };
};

// --- РОУТ 1: РЕГИСТРАЦИЯ ---
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password } = req.body; // Достаем данные из тела запроса

    if (!email || !password) {
      return res.status(400).json({ message: 'Заполните все поля' });
    }

    // Проверяем, существует ли уже такой email
    const candidate = await db.get('SELECT * FROM users WHERE email = ?', [email]);
    if (candidate) {
      return res.status(400).json({ message: 'Пользователь уже существует' });
    }

    // ХЭШИРОВАНИЕ ПАРОЛЯ: 10 кругов соления (salt)
    const hashedPassword = await bcrypt.hash(password, 10);

    // Сохраняем в SQLite
    const result = await db.run(
      'INSERT INTO users (email, password) VALUES (?, ?)',
      [email, hashedPassword]
    );

    const userPayload = { userId: result.lastID, email };
    const { accessToken, refreshToken } = generateTokens(userPayload);
    
    // УСТАНОВКА REFRESH-ТОКЕНА В HTTP-ONLY COOKIE
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true, // ЗАЩИТА: JavaScript на клиенте НЕ МОЖЕТ прочитать эту куку (защита от XSS)
      secure: false,  // true только для HTTPS в продакшене
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 дней
    });

    // Access Token отдаем в обычном JSON-ответе (он уйдет в память Redux)
    return res.json({ accessToken, user: userPayload });
  } catch (error) {
    return res.status(500).json({ message: 'Ошибка сервера при регистрации' });
  }
});

// --- РОУТ 2: АВТОРИЗАЦИЯ (ВХОД) ---
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Ищем пользователя в БД
    const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) {
      return res.status(400).json({ message: 'Неверный email или пароль' });
    }

    // СРАВНЕНИЕ ПАРОЛЕЙ: Сравниваем чистый пароль от клиента с хэшем из БД
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Неверный email или пароль' });
    }

    const userPayload = { userId: user.id, email: user.email };
    const { accessToken, refreshToken } = generateTokens(userPayload);

    // Запекаем новый Refresh Token в HttpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({ accessToken, user: userPayload });
  } catch (error) {
    return res.status(500).json({ message: 'Ошибка сервера при входе' });
  }
});

// --- РОУТ 3: ОБНОВЛЕНИЕ ТОКЕНА (SILENT REFRESH) ---
app.get('/api/auth/refresh', async (req, res) => {
  try {
    // Достаем Refresh Token из ТЕГА КУК (благодаря cookie-parser)
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ message: 'Сессия истекла (нет куки)' });
    }

    // МАТЕМАТИЧЕСКАЯ ПРОВЕРКА ПОДПИСИ ТОКЕНА
    const decoded = jwt.verify(refreshToken, REFRESH_SECRET);

    // Генерируем свежую пару токенов
    const userPayload = { userId: decoded.userId, email: decoded.email };
    const tokens = generateTokens(userPayload);

    // Перезаписываем Refresh куку
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({ accessToken: tokens.accessToken, user: userPayload });
  } catch (error) {
    // Если токен подделан или протух — сбрасываем куку
    res.clearCookie('refreshToken');
    return res.status(401).json({ message: 'Невалидный refresh токен' });
  }
});

// --- РОУТ 4: ВЫХОД (LOGOUT) ---
app.post('/api/auth/logout', (req, res) => {
  // Очищаем HttpOnly куку на клиенте
  res.clearCookie('refreshToken');
  return res.json({ message: 'Успешный выход' });
});

// --- ЗАЩИЩЕННЫЙ РОУТ (ПРИМЕР РАБОТЫ МИДДЛВАРА МАТЕМАТИЧЕСКОЙ ПРОВЕРКИ) ---
app.get('/api/protected-data', (req, res) => {
  // Читаем заголовок Authorization: Bearer <token>
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: 'Нет токена' });

  const token = authHeader.split(' ')[1];

  try {
    // ВЕРИФИКАЦИЯ: Проверяем Access Token без обращения к базе данных!
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