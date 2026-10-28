-- =====================================================================
-- MIGRATION cho phần Auth & Security — chạy 1 lần trên database QUANLYCHITIEU
-- =====================================================================
USE QUANLYCHITIEU;

-- 1. Thêm cột Role để phân quyền user / admin
ALTER TABLE User
  ADD COLUMN Role ENUM('user', 'admin') NOT NULL DEFAULT 'user' AFTER FullName;

-- 2. Dữ liệu mẫu cũ có PasswordHash = 'hashed_pwd' (không phải hash bcrypt thật)
--    -> tài khoản này sẽ KHÔNG đăng nhập được. Hãy đăng ký tài khoản mới qua /auth/register.
--    Tài khoản admin sẽ được backend tự tạo khi khởi động (xem ADMIN_* trong file .env).

-- 3. (Tuỳ chọn) Nâng một user có sẵn lên admin:
-- UPDATE User SET Role = 'admin' WHERE Username = 'phudam';
