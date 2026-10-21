/**
 * js/auth.js - Quản lý Cơ sở dữ liệu mẫu & Đăng nhập / Đăng ký
 */

// Dữ liệu ban đầu mặc định theo Sơ đồ lớp UML
const INITIAL_CATEGORIES = [
    { CategoryId: 1, UserId: null, CategoryName: "Ăn uống", Type: "Expense", Icon: "fa-utensils" },
    { CategoryId: 2, UserId: null, CategoryName: "Tiền nhà & Hóa đơn", Type: "Expense", Icon: "fa-house" },
    { CategoryId: 3, UserId: null, CategoryName: "Đi lại & Xăng xe", Type: "Expense", Icon: "fa-car" },
    { CategoryId: 4, UserId: null, CategoryName: "Mua sắm & Giải trí", Type: "Expense", Icon: "fa-bag-shopping" },
    { CategoryId: 5, UserId: null, CategoryName: "Lương hàng tháng", Type: "Income", Icon: "fa-money-bill-wave" },
    { CategoryId: 6, UserId: null, CategoryName: "Thưởng & Làm thêm", Type: "Income", Icon: "fa-gift" },
    { CategoryId: 7, UserId: null, CategoryName: "Y tế & Sức khỏe", Type: "Expense", Icon: "fa-heart-pulse" }
];

const INITIAL_USERS = [
    { UserId: 1, Username: "user", Email: "user@smartmoney.vn", PasswordHash: "user123", FullName: "Nguyễn Văn User", Role: "user", CreatedAt: "2026-01-10" },
    { UserId: 2, Username: "admin", Email: "admin@smartmoney.vn", PasswordHash: "admin123", FullName: "Quản Trị Viên", Role: "admin", CreatedAt: "2026-01-01" }
];

const INITIAL_ACCOUNTS = [
    { AccountId: 101, UserId: 1, AccountName: "Ví Tiền Mặt", AccountType: "Cash", Balance: 2500000, Currency: "VND" },
    { AccountId: 102, UserId: 1, AccountName: "Vietcombank Digibank", AccountType: "Bank", Balance: 24500000, Currency: "VND" },
    { AccountId: 103, UserId: 1, AccountName: "Thẻ Tín Dụng VPBank", AccountType: "Credit", Balance: 10000000, Currency: "VND" }
];

const INITIAL_TRANSACTIONS = [
    { TransactionId: 1001, AccountId: 102, CategoryId: 5, Amount: 20000000, TransactionDate: "2026-09-05", Note: "Nhận lương tháng 9" },
    { TransactionId: 1002, AccountId: 101, CategoryId: 1, Amount: 65000, TransactionDate: "2026-09-18", Note: "Ăn trưa cơm sườn" },
    { TransactionId: 1003, AccountId: 102, CategoryId: 2, Amount: 3500000, TransactionDate: "2026-09-10", Note: "Thanh toán tiền thuê nhà" },
    { TransactionId: 1004, AccountId: 102, CategoryId: 4, Amount: 850000, TransactionDate: "2026-09-15", Note: "Mua tai nghe bluetooth" },
    { TransactionId: 1005, AccountId: 101, CategoryId: 3, Amount: 120000, TransactionDate: "2026-09-19", Note: "Đổ xăng xe máy" }
];

const INITIAL_BUDGETS = [
    { BudgetId: 201, UserId: 1, CategoryId: 1, AmountLimit: 4000000, StartDate: "2026-09-01", EndDate: "2026-09-30" },
    { BudgetId: 202, UserId: 1, CategoryId: 4, AmountLimit: 1500000, StartDate: "2026-09-01", EndDate: "2026-09-30" }
];

const INITIAL_GOALS = [
    { GoalId: 301, UserId: 1, GoalName: "Mua Macbook Pro M4", TargetAmount: 45000000, CurrentAmount: 22500000, TargetDate: "2026-12-31" },
    { GoalId: 302, UserId: 1, GoalName: "Quỹ Dự Phòng 6 Tháng", TargetAmount: 60000000, CurrentAmount: 38000000, TargetDate: "2027-06-30" }
];

// Khởi tạo bộ nhớ LocalStorage
function initDatabase() {
    if (!localStorage.getItem('SM_USERS')) localStorage.setItem('SM_USERS', JSON.stringify(INITIAL_USERS));
    if (!localStorage.getItem('SM_CATEGORIES')) localStorage.setItem('SM_CATEGORIES', JSON.stringify(INITIAL_CATEGORIES));
    if (!localStorage.getItem('SM_ACCOUNTS')) localStorage.setItem('SM_ACCOUNTS', JSON.stringify(INITIAL_ACCOUNTS));
    if (!localStorage.getItem('SM_TRANSACTIONS')) localStorage.setItem('SM_TRANSACTIONS', JSON.stringify(INITIAL_TRANSACTIONS));
    if (!localStorage.getItem('SM_BUDGETS')) localStorage.setItem('SM_BUDGETS', JSON.stringify(INITIAL_BUDGETS));
    if (!localStorage.getItem('SM_GOALS')) localStorage.setItem('SM_GOALS', JSON.stringify(INITIAL_GOALS));
}

// Chuyển tab Đăng Nhập / Đăng Ký
function switchAuthTab(tab) {
    const loginForm = document.getElementById('form-login');
    const regForm = document.getElementById('form-register');
    const btnLogin = document.getElementById('tab-btn-login');
    const btnReg = document.getElementById('tab-btn-register');

    if (tab === 'login') {
        loginForm.classList.remove('hidden');
        regForm.classList.add('hidden');
        btnLogin.className = "flex-1 py-2.5 rounded-lg text-slate-700 bg-white shadow-sm font-semibold";
        btnReg.className = "flex-1 py-2.5 rounded-lg text-slate-500 hover:text-slate-800";
    } else {
        loginForm.classList.add('hidden');
        regForm.classList.remove('hidden');
        btnReg.className = "flex-1 py-2.5 rounded-lg text-slate-700 bg-white shadow-sm font-semibold";
        btnLogin.className = "flex-1 py-2.5 rounded-lg text-slate-500 hover:text-slate-800";
    }
}

// Xử lý Đăng nhập
function handleLogin(e) {
    e.preventDefault();
    initDatabase();

    const identifier = document.getElementById('login-username').value.trim().toLowerCase();
    const password = document.getElementById('login-password').value;
    const users = JSON.parse(localStorage.getItem('SM_USERS') || '[]');

    const user = users.find(u => 
        (u.Username.toLowerCase() === identifier || u.Email.toLowerCase() === identifier) && 
        u.PasswordHash === password
    );

    if (user) {
        localStorage.setItem('SM_LOGGED_USER', JSON.stringify(user));
        if (user.Role === 'admin') {
            window.location.href = 'admin-dashboard.html';
        } else {
            window.location.href = 'user-dashboard.html';
        }
    } else {
        alert('Tên đăng nhập hoặc mật khẩu không chính xác!');
    }
}

// Xử lý Đăng ký
function handleRegister(e) {
    e.preventDefault();
    initDatabase();

    const fullname = document.getElementById('reg-fullname').value.trim();
    const username = document.getElementById('reg-username').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;
    const confirmPassword = document.getElementById('reg-confirm-password').value;

    if (password !== confirmPassword) {
        alert('Mật khẩu nhập lại không khớp!');
        return;
    }

    const users = JSON.parse(localStorage.getItem('SM_USERS') || '[]');
    if (users.some(u => u.Username.toLowerCase() === username.toLowerCase() || u.Email.toLowerCase() === email.toLowerCase())) {
        alert('Tên đăng nhập hoặc Email đã tồn tại!');
        return;
    }

    const newUser = {
        UserId: Date.now(),
        Username: username,
        Email: email,
        PasswordHash: password,
        FullName: fullname,
        Role: 'user',
        CreatedAt: new Date().toISOString().split('T')[0]
    };

    users.push(newUser);
    localStorage.setItem('SM_USERS', JSON.stringify(users));

    // Cấp 1 ví tiền mặt ban đầu
    const accounts = JSON.parse(localStorage.getItem('SM_ACCOUNTS') || '[]');
    accounts.push({
        AccountId: Date.now() + 1,
        UserId: newUser.UserId,
        AccountName: "Ví Tiền Mặt",
        AccountType: "Cash",
        Balance: 1000000,
        Currency: "VND"
    });
    localStorage.setItem('SM_ACCOUNTS', JSON.stringify(accounts));

    alert('Đăng ký tài khoản thành công! Đang chuyển đến giao diện...');
    localStorage.setItem('SM_LOGGED_USER', JSON.stringify(newUser));
    window.location.href = 'user-dashboard.html';
}

// Nút đăng nhập thử nghiệm nhanh
function quickLogin(role) {
    initDatabase();
    const users = JSON.parse(localStorage.getItem('SM_USERS') || '[]');
    const user = users.find(u => u.Role === role);
    if (user) {
        localStorage.setItem('SM_LOGGED_USER', JSON.stringify(user));
        window.location.href = role === 'admin' ? 'admin-dashboard.html' : 'user-dashboard.html';
    }
}

// Đăng xuất chung
function logout() {
    if (confirm('Bạn có chắc chắn muốn đăng xuất?')) {
        localStorage.removeItem('SM_LOGGED_USER');
        window.location.href = 'index.html';
    }
}

// Format VNĐ
function formatVND(amount) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

// Tự chạy init khi load
initDatabase();