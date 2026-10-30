import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { UserModel } from './models/userModel.js';

export async function initDB() {
  const db = await open({
    filename: './database.sqlite',
    driver: sqlite3.Database,
  });

  await UserModel.createTable(db);

  return db;
}
