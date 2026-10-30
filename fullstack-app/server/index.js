import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import { initDB } from './db.js';
import { createAuthRouter } from './routes/authRoutes.js';

const app = express();
const PORT = 5000;
const ACCESS_SECRET = 'super-access-secret-key-123';

let db;

app.use(express.json());
app.use(cookieParser());

app.use(
  cors({
    origin: 'http://localhost:5173',
    credentials: true,
  })
);

initDB().then((database) => {
  db = database;

  app.use('/api/auth', createAuthRouter(db));

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

  app.listen(PORT, () => console.log(`Сервер запущен на http://localhost:${PORT}`));
});
