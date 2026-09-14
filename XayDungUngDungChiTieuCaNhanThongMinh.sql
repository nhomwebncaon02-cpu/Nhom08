CREATE DATABASE IF NOT EXISTS QUANLYCHITIEU;
USE QUANLYCHITIEU;

-- 1. Bảng User
CREATE TABLE User (
    UserId INT AUTO_INCREMENT PRIMARY KEY,
    Username VARCHAR(50) NOT NULL UNIQUE,
    PasswordHash VARCHAR(255) NOT NULL,
    Email VARCHAR(100) NOT NULL UNIQUE,
    FullName VARCHAR(100) NOT NULL,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Bảng Account (Ví / Tài khoản ngân hàng)
CREATE TABLE Account (
    AccountId INT AUTO_INCREMENT PRIMARY KEY,
    UserId INT NOT NULL,
    AccountName VARCHAR(100) NOT NULL,
    AccountType VARCHAR(50),
    Balance DECIMAL(15, 2) DEFAULT 0.00,
    Currency VARCHAR(10) DEFAULT 'VND',
    FOREIGN KEY (UserId) REFERENCES User(UserId) ON DELETE CASCADE
);

-- 3. Bảng Category (Danh mục thu/chi)
CREATE TABLE Category (
    CategoryId INT AUTO_INCREMENT PRIMARY KEY,
    UserId INT, -- Null nếu là danh mục mặc định
    CategoryName VARCHAR(100) NOT NULL,
    Type ENUM('Income', 'Expense') NOT NULL,
    Icon VARCHAR(50),
    FOREIGN KEY (UserId) REFERENCES User(UserId) ON DELETE SET NULL
);

-- 4. Bảng SavingGoal (Mục tiêu tiết kiệm)
CREATE TABLE SavingGoal (
    GoalId INT AUTO_INCREMENT PRIMARY KEY,
    UserId INT NOT NULL,
    GoalName VARCHAR(100) NOT NULL,
    TargetAmount DECIMAL(15, 2) NOT NULL,
    CurrentAmount DECIMAL(15, 2) DEFAULT 0.00,
    TargetDate DATETIME,
    FOREIGN KEY (UserId) REFERENCES User(UserId) ON DELETE CASCADE
);

-- 5. Bảng Transaction (Giao dịch)
CREATE TABLE Transaction (
    TransactionId INT AUTO_INCREMENT PRIMARY KEY,
    AccountId INT NOT NULL,
    CategoryId INT NOT NULL,
    Amount DECIMAL(15, 2) NOT NULL,
    TransactionDate DATETIME DEFAULT CURRENT_TIMESTAMP,
    Note VARCHAR(255),
    FOREIGN KEY (AccountId) REFERENCES Account(AccountId) ON DELETE CASCADE,
    FOREIGN KEY (CategoryId) REFERENCES Category(CategoryId)
);

-- 6. Bảng Budget (Ngân sách)
CREATE TABLE Budget (
    BudgetId INT AUTO_INCREMENT PRIMARY KEY,
    UserId INT NOT NULL,
    CategoryId INT NOT NULL,
    AmountLimit DECIMAL(15, 2) NOT NULL,
    StartDate DATETIME NOT NULL,
    EndDate DATETIME NOT NULL,
    FOREIGN KEY (UserId) REFERENCES User(UserId) ON DELETE CASCADE,
    FOREIGN KEY (CategoryId) REFERENCES Category(CategoryId)
);

-- ==========================================
-- DỮ LIỆU MẪU (DUMMY DATA)
-- ==========================================

INSERT INTO User (Username, PasswordHash, Email, FullName) 
VALUES ('phudam', 'hashed_pwd', 'phudam@example.com', 'Đàm Phú');

INSERT INTO Account (UserId, AccountName, AccountType, Balance) 
VALUES (1, 'Ví Tiền Mặt', 'Cash', 2000000),
       (1, 'Vietcombank', 'Bank', 15000000);

INSERT INTO Category (UserId, CategoryName, Type, Icon) 
VALUES (1, 'Ăn uống', 'Expense', 'food'),
       (1, 'Lương', 'Income', 'money'),
       (NULL, 'Đi lại', 'Expense', 'car');

INSERT INTO SavingGoal (UserId, GoalName, TargetAmount, CurrentAmount, TargetDate)
VALUES (1, 'Mua Laptop', 30000000, 5000000, '2027-01-01');

INSERT INTO Transaction (AccountId, CategoryId, Amount, Note)
VALUES (1, 1, 50000, 'Ăn sáng'),
       (2, 2, 15000000, 'Lương tháng 9');

INSERT INTO Budget (UserId, CategoryId, AmountLimit, StartDate, EndDate)
VALUES (1, 1, 3000000, '2026-09-01', '2026-09-30');