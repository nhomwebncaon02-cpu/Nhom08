-- =====================================================================
-- NÂNG CẤP v2: Admin + chức năng mở rộng — chạy 1 lần trên QUANLYCHITIEU
-- Cách dễ nhất: cd nestjs-backend && node sql/run-migration.js
-- (script tự bỏ qua phần đã có, chạy lại nhiều lần không sao)
-- =====================================================================
USE QUANLYCHITIEU;

-- 1. Khoá / mở khoá tài khoản
ALTER TABLE User ADD COLUMN IsActive TINYINT(1) NOT NULL DEFAULT 1 AFTER Role;

-- 2. Nhật ký hoạt động
CREATE TABLE IF NOT EXISTS AuditLog (
    LogId INT AUTO_INCREMENT PRIMARY KEY,
    UserId INT NULL,
    Username VARCHAR(50) NULL,
    Action VARCHAR(50) NOT NULL,
    Detail VARCHAR(255) NULL,
    IpAddress VARCHAR(64) NULL,
    CreatedAt DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    INDEX IDX_AuditLog_Action (Action),
    INDEX IDX_AuditLog_CreatedAt (CreatedAt)
);

-- 3. Giao dịch định kỳ
CREATE TABLE IF NOT EXISTS RecurringTransaction (
    RecurringId INT AUTO_INCREMENT PRIMARY KEY,
    UserId INT NOT NULL,
    AccountId INT NOT NULL,
    CategoryId INT NOT NULL,
    Amount DECIMAL(15, 2) NOT NULL,
    Note VARCHAR(255) NULL,
    Frequency ENUM('daily', 'weekly', 'monthly', 'yearly') NOT NULL DEFAULT 'monthly',
    NextDate DATE NOT NULL,
    IsActive TINYINT(1) NOT NULL DEFAULT 1,
    CreatedAt DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    FOREIGN KEY (UserId) REFERENCES User(UserId) ON DELETE CASCADE,
    FOREIGN KEY (AccountId) REFERENCES Account(AccountId) ON DELETE CASCADE,
    FOREIGN KEY (CategoryId) REFERENCES Category(CategoryId)
);
