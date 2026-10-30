import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

// Открываем или создаем файл базы данных SQLite
export async function initDB() {
  const db = await open({
    filename: './database.sqlite',
    driver: sqlite3.Database,
  });

  // Создание расширенной таблицы пользователей со всеми полями
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      firstName TEXT,
      lastName TEXT,
      username TEXT,
      email TEXT UNIQUE NOT NULL,
      phone TEXT,
      birthDate TEXT,
      password TEXT NOT NULL,
      isActivated INTEGER DEFAULT 0,
      activationToken TEXT,
      activationExpires INTEGER,
      resetTokenHash TEXT,
      resetTokenExpires INTEGER,
      createdAt TEXT,
      updatedAt TEXT
    )
  `);

  // Безопасное добавление колонок, если их нет
  const columnsToAdd = [
    'firstName TEXT',
    'lastName TEXT',
    'username TEXT',
    'phone TEXT',
    'birthDate TEXT',
    'isActivated INTEGER DEFAULT 0',
    'activationToken TEXT',
    'activationExpires INTEGER',
    'resetTokenHash TEXT',
    'resetTokenExpires INTEGER',
    'createdAt TEXT',
    'updatedAt TEXT',
  ];

  for (const col of columnsToAdd) {
    try {
      await db.exec(`ALTER TABLE users ADD COLUMN ${col}`);
    } catch (e) {}
  }

  return db;
}
