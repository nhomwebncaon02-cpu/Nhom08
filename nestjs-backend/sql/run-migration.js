/**
 * Chạy migration cho database: node sql/run-migration.js  (đứng trong thư mục nestjs-backend)
 * - Đọc thông tin DB từ .env
 * - Mỗi bước tự kiểm tra, phần nào đã có thì bỏ qua -> chạy lại nhiều lần vẫn an toàn
 */
require('dotenv/config');
const mysql = require('mysql2/promise');

const steps = [
  {
    name: 'Cột User.Role (Auth & Security)',
    check: "SELECT COUNT(*) AS n FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'User' AND COLUMN_NAME = 'Role'",
    sql: "ALTER TABLE User ADD COLUMN Role ENUM('user','admin') NOT NULL DEFAULT 'user' AFTER FullName",
  },
  {
    name: 'Cột User.IsActive (khoá tài khoản)',
    check: "SELECT COUNT(*) AS n FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'User' AND COLUMN_NAME = 'IsActive'",
    sql: 'ALTER TABLE User ADD COLUMN IsActive TINYINT(1) NOT NULL DEFAULT 1 AFTER Role',
  },
  {
    name: 'Bảng AuditLog (nhật ký hoạt động)',
    check: "SELECT COUNT(*) AS n FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'AuditLog'",
    sql: `CREATE TABLE AuditLog (
      LogId INT AUTO_INCREMENT PRIMARY KEY,
      UserId INT NULL,
      Username VARCHAR(50) NULL,
      Action VARCHAR(50) NOT NULL,
      Detail VARCHAR(255) NULL,
      IpAddress VARCHAR(64) NULL,
      CreatedAt DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
      INDEX IDX_AuditLog_Action (Action),
      INDEX IDX_AuditLog_CreatedAt (CreatedAt)
    )`,
  },
  {
    name: 'Bảng RecurringTransaction (giao dịch định kỳ)',
    check: "SELECT COUNT(*) AS n FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'RecurringTransaction'",
    sql: `CREATE TABLE RecurringTransaction (
      RecurringId INT AUTO_INCREMENT PRIMARY KEY,
      UserId INT NOT NULL,
      AccountId INT NOT NULL,
      CategoryId INT NOT NULL,
      Amount DECIMAL(15, 2) NOT NULL,
      Note VARCHAR(255) NULL,
      Frequency ENUM('daily','weekly','monthly','yearly') NOT NULL DEFAULT 'monthly',
      NextDate DATE NOT NULL,
      IsActive TINYINT(1) NOT NULL DEFAULT 1,
      CreatedAt DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
      FOREIGN KEY (UserId) REFERENCES User(UserId) ON DELETE CASCADE,
      FOREIGN KEY (AccountId) REFERENCES Account(AccountId) ON DELETE CASCADE,
      FOREIGN KEY (CategoryId) REFERENCES Category(CategoryId)
    )`,
  },
];

(async () => {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
  });
  let failed = 0;
  try {
    for (const step of steps) {
      const [rows] = await conn.query(step.check);
      if (Number(rows[0].n) > 0) {
        console.log(`ℹ️  ${step.name}: đã có, bỏ qua`);
        continue;
      }
      try {
        await conn.query(step.sql);
        console.log(`✅ ${step.name}: đã tạo`);
      } catch (e) {
        failed++;
        console.error(`❌ ${step.name}: ${e.message}`);
      }
    }
  } finally {
    await conn.end();
  }
  console.log(failed ? `\nCó ${failed} bước lỗi, xem chi tiết ở trên.` : '\n🎉 Database đã sẵn sàng.');
  process.exitCode = failed ? 1 : 0;
})().catch((e) => {
  console.error('❌ Không kết nối được database:', e.message);
  process.exitCode = 1;
});
