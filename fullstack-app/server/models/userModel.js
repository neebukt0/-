import bcrypt from 'bcryptjs';
import { TransactionModel } from './transactionModel.js';

export class UserModel {
  static async createTable(db) {
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
        role TEXT DEFAULT 'user',
        savings REAL DEFAULT 0,
        isActivated INTEGER DEFAULT 0,
        activationToken TEXT,
        activationExpires INTEGER,
        resetTokenHash TEXT,
        resetTokenExpires INTEGER,
        createdAt TEXT,
        updatedAt TEXT
      )
    `);

    await TransactionModel.createTable(db);

    const columnsToAdd = [
      'firstName TEXT',
      'lastName TEXT',
      'username TEXT',
      'phone TEXT',
      'birthDate TEXT',
      "role TEXT DEFAULT 'user'",
      'savings REAL DEFAULT 0',
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
  }

  static async findByEmailOrUsername(db, login) {
    return await db.get('SELECT * FROM users WHERE email = ? OR username = ?', [login, login]);
  }

  static async findByEmail(db, email) {
    return await db.get('SELECT * FROM users WHERE email = ?', [email]);
  }

  static async findById(db, id) {
    return await db.get('SELECT * FROM users WHERE id = ?', [id]);
  }

  static async create(db, userData) {
    const {
      firstName,
      lastName,
      username,
      email,
      phone,
      birthDate,
      password,
      role = 'user',
      savings = 0,
      activationToken,
      activationExpires,
      createdAt,
    } = userData;

    const hashedPassword = await bcrypt.hash(password, 10);
    const cleanedPhone = phone ? phone.replace(/\D/g, '') : '';

    const result = await db.run(
      `INSERT INTO users (
        firstName, lastName, username, email, phone, birthDate, 
        password, role, savings, isActivated, activationToken, activationExpires, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)`,
      [
        firstName,
        lastName,
        username,
        email,
        cleanedPhone,
        birthDate,
        hashedPassword,
        role,
        savings,
        activationToken,
        activationExpires,
        createdAt,
      ]
    );

    return await this.findById(db, result.lastID);
  }

  static async updateActivation(db, email, activationToken, activationExpires) {
    await db.run(
      'UPDATE users SET activationToken = ?, activationExpires = ? WHERE email = ?',
      [activationToken, activationExpires, email]
    );
  }

  static async activateUser(db, email) {
    await db.run(
      'UPDATE users SET isActivated = 1, activationToken = NULL, activationExpires = NULL WHERE email = ?',
      [email]
    );
  }

  static async updatePasswordAndClearReset(db, email, hashedPassword) {
    await db.run(
      'UPDATE users SET password = ?, resetTokenHash = NULL, resetTokenExpires = NULL WHERE email = ?',
      [hashedPassword, email]
    );
  }

  static async setResetToken(db, email, resetTokenHash, resetTokenExpires) {
    await db.run(
      'UPDATE users SET resetTokenHash = ?, resetTokenExpires = ? WHERE email = ?',
      [resetTokenHash, resetTokenExpires, email]
    );
  }

  static async addTransaction(db, userId, data) {
    return await TransactionModel.add(db, userId, data, this);
  }
}
