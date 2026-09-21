/**
 * js/user.js - Quản lý chức năng người dùng cá nhân
 */

let currentUser = null;
let cashflowChartInstance = null;
let categoryChartInstance = null;

// Kiểm tra phiên đăng nhập
function checkUserAuth() {
    const session = localStorage.getItem('SM_LOGGED_USER');
    if (!session) {
        window.location.href = 'index.html';
        return;
    }
    currentUser = JSON.parse(session);
    document.getElementById('user-name').innerText = currentUser.FullName;
    document.getElementById('welcome-name').innerText = currentUser.FullName;
    document.getElementById('user-email').innerText = currentUser.Email;
    document.getElementById('user-avatar').innerText = currentUser.FullName.charAt(0).toUpperCase();

    // Set default date picker
    const today = new Date().toISOString().split('T')[0];
    if (document.getElementById('modal-trans-date')) document.getElementById('modal-trans-date').value = today;
    if (document.getElementById('modal-budget-start')) document.getElementById('modal-budget-start').value = "2026-09-01";
    if (document.getElementById('modal-budget-end')) document.getElementById('modal-budget-end').value = "2026-09-30";
    if (document.getElementById('modal-goal-date')) document.getElementById('modal-goal-date').value = "2026-12-31";

    loadCategoryOptions('Expense');
    loadWalletOptions();
    renderAllUserData();
}

function switchTab(tabId) {
    document.querySelectorAll('.tab-pane').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('#sidebar nav button').forEach(el => el.classList.remove('nav-active'));

    document.getElementById(`tab-${tabId}`).classList.remove('hidden');
    document.getElementById(`nav-${tabId}`).classList.add('nav-active');

    renderAllUserData();
}

function renderAllUserData() {
    const accounts = JSON.parse(localStorage.getItem('SM_ACCOUNTS') || '[]').filter(a => a.UserId === currentUser.UserId);
    const myAccountIds = accounts.map(a => a.AccountId);
    const transactions = JSON.parse(localStorage.getItem('SM_TRANSACTIONS') || '[]').filter(t => myAccountIds.includes(t.AccountId));
    const categories = JSON.parse(localStorage.getItem('SM_CATEGORIES') || '[]');
    const budgets = JSON.parse(localStorage.getItem('SM_BUDGETS') || '[]').filter(b => b.UserId === currentUser.UserId);
    const goals = JSON.parse(localStorage.getItem('SM_GOALS') || '[]').filter(g => g.UserId === currentUser.UserId);

    // 1. Stats
    const totalBalance = accounts.reduce((sum, a) => sum + Number(a.Balance), 0);
    let totalIncome = 0;
    let totalExpense = 0;

    transactions.forEach(t => {
        const cat = categories.find(c => c.CategoryId === t.CategoryId);
        if (cat) {
            if (cat.Type === 'Income') totalIncome += Number(t.Amount);
            if (cat.Type === 'Expense') totalExpense += Number(t.Amount);
        }
    });

    const totalSavings = goals.reduce((sum, g) => sum + Number(g.CurrentAmount), 0);

    document.getElementById('stat-total-balance').innerText = formatVND(totalBalance);
    document.getElementById('stat-total-income').innerText = "+" + formatVND(totalIncome);
    document.getElementById('stat-total-expense').innerText = "-" + formatVND(totalExpense);
    document.getElementById('stat-total-goal').innerText = formatVND(totalSavings);

    // 2. Wallets list
    const walletContainer = document.getElementById('wallets-container');
    if (walletContainer) {
        walletContainer.innerHTML = accounts.map(w => `
            <div class="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between h-40">
                <div class="flex justify-between items-center">
                    <span class="text-xs font-bold uppercase text-slate-400">${w.AccountType}</span>
                    <button onclick="deleteWallet(${w.AccountId})" class="text-rose-500 hover:underline text-xs">Xóa</button>
                </div>
                <div>
                    <p class="text-xs font-medium text-slate-500">${w.AccountName}</p>
                    <h3 class="text-2xl font-black text-slate-800">${formatVND(w.Balance)}</h3>
                </div>
                <span class="text-[11px] text-emerald-600 font-bold">● Hoạt động</span>
            </div>
        `).join('') || '<p class="text-slate-400">Chưa có ví nào.</p>';
    }

    // 3. Transactions table
    const transTable = document.getElementById('transactions-table');
    if (transTable) {
        transTable.innerHTML = transactions.sort((a,b) => new Date(b.TransactionDate) - new Date(a.TransactionDate)).map(t => {
            const cat = categories.find(c => c.CategoryId === t.CategoryId) || { CategoryName: 'Khác', Type: 'Expense' };
            const wallet = accounts.find(a => a.AccountId === t.AccountId) || { AccountName: 'Ví' };
            const isInc = cat.Type === 'Income';
            return `
                <tr class="hover:bg-slate-50">
                    <td class="p-3 font-bold text-slate-800">${cat.CategoryName}</td>
                    <td class="p-3 text-slate-600">${wallet.AccountName}</td>
                    <td class="p-3 text-slate-500">${t.Note || '—'}</td>
                    <td class="p-3 text-slate-400">${t.TransactionDate}</td>
                    <td class="p-3 text-right font-black ${isInc ? 'text-emerald-600' : 'text-rose-600'}">${isInc ? '+' : '-'}${formatVND(t.Amount)}</td>
                    <td class="p-3 text-center"><button onclick="deleteTransaction(${t.TransactionId})" class="text-slate-400 hover:text-rose-500"><i class="fa-solid fa-trash"></i></button></td>
                </tr>
            `;
        }).join('') || '<tr><td colspan="6" class="text-center p-4 text-slate-400">Chưa có giao dịch nào</td></tr>';
    }

    // 4. Budgets container
    const budgetsContainer = document.getElementById('budgets-container');
    if (budgetsContainer) {
        budgetsContainer.innerHTML = budgets.map(b => {
            const cat = categories.find(c => c.CategoryId === b.CategoryId) || { CategoryName: 'Hạng mục' };
            const spent = transactions.filter(t => t.CategoryId === b.CategoryId).reduce((sum, t) => sum + Number(t.Amount), 0);
            const percent = Math.min(Math.round((spent / b.AmountLimit) * 100), 100);
            const isOver = spent > b.AmountLimit;
            return `
                <div class="p-5 bg-white rounded-2xl border ${isOver ? 'border-rose-300 ring-2 ring-rose-100' : 'border-slate-200'} shadow-sm space-y-3">
                    <div class="flex justify-between items-center">
                        <h4 class="font-bold text-slate-800 text-sm">${cat.CategoryName}</h4>
                        <button onclick="deleteBudget(${b.BudgetId})" class="text-slate-300 hover:text-rose-500"><i class="fa-solid fa-trash text-xs"></i></button>
                    </div>
                    <div class="flex justify-between text-xs">
                        <span>Đã chi: <b>${formatVND(spent)}</b></span>
                        <span class="text-slate-400">Hạn mức: ${formatVND(b.AmountLimit)}</span>
                    </div>
                    <div class="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <div class="h-full ${isOver ? 'bg-rose-500' : 'bg-emerald-500'}" style="width: ${percent}%"></div>
                    </div>
                    <span class="text-xs font-bold ${isOver ? 'text-rose-600' : 'text-emerald-600'}">${isOver ? '⚠ VƯỢT HẠN MỨC!' : `Còn lại: ${formatVND(Math.max(0, b.AmountLimit - spent))}`}</span>
                </div>
            `;
        }).join('') || '<p class="text-slate-400">Chưa có hạn mức nào.</p>';
    }

    // 5. Goals container
    const goalsContainer = document.getElementById('goals-container');
    if (goalsContainer) {
        goalsContainer.innerHTML = goals.map(g => {
            const percent = Math.min(Math.round((g.CurrentAmount / g.TargetAmount) * 100), 100);
            return `
                <div class="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3">
                    <div class="flex justify-between items-center">
                        <h4 class="font-bold text-slate-800 text-sm">${g.GoalName}</h4>
                        <button onclick="deleteGoal(${g.GoalId})" class="text-slate-300 hover:text-rose-500"><i class="fa-solid fa-trash text-xs"></i></button>
                    </div>
                    <div class="flex justify-between text-xs">
                        <span class="text-amber-600 font-bold">${formatVND(g.CurrentAmount)}</span>
                        <span class="text-slate-400">Mục tiêu: ${formatVND(g.TargetAmount)}</span>
                    </div>
                    <div class="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <div class="h-full bg-amber-500" style="width: ${percent}%"></div>
                    </div>
                    <div class="flex justify-between items-center pt-2">
                        <span class="text-xs font-bold text-slate-400">${percent}% hoàn thành</span>
                        <button onclick="depositGoal(${g.GoalId})" class="px-2.5 py-1 bg-amber-50 text-amber-700 font-bold text-xs rounded-lg">+ Nạp tiền</button>
                    </div>
                </div>
            `;
        }).join('') || '<p class="text-slate-400">Chưa có mục tiêu nào.</p>';
    }

    renderCharts(transactions, categories);
}

function renderCharts(transactions, categories) {
    // 1. Biểu đồ Cashflow
    const ctxCashflow = document.getElementById('userCashflowChart')?.getContext('2d');
    if (ctxCashflow) {
        if (cashflowChartInstance) cashflowChartInstance.destroy();
        cashflowChartInstance = new Chart(ctxCashflow, {
            type: 'bar',
            data: {
                labels: ['T5', 'T6', 'T7', 'T8', 'T9'],
                datasets: [
                    { label: 'Thu Nhập', data: [19000000, 20000000, 21000000, 20000000, 22000000], backgroundColor: '#10b981', borderRadius: 6 },
                    { label: 'Chi Tiêu', data: [14000000, 11500000, 16000000, 13800000, 9500000], backgroundColor: '#f43f5e', borderRadius: 6 }
                ]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    }

    // 2. Biểu đồ Danh mục
    const ctxCat = document.getElementById('userCategoryChart')?.getContext('2d');
    if (ctxCat) {
        if (categoryChartInstance) categoryChartInstance.destroy();
        categoryChartInstance = new Chart(ctxCat, {
            type: 'doughnut',
            data: {
                labels: ['Ăn uống', 'Tiền nhà', 'Đi lại', 'Mua sắm'],
                datasets: [{
                    data: [3500000, 3500000, 120000, 850000],
                    backgroundColor: ['#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899']
                }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    }
}

// Modal Helpers
function openModal(id) { document.getElementById(id).classList.remove('hidden'); }
function closeModal(id) { document.getElementById(id).classList.add('hidden'); }
function toggleSidebar() { document.getElementById('sidebar').classList.toggle('-translate-x-full'); }

function loadCategoryOptions(type) {
    const cats = JSON.parse(localStorage.getItem('SM_CATEGORIES') || '[]').filter(c => c.Type === type);
    const el = document.getElementById('modal-trans-category');
    const budgetCat = document.getElementById('modal-budget-category');
    if (el) el.innerHTML = cats.map(c => `<option value="${c.CategoryId}">${c.CategoryName}</option>`).join('');
    if (budgetCat) budgetCat.innerHTML = JSON.parse(localStorage.getItem('SM_CATEGORIES') || '[]').filter(c => c.Type === 'Expense').map(c => `<option value="${c.CategoryId}">${c.CategoryName}</option>`).join('');
}

function loadWalletOptions() {
    const accounts = JSON.parse(localStorage.getItem('SM_ACCOUNTS') || '[]').filter(a => a.UserId === currentUser.UserId);
    const el = document.getElementById('modal-trans-wallet');
    if (el) el.innerHTML = accounts.map(a => `<option value="${a.AccountId}">${a.AccountName} (${formatVND(a.Balance)})</option>`).join('');
}

// Form Handlers
function saveTransaction(e) {
    e.preventDefault();
    const type = document.getElementById('modal-trans-type').value;
    const amount = Number(document.getElementById('modal-trans-amount').value);
    const catId = Number(document.getElementById('modal-trans-category').value);
    const accId = Number(document.getElementById('modal-trans-wallet').value);
    const date = document.getElementById('modal-trans-date').value;
    const note = document.getElementById('modal-trans-note').value;

    const trans = JSON.parse(localStorage.getItem('SM_TRANSACTIONS') || '[]');
    trans.push({ TransactionId: Date.now(), AccountId: accId, CategoryId: catId, Amount: amount, TransactionDate: date, Note: note });
    localStorage.setItem('SM_TRANSACTIONS', JSON.stringify(trans));

    // Update Wallet Balance
    const accounts = JSON.parse(localStorage.getItem('SM_ACCOUNTS') || '[]');
    const acc = accounts.find(a => a.AccountId === accId);
    if (acc) {
        acc.Balance = type === 'Expense' ? Number(acc.Balance) - amount : Number(acc.Balance) + amount;
        localStorage.setItem('SM_ACCOUNTS', JSON.stringify(accounts));
    }

    closeModal('modal-transaction');
    e.target.reset();
    renderAllUserData();
    loadWalletOptions();
}

function saveWallet(e) {
    e.preventDefault();
    const name = document.getElementById('modal-wallet-name').value;
    const type = document.getElementById('modal-wallet-type').value;
    const balance = Number(document.getElementById('modal-wallet-balance').value);

    const accounts = JSON.parse(localStorage.getItem('SM_ACCOUNTS') || '[]');
    accounts.push({ AccountId: Date.now(), UserId: currentUser.UserId, AccountName: name, AccountType: type, Balance: balance, Currency: 'VND' });
    localStorage.setItem('SM_ACCOUNTS', JSON.stringify(accounts));

    closeModal('modal-wallet');
    e.target.reset();
    renderAllUserData();
    loadWalletOptions();
}

function saveBudget(e) {
    e.preventDefault();
    const catId = Number(document.getElementById('modal-budget-category').value);
    const limit = Number(document.getElementById('modal-budget-limit').value);
    const start = document.getElementById('modal-budget-start').value;
    const end = document.getElementById('modal-budget-end').value;

    const budgets = JSON.parse(localStorage.getItem('SM_BUDGETS') || '[]');
    budgets.push({ BudgetId: Date.now(), UserId: currentUser.UserId, CategoryId: catId, AmountLimit: limit, StartDate: start, EndDate: end });
    localStorage.setItem('SM_BUDGETS', JSON.stringify(budgets));

    closeModal('modal-budget');
    e.target.reset();
    renderAllUserData();
}

function saveGoal(e) {
    e.preventDefault();
    const name = document.getElementById('modal-goal-name').value;
    const target = Number(document.getElementById('modal-goal-target').value);
    const current = Number(document.getElementById('modal-goal-current').value) || 0;
    const date = document.getElementById('modal-goal-date').value;

    const goals = JSON.parse(localStorage.getItem('SM_GOALS') || '[]');
    goals.push({ GoalId: Date.now(), UserId: currentUser.UserId, GoalName: name, TargetAmount: target, CurrentAmount: current, TargetDate: date });
    localStorage.setItem('SM_GOALS', JSON.stringify(goals));

    closeModal('modal-goal');
    e.target.reset();
    renderAllUserData();
}

function depositGoal(goalId) {
    const amountStr = prompt('Nhập số tiền bạn muốn nạp vào mục tiêu này (VNĐ):', '500000');
    if (!amountStr) return;
    const amount = Number(amountStr);
    const goals = JSON.parse(localStorage.getItem('SM_GOALS') || '[]');
    const g = goals.find(x => x.GoalId === goalId);
    if (g) {
        g.CurrentAmount = Number(g.CurrentAmount) + amount;
        localStorage.setItem('SM_GOALS', JSON.stringify(goals));
        renderAllUserData();
        alert('Nạp tiền thành công!');
    }
}

// Delete functions
function deleteTransaction(id) {
    if (confirm('Xóa giao dịch này?')) {
        let trans = JSON.parse(localStorage.getItem('SM_TRANSACTIONS') || '[]');
        trans = trans.filter(t => t.TransactionId !== id);
        localStorage.setItem('SM_TRANSACTIONS', JSON.stringify(trans));
        renderAllUserData();
    }
}

function deleteWallet(id) {
    if (confirm('Xóa ví này?')) {
        let accs = JSON.parse(localStorage.getItem('SM_ACCOUNTS') || '[]');
        accs = accs.filter(a => a.AccountId !== id);
        localStorage.setItem('SM_ACCOUNTS', JSON.stringify(accs));
        renderAllUserData();
    }
}

function deleteBudget(id) {
    if (confirm('Xóa hạn mức này?')) {
        let b = JSON.parse(localStorage.getItem('SM_BUDGETS') || '[]');
        b = b.filter(x => x.BudgetId !== id);
        localStorage.setItem('SM_BUDGETS', JSON.stringify(b));
        renderAllUserData();
    }
}

function deleteGoal(id) {
    if (confirm('Xóa mục tiêu này?')) {
        let g = JSON.parse(localStorage.getItem('SM_GOALS') || '[]');
        g = g.filter(x => x.GoalId !== id);
        localStorage.setItem('SM_GOALS', JSON.stringify(g));
        renderAllUserData();
    }
}

// Run on page load
window.addEventListener('DOMContentLoaded', checkUserAuth);