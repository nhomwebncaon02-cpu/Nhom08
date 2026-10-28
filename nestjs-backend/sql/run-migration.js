require('dotenv/config');
const mysql = require('mysql2/promise');

(async () => {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
  });
  try {
    await conn.query(
      "ALTER TABLE User ADD COLUMN Role ENUM('user','admin') NOT NULL DEFAULT 'user' AFTER FullName",
    );
    console.log('✅ Đã thêm cột Role vào bảng User');
  } catch (e) {
    if (e.code === 'ER_DUP_FIELDNAME') console.log('ℹ️ Cột Role đã có sẵn, không cần thêm nữa');
    else console.error('❌ Lỗi:', e.message);
  } finally {
    await conn.end();
  }
})();