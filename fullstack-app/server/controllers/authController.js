import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { UserModel } from '../models/userModel.js';

const ACCESS_SECRET = 'super-access-secret-key-123';
const REFRESH_SECRET = 'super-refresh-secret-key-456';

export const generateTokens = (payload) => {
  const accessToken = jwt.sign(payload, ACCESS_SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.sign(payload, REFRESH_SECRET, { expiresIn: '7d' });
  return { accessToken, refreshToken };
};

export const formatUserPayload = (user) => ({
  userId: user.id || user.userId,
  firstName: user.firstName,
  lastName: user.lastName,
  username: user.username,
  email: user.email,
  phone: user.phone,
  birthDate: user.birthDate,
  role: user.role || 'user',
  savings: user.savings || 0,
  createdAt: user.createdAt,
  isActivated: !!user.isActivated,
});

export const register = (db) => async (req, res) => {
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

    const cleanedPhone = phone.replace(/\D/g, '');
    const phoneRegex = /^[0-9]{10,15}$/;
    if (!phoneRegex.test(cleanedPhone)) {
      return res.status(400).json({ message: 'Некорректный номер телефона' });
    }

    const existingUser = await UserModel.findByEmailOrUsername(db, email);
    const existingUsername = await UserModel.findByEmailOrUsername(db, username);

    if (existingUser) {
      return res.status(400).json({ message: 'Пользователь с таким email уже существует' });
    }
    if (existingUsername) {
      return res.status(400).json({ message: 'Имя пользователя уже занято' });
    }

    const activationToken = Math.floor(100000 + Math.random() * 900000).toString();
    const activationExpires = Date.now() + 15 * 60 * 1000;
    const createdAt = new Date().toISOString();

    const newUser = await UserModel.create(db, {
      firstName,
      lastName,
      username,
      email,
      phone: cleanedPhone,
      birthDate,
      password,
      role: 'user',
      savings: 0,
      activationToken,
      activationExpires,
      createdAt,
    });

    console.log(`\n----------------------------------------`);
    console.log(`[ЭЛЕКТРОННАЯ ПОЧТА] Письмо для: ${email}`);
    console.log(`Код подтверждения: ${activationToken}`);
    console.log(`----------------------------------------\n`);

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
};

export const login = (db) => async (req, res) => {
  try {
    const { login, password } = req.body;

    if (!login || !password) {
      return res.status(400).json({ message: 'Заполните логин и пароль' });
    }

    const user = await UserModel.findByEmailOrUsername(db, login);
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
};

export const activate = (db) => async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ message: 'Введите email и код подтверждения' });
    }

    const user = await UserModel.findByEmail(db, email);
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

    await UserModel.activateUser(db, email);

    const updatedUser = await UserModel.findByEmail(db, email);
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
};

export const resendActivation = (db) => async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Укажите email' });
    }

    const user = await UserModel.findByEmail(db, email);
    if (!user) {
      return res.status(400).json({ message: 'Пользователь не найден' });
    }

    if (user.isActivated) {
      return res.status(400).json({ message: 'Электронная почта уже подтверждена' });
    }

    const activationToken = Math.floor(100000 + Math.random() * 900000).toString();
    const activationExpires = Date.now() + 15 * 60 * 1000;

    await UserModel.updateActivation(db, email, activationToken, activationExpires);

    console.log(`\n----------------------------------------`);
    console.log(`[ПОВТОРНАЯ ОТПРАВКА] Письмо для: ${email}`);
    console.log(`Новый код подтверждения: ${activationToken}`);
    console.log(`----------------------------------------\n`);

    return res.json({ message: 'Код подтверждения отправлен повторно' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: 'Ошибка при повторной отправке' });
  }
};

export const forgotPassword = (db) => async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Укажите email' });
    }

    const user = await UserModel.findByEmail(db, email);
    if (user) {
      const rawToken = crypto.randomBytes(32).toString('hex');
      const resetTokenHash = await bcrypt.hash(rawToken, 10);
      const resetTokenExpires = Date.now() + 15 * 60 * 1000;

      await UserModel.setResetToken(db, email, resetTokenHash, resetTokenExpires);

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
};

export const resetPassword = (db) => async (req, res) => {
  try {
    const { email, token, newPassword } = req.body;

    if (!email || !token || !newPassword) {
      return res.status(400).json({ message: 'Заполните все поля' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Новый пароль должен содержать не менее 6 символов' });
    }

    const user = await UserModel.findByEmail(db, email);
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

    await UserModel.updatePasswordAndClearReset(db, email, hashedNewPassword);

    res.clearCookie('refreshToken');

    return res.json({ message: 'Пароль успешно изменен. Теперь вы можете войти с новым паролем.' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: 'Ошибка сервера при сбросе пароля' });
  }
};

export const refresh = (db) => async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ message: 'Сессия истекла (нет куки)' });
    }

    const decoded = jwt.verify(refreshToken, REFRESH_SECRET);
    const userFromDb = await UserModel.findById(db, decoded.userId);
    
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
};

export const logout = (req, res) => {
  res.clearCookie('refreshToken');
  return res.json({ message: 'Успешный выход' });
};

export const addTransaction = (db) => async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Не авторизован' });
    }

    const { amount, type, category, description } = req.body;
    const updatedUser = await UserModel.addTransaction(db, userId, { amount, type, category, description });

    const userPayload = formatUserPayload(updatedUser);
    return res.json({ message: 'Транзакция успешно добавлена', user: userPayload });
  } catch (e) {
    console.error(e);
    return res.status(400).json({ message: e.message || 'Ошибка при добавлении транзакции' });
  }
};
