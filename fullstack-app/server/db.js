import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

// Открываем или создаем файл базы данных SQLite
export async function initDB() {
  const db = await open({
    filename: './database.sqlite',
    driver: sqlite3.Database,
  });

  // СОЗДАНИЕ ТАБЛИЦЫ: Пароли храним ТОЛЬКО в виде хэша
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL
    )
  `);

  return db;
}