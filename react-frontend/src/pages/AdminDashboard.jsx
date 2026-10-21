import React from 'react';

const AdminDashboard = () => {
  // Các hàm xử lý giao diện tạm thời (mock functions)
  const switchAdminTab = (tabId) => {
    console.log(`Chuyển sang tab quản trị: ${tabId}`);
    // Thực tế bạn sẽ dùng State để quản lý việc ẩn/hiện các tab thay vì thao tác DOM trực tiếp
  };

  const logout = () => {
    console.log('Đăng xuất admin');
  };

  const openModal = (modalId) => {
    console.log(`Mở modal: ${modalId}`);
  };

  const closeModal = (modalId) => {
    console.log(`Đóng modal: ${modalId}`);
  };

  const saveAdminCategory = (e) => {
    e.preventDefault();
    console.log('Lưu danh mục hệ thống mới');
  };

  return (
    <div className="bg-slate-50 text-slate-800 min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-4 lg:px-8 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center text-xl shadow-md shadow-purple-600/30">
            <i className="fa-solid fa-shield-halved"></i>
          </div>
          <div>
            <span className="font-extrabold text-lg tracking-tight text-slate-800">SmartMoney Admin</span>
            <span className="ml-2 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">ADMIN CONTROL</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
            <div className="w-9 h-9 rounded-xl bg-purple-600 text-white font-bold flex items-center justify-center text-sm">A</div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-bold text-slate-800 leading-tight" id="admin-name">Administrator</p>
              <p className="text-[11px] text-slate-400">admin@smartmoney.vn</p>
            </div>
            <button type="button" onClick={logout} title="Đăng xuất" className="text-slate-400 hover:text-rose-600 p-1.5">
              <i className="fa-solid fa-arrow-right-from-bracket text-base"></i>
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between p-4 space-y-2">
          <div>
            <p className="text-[11px] font-bold text-purple-600 uppercase tracking-wider px-3 mb-2">Bảng Quản Trị</p>
            <nav className="space-y-1">
              <button type="button" onClick={() => switchAdminTab('overview')} id="admin-nav-overview" className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 admin-nav-active">
                <i className="fa-solid fa-gauge text-purple-600"></i> Tổng quan
              </button>
              <button type="button" onClick={() => switchAdminTab('users')} id="admin-nav-users" className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100">
                <i className="fa-solid fa-users text-indigo-600"></i> Quản lý người dùng
              </button>
              <button type="button" onClick={() => switchAdminTab('categories')} id="admin-nav-categories" className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100">
                <i className="fa-solid fa-tags text-pink-600"></i> Danh mục hệ thống
              </button>
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8 space-y-6">

          {/* TAB 1: OVERVIEW */}
          <div id="admin-tab-overview" className="admin-pane space-y-6">
            <div className="bg-gradient-to-r from-purple-800 to-indigo-900 p-6 rounded-3xl text-white shadow-xl">
              <h2 className="text-2xl font-black">Trung Tâm Quản Trị Hệ Thống</h2>
              <p className="text-purple-200 text-xs mt-1">Giám sát tổng thể người dùng, dung lượng và các danh mục mặc định.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-xs font-bold uppercase text-slate-400">Tổng Người Dùng</span>
                <h3 className="text-3xl font-black text-slate-800 mt-2" id="admin-stat-users">0</h3>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-xs font-bold uppercase text-slate-400">Tổng Giao Dịch Hệ Thống</span>
                <h3 className="text-3xl font-black text-indigo-600 mt-2" id="admin-stat-trans">0</h3>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-xs font-bold uppercase text-slate-400">Danh Mục Mặc Định</span>
                <h3 className="text-3xl font-black text-pink-600 mt-2" id="admin-stat-cats">0</h3>
              </div>
            </div>
          </div>

          {/* TAB 2: QUẢN LÝ USER */}
          <div id="admin-tab-users" className="admin-pane hidden space-y-4">
            <h2 className="text-2xl font-black text-slate-800">Danh Sách Người Dùng</h2>
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase border-b border-slate-200">
                  <tr>
                    <th className="p-3">User ID</th>
                    <th className="p-3">Họ và Tên</th>
                    <th className="p-3">Username</th>
                    <th className="p-3">Email</th>
                    <th className="p-3">Vai Trò</th>
                    <th className="p-3">Ngày Tạo</th>
                    <th className="p-3 text-center">Xóa</th>
                  </tr>
                </thead>
                <tbody id="admin-users-table" className="divide-y divide-slate-100"></tbody>
              </table>
            </div>
          </div>

          {/* TAB 3: DANH MỤC HỆ THỐNG */}
          <div id="admin-tab-categories" className="admin-pane hidden space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-black text-slate-800">Danh Mục Hệ Thống Cung Cấp Sẵn</h2>
              <button type="button" onClick={() => openModal('modal-admin-cat')} className="px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-bold">+ Thêm Danh Mục</button>
            </div>
            <div id="admin-categories-container" className="grid grid-cols-1 md:grid-cols-4 gap-4"></div>
          </div>

        </main>
      </div>

      {/* MODAL THÊM DANH MỤC HỆ THỐNG */}
      <div id="modal-admin-cat" className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm hidden z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-3">
          <h3 className="font-bold text-lg text-slate-800">Thêm Danh Mục Hệ Thống</h3>
          <form onSubmit={saveAdminCategory} className="space-y-3 text-xs">
            <input type="text" id="admin-cat-name" required placeholder="Tên danh mục (VD: Đầu tư, Giáo dục...)" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold" />
            <select id="admin-cat-type" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
              <option value="Expense">Khoản Chi (Expense)</option>
              <option value="Income">Khoản Thu (Income)</option>
            </select>
            <input type="text" id="admin-cat-icon" defaultValue="fa-tag" placeholder="Icon (VD: fa-tag, fa-car)" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl" />
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => closeModal('modal-admin-cat')} className="flex-1 py-2.5 bg-slate-100 rounded-xl font-bold">Hủy</button>
              <button type="submit" className="flex-1 py-2.5 bg-purple-600 text-white rounded-xl font-bold">Tạo Danh Mục</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;