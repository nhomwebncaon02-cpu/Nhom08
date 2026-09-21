/**
 * js/admin.js - Quản lý chức năng Quản trị viên
 */

function checkAdminAuth() {
    const session = localStorage.getItem('SM_LOGGED_USER');
    if (!session) {
        window.location.href = 'index.html';
        return;
    }
    const user = JSON.parse(session);
    if (user.Role !== 'admin') {
        alert('Bạn không có quyền truy cập vào trang Quản trị!');
        window.location.href = 'user-dashboard.html';
        return;
    }
    document.getElementById('admin-name').innerText = user.FullName;
    renderAdminData();
}

function switchAdminTab(tabId) {
    document.querySelectorAll('.admin-pane').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('aside nav button').forEach(el => el.classList.remove('admin-nav-active'));

    document.getElementById(`admin-tab-${tabId}`).classList.remove('hidden');
    document.getElementById(`admin-nav-${tabId}`).classList.add('admin-nav-active');

    renderAdminData();
}

function renderAdminData() {
    const users = JSON.parse(localStorage.getItem('SM_USERS') || '[]');
    const trans = JSON.parse(localStorage.getItem('SM_TRANSACTIONS') || '[]');
    const cats = JSON.parse(localStorage.getItem('SM_CATEGORIES') || '[]');

    document.getElementById('admin-stat-users').innerText = users.length;
    document.getElementById('admin-stat-trans').innerText = trans.length;
    document.getElementById('admin-stat-cats').innerText = cats.filter(c => c.UserId === null).length;

    // Users Table
    const usersTable = document.getElementById('admin-users-table');
    if (usersTable) {
        usersTable.innerHTML = users.map(u => `
            <tr class="hover:bg-slate-50">
                <td class="p-3 font-mono font-bold">#${u.UserId}</td>
                <td class="p-3 font-bold text-slate-800">${u.FullName}</td>
                <td class="p-3 text-slate-600">${u.Username}</td>
                <td class="p-3 text-slate-500">${u.Email}</td>
                <td class="p-3"><span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${u.Role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'}">${u.Role.toUpperCase()}</span></td>
                <td class="p-3 text-slate-400">${u.CreatedAt}</td>
                <td class="p-3 text-center"><button onclick="deleteUser(${u.UserId})" class="text-rose-500 hover:text-rose-700 text-xs font-bold">Xóa</button></td>
            </tr>
        `).join('');
    }

    // Categories Grid
    const catsContainer = document.getElementById('admin-categories-container');
    if (catsContainer) {
        catsContainer.innerHTML = cats.map(c => `
            <div class="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <div class="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-sm">
                        <i class="fa-solid ${c.Icon || 'fa-tag'}"></i>
                    </div>
                    <div>
                        <p class="font-bold text-slate-800 text-xs">${c.CategoryName}</p>
                        <span class="text-[10px] font-bold ${c.Type === 'Income' ? 'text-emerald-600' : 'text-rose-600'}">${c.Type}</span>
                    </div>
                </div>
                <span class="text-[10px] px-2 py-0.5 bg-slate-100 rounded text-slate-500 font-bold">${c.UserId ? 'Custom' : 'System'}</span>
            </div>
        `).join('');
    }
}

function saveAdminCategory(e) {
    e.preventDefault();
    const name = document.getElementById('admin-cat-name').value;
    const type = document.getElementById('admin-cat-type').value;
    const icon = document.getElementById('admin-cat-icon').value || 'fa-tag';

    const cats = JSON.parse(localStorage.getItem('SM_CATEGORIES') || '[]');
    cats.push({ CategoryId: Date.now(), UserId: null, CategoryName: name, Type: type, Icon: icon });
    localStorage.setItem('SM_CATEGORIES', JSON.stringify(cats));

    closeModal('modal-admin-cat');
    e.target.reset();
    renderAdminData();
    alert('Thêm danh mục hệ thống thành công!');
}

function deleteUser(id) {
    const session = JSON.parse(localStorage.getItem('SM_LOGGED_USER') || '{}');
    if (id === session.UserId) {
        alert('Không thể tự xóa tài khoản đang đăng nhập!');
        return;
    }
    if (confirm('Bạn có chắc muốn xóa người dùng này khỏi hệ thống?')) {
        let users = JSON.parse(localStorage.getItem('SM_USERS') || '[]');
        users = users.filter(u => u.UserId !== id);
        localStorage.setItem('SM_USERS', JSON.stringify(users));
        renderAdminData();
    }
}

function openModal(id) { document.getElementById(id).classList.remove('hidden'); }
function closeModal(id) { document.getElementById(id).classList.add('hidden'); }

window.addEventListener('DOMContentLoaded', checkAdminAuth);