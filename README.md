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
