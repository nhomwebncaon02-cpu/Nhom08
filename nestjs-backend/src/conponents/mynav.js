function BasicExample({ query, onQueryChange, darkMode, onToggleTheme }) {
  return (
    <header className="sm-navbar">
      <a className="sm-brand" href="#home" aria-label="SmartMoney - Trang chủ">
        <span className="sm-brand-mark" aria-hidden="true">SM</span>
        <span>SmartMoney</span>
      </a>
      <nav className="sm-nav-links" aria-label="Điều hướng chính">
        <a href="#overview">Tổng quan</a>
        <a href="#reports">Báo cáo</a>
        <a href="#budgets">Ngân sách</a>
        <a href="#transactions">Giao dịch</a>
        <a href="#api-data">Dữ liệu</a>
        <a className="sm-login-link" href="auth.html">Đăng nhập</a>
      </nav>
      <div className="sm-nav-tools">
        <button className="sm-icon-button sm-theme-toggle" type="button" aria-label={darkMode ? 'Bật giao diện sáng' : 'Bật giao diện tối'} title={darkMode ? 'Giao diện sáng' : 'Giao diện tối'} onClick={onToggleTheme}>
          <span aria-hidden="true">{darkMode ? '☼' : '◐'}</span>
        </button>
        <label className="sm-search">
          <span aria-hidden="true">⌕</span>
          <input
            id="smartmoney-search"
            type="search"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Tìm giao dịch"
            aria-label="Tìm giao dịch"
          />
          <kbd>Ctrl K</kbd>
        </label>
      </div>
    </header>
  );
}

export default BasicExample;