export class TransactionModel {
  static async createTable(db) {
    await db.exec(`
      CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER,
        amount REAL,
        type TEXT,
        category TEXT,
        description TEXT,
        createdAt TEXT,
        FOREIGN KEY (userId) REFERENCES users(id)
      )
    `);
  }

  static async add(db, userId, { amount, type, category, description }, userModel) {
    const user = await userModel.findById(db, userId);
    if (!user) {
      throw new Error('Пользователь не найден');
    }

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      throw new Error('Некорректная сумма транзакции');
    }

    let newSavings = user.savings;
    if (type === 'income') {
      newSavings += numericAmount;
    } else if (type === 'expense') {
      newSavings -= numericAmount;
    } else {
      throw new Error('Неверный тип транзакции');
    }

    await db.run('UPDATE users SET savings = ? WHERE id = ?', [newSavings, userId]);

    const createdAt = new Date().toISOString();
    await db.run(
      `INSERT INTO transactions (userId, amount, type, category, description, createdAt) VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, numericAmount, type, category || '', description || '', createdAt]
    );

    return await userModel.findById(db, userId);
  }
}
