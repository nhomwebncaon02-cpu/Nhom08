# 1. Tên dự án
**Xây dựng hệ thống quản lý chi tiêu cá nhân thông minh**

---

# 2. Phân tích bài toán

## 2.1. Phân tích các đối tượng (Entities / Classes)

* **User (Người dùng):** Đại diện cho tài khoản người sử dụng hệ thống.
  * *Thuộc tính:* `UserId`, `Username`, `PasswordHash`, `Email`, `FullName`, `CreatedAt`

* **Account / Wallet (Ví / Tài khoản ngân hàng):** Quản lý các nguồn tiền của người dùng (Ví cash, Tài khoản Vietcombank, Thẻ tín dụng...).
  * *Thuộc tính:* `AccountId`, `UserId`, `AccountName`, `AccountType`, `Balance`, `Currency`

* **Category (Danh mục thu/chi):** Phân loại giao dịch (Ăn uống, Lương, Giải trí, Tiền nhà...).
  * *Thuộc tính:* `CategoryId`, `UserId` (null nếu là danh mục mặc định của hệ thống), `CategoryName`, `Type` (Income/Expense), `Icon`

* **Transaction (Giao dịch):** Ghi nhận các khoản thu hoặc chi thực tế.
  * *Thuộc tính:* `TransactionId`, `AccountId`, `CategoryId`, `Amount`, `TransactionDate`, `Note`

* **Budget (Ngân sách / Hạn mức):** Đặt hạn mức chi tiêu cho từng danh mục trong một khoảng thời gian (VD: Ngân sách Ăn uống tháng 9 là 5,000,000 VNĐ).
  * *Thuộc tính:* `BudgetId`, `UserId`, `CategoryId`, `AmountLimit`, `StartDate`, `EndDate`

* **SavingGoal (Mục tiêu tiết kiệm):** Theo dõi các mục tiêu tài chính dài hạn (Mua xe, Du lịch...).
  * *Thuộc tính:* `GoalId`, `UserId`, `GoalName`, `TargetAmount`, `CurrentAmount`, `TargetDate`

---

## 2.2. Phân tích mối quan hệ giữa các đối tượng (Relationships)

* **User – Account (1 - N):** Một người dùng có thể sở hữu nhiều Ví/Tài khoản ngân hàng.
* **User – Category (1 - N):** Một người dùng có thể tự tạo nhiều danh mục thu/chi tùy chỉnh.
* **Account – Transaction (1 - N):** Một tài khoản/ví có thể phát sinh nhiều giao dịch thu/chi.
* **Category – Transaction (1 - N):** Một danh mục có thể chứa nhiều giao dịch liên quan.
* **User – Budget (1 - N):** Một người dùng có thể thiết lập nhiều hạn mức ngân sách khác nhau.
* **Category – Budget (1 - N):** Một ngân sách được gắn liền với một danh mục cụ thể.
* **User – SavingGoal (1 - N):** Một người dùng có thể khởi tạo nhiều mục tiêu tiết kiệm.

---

## 2.3. Sơ đồ lớp UML (Class Diagram)

```mermaid
classDiagram
    class User {
        +int UserId
        +string Username
        +string PasswordHash
        +string Email
        +string FullName
        +DateTime CreatedAt
        +register()
        +login()
    }

    class Account {
        +int AccountId
        +int UserId
        +string AccountName
        +string AccountType
        +decimal Balance
        +string Currency
        +updateBalance()
    }

    class Category {
        +int CategoryId
        +int UserId
        +string CategoryName
        +string Type
        +string Icon
    }

    class Transaction {
        +int TransactionId
        +int AccountId
        +int CategoryId
        +decimal Amount
        +DateTime TransactionDate
        +string Note
        +addTransaction()
    }

    class Budget {
        +int BudgetId
        +int UserId
        +int CategoryId
        +decimal AmountLimit
        +DateTime StartDate
        +DateTime EndDate
        +checkOverbudget()
    }

    class SavingGoal {
        +int GoalId
        +int UserId
        +string GoalName
        +decimal TargetAmount
        +decimal CurrentAmount
        +DateTime TargetDate
        +deposit()
    }

    User "1" -- "0..*" Account : owns
    User "1" -- "0..*" Category : creates
    User "1" -- "0..*" Budget : sets
    User "1" -- "0..*" SavingGoal : tracks
    Account "1" -- "0..*" Transaction : contains
    Category "1" -- "0..*" Transaction : classifies
    Category "1" -- "0..*" Budget : applies_to

---

# 3. Auth & Security

## 3.1. Cài đặt & chạy

```bash
# 1) Database: chạy 1 lần để thêm cột Role vào bảng User
#    nestjs-backend/sql/auth-migration.sql

# 2) Backend
cd nestjs-backend
cp .env.example .env        # điền DB_*, JWT_SECRET, ADMIN_* (nếu chưa có .env)
npm install                 # cài thêm: bcryptjs, class-validator, class-transformer, helmet, dotenv, sanitize-html
npm run start:dev           # http://localhost:3000

# 3) Frontend
cd ../react-frontend
npm install
npm run dev                 # http://localhost:5173
```

Khi backend khởi động lần đầu, nếu DB chưa có admin, hệ thống tự tạo admin từ `ADMIN_USERNAME` / `ADMIN_PASSWORD` trong `.env`.

## 3.2. API

| Method | Endpoint | Quyền | Mô tả |
|---|---|---|---|
| POST | `/auth/register` | Public | `{ fullName, username, email, password }` — mật khẩu băm bằng bcrypt |
| POST | `/auth/login` | Public | `{ username (hoặc email), password }` → `{ access_token, user }` |
| GET | `/auth/me` | Đã đăng nhập | Thông tin user hiện tại |
| GET/PUT/DELETE | `/users`, `/users/:id` | Admin | Quản lý người dùng (không bao giờ trả `PasswordHash`) |
| GET/POST | `/accounts` | Đã đăng nhập | Chỉ ví của chính mình |
| CRUD | `/categories` | Đã đăng nhập | Danh mục hệ thống + danh mục của mình; chỉ sửa/xóa được danh mục của mình |

Các route cần đăng nhập gửi header: `Authorization: Bearer <access_token>`.

## 3.3. Các lớp bảo mật

| Lớp | Cách làm | File |
|---|---|---|
| Băm mật khẩu | bcrypt, 10 salt rounds; không bao giờ lưu/trả mật khẩu thô | `auth/auth.service.ts` |
| JWT | Ký bằng `JWT_SECRET` (.env), hết hạn `JWT_EXPIRES_IN`; `JwtStrategy` kiểm tra user còn tồn tại | `auth/strategies/jwt.strategy.ts` |
| Phân quyền | Guard toàn cục `JwtAuthGuard` + `RolesGuard`; `@Public()`, `@Roles('admin')` | `auth/guards/*`, `auth/decorators/*` |
| Chống brute-force | Sai 5 lần → khóa đăng nhập 15 phút | `auth/auth.service.ts` |
| CORS | Chỉ cho phép origin trong `CORS_ORIGINS` | `main.ts` |
| ValidationPipe | `whitelist`, `forbidNonWhitelisted`, `transform` + DTO dùng class-validator | `main.ts`, `**/dto/*.ts` |
| Chống XSS | `SanitizePipe` gỡ mọi thẻ HTML khỏi input trước khi validate; React tự escape khi hiển thị | `common/pipes/sanitize.pipe.ts` |
| Header bảo mật | `helmet()` | `main.ts` |
| Bí mật | DB password, JWT secret nằm trong `.env` (đã `.gitignore`) | `.env.example` |

## 3.4. Frontend

- `src/auth/session.js` — lưu phiên: mặc định `sessionStorage` (đóng tab là mất), tick "Ghi nhớ đăng nhập" thì dùng `localStorage`; tự xoá khi JWT hết hạn.
- `src/api/axiosClient.js` — tự gắn `Authorization: Bearer`, gặp 401 thì xoá phiên và về `/auth`.
- `src/auth/AuthContext.jsx` — `useAuth()` gồm `user`, `login`, `register`, `logout`; tải lại trang sẽ kiểm tra lại token qua `/auth/me`.
- `src/auth/ProtectedRoute.jsx` — chặn `/user`, `/admin` khi chưa đăng nhập hoặc sai vai trò.

## 3.5. Kiểm thử nhanh (Postman / curl)

```bash
curl -X POST localhost:3000/auth/register -H "Content-Type: application/json" \
  -d '{"fullName":"<script>alert(1)</script>Tuấn","username":"tuan01","email":"tuan@ex.com","password":"abc12345"}'
# -> fullName lưu thành "Tuấn" (thẻ script bị gỡ)

curl -X POST localhost:3000/auth/register -H "Content-Type: application/json" \
  -d '{"fullName":"A B","username":"x","email":"sai","password":"123","isAdmin":true}'
# -> 400: property isAdmin should not exist / tên đăng nhập / email / mật khẩu không hợp lệ

curl localhost:3000/users             # -> 401 (chưa đăng nhập)
curl localhost:3000/users -H "Authorization: Bearer <token của user thường>"   # -> 403
```
