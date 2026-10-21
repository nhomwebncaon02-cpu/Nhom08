import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import Footer from '../../nestjs-backend/src/conponents/Footer.js';
import MyNav from '../../nestjs-backend/src/conponents/mynav.js';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../../css/App.css';

const demoTransactions = [
  { id: 1, name: 'Siêu thị An Nam', category: 'Ăn uống', amount: 420000, type: 'expense', date: '2026-10-12', active: true },
  { id: 2, name: 'Lương tháng 10', category: 'Thu nhập', amount: 18500000, type: 'income', date: '2026-10-11', active: true },
  { id: 3, name: 'Xanh SM', category: 'Di chuyển', amount: 86000, type: 'expense', date: '2026-10-11', active: true },
  { id: 4, name: 'Cà phê Góc Phố', category: 'Ăn uống', amount: 65000, type: 'expense', date: '2026-10-10', active: true },
  { id: 5, name: 'Điện lực TP.HCM', category: 'Hóa đơn', amount: 530000, type: 'expense', date: '2026-10-09', active: false },
];

const weeklySpending = [
  { day: 'T2', value: 38 },
  { day: 'T3', value: 57 },
  { day: 'T4', value: 43 },
  { day: 'T5', value: 72 },
  { day: 'T6', value: 51 },
  { day: 'T7', value: 88 },
  { day: 'CN', value: 64 },
];

const budgets = [
  { name: 'Ăn uống', spent: '2.150.000 đ', limit: '3.000.000 đ', progress: 72, color: 'green' },
  { name: 'Di chuyển', spent: '680.000 đ', limit: '1.200.000 đ', progress: 57, color: 'blue' },
  { name: 'Giải trí', spent: '920.000 đ', limit: '1.000.000 đ', progress: 92, color: 'coral' },
];

const transactions = [
  { mark: 'A', title: 'Siêu thị An Nam', category: 'Ăn uống', date: 'Hôm nay, 09:42', amount: '- 420.000 đ', type: 'expense' },
  { mark: 'L', title: 'Lương tháng 10', category: 'Thu nhập', date: 'Hôm qua, 08:15', amount: '+ 18.500.000 đ', type: 'income' },
  { mark: 'X', title: 'Xanh SM', category: 'Di chuyển', date: '11 thg 10, 18:30', amount: '- 86.000 đ', type: 'expense' },
  { mark: 'C', title: 'Cà phê Góc Phố', category: 'Ăn uống', date: '11 thg 10, 09:10', amount: '- 65.000 đ', type: 'expense' },
];

function Dashboard() {
  const [apiData, setApiData] = useState([]);
  const [apiTotal, setApiTotal] = useState(0);
  const [apiLoading, setApiLoading] = useState(true);
  const [apiError, setApiError] = useState('');
  const [apiLimit, setApiLimit] = useState('5');
  const [query, setQuery] = useState('');
  const [darkMode, setDarkMode] = useState(false);

  const loadApiData = async (requestedLimit = apiLimit) => {
    setApiLoading(true);
    setApiError('');

    try {
      const limitQuery = requestedLimit === 'all' ? '' : `?limit=${requestedLimit}`;
      const response = await fetch(`/api/data${limitQuery}`);
      if (!response.ok) {
        throw new Error(`API trả về HTTP ${response.status}`);
      }
      const result = await response.json();
      if (!Array.isArray(result.items)) {
        throw new Error('Dữ liệu API không đúng định dạng.');
      }
      setApiData(result.items);
      setApiTotal(result.total);
      setApiError('');
    } catch (error) {
      const fallbackLimit = requestedLimit === 'all'
        ? demoTransactions.length
        : Number.parseInt(requestedLimit, 10) || demoTransactions.length;
      setApiData(demoTransactions.slice(0, fallbackLimit));
      setApiTotal(demoTransactions.length);
      setApiError(error.message || 'Không thể kết nối tới API.');
    } finally {
      setApiLoading(false);
    }
  };

  useEffect(() => {
    loadApiData();
  }, []);

  useEffect(() => {
    const handleSearchShortcut = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        document.getElementById('smartmoney-search')?.focus();
      }
    };

    window.addEventListener('keydown', handleSearchShortcut);
    return () => window.removeEventListener('keydown', handleSearchShortcut);
  }, []);

  const filteredTransactions = transactions.filter((transaction) =>
    `${transaction.title} ${transaction.category}`.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className={`sm-app ${darkMode ? 'is-dark' : ''}`}>
      <MyNav query={query} onQueryChange={setQuery} darkMode={darkMode} onToggleTheme={() => setDarkMode(!darkMode)} />
      <section className="sm-hero" id="home" aria-labelledby="hero-title">
        <div className="hero-grid" aria-hidden="true">
          <span className="hero-symbol symbol-wallet">▣</span>
          <span className="hero-symbol symbol-chart">⌁</span>
          <span className="hero-symbol symbol-target">◎</span>
          <span className="hero-symbol symbol-coins">◉</span>
        </div>
        <div className="hero-copy">
          <span className="hero-mark" aria-hidden="true">SM</span>
          <p className="banner-eyebrow">QUẢN LÝ TÀI CHÍNH CÁ NHÂN</p>
          <h1 id="hero-title">SmartMoney</h1>
          <p className="hero-tagline">Chủ động chi tiêu. Tự tin cho mục tiêu.</p>
          <div className="hero-actions">
            <a className="hero-primary" href="auth.html">Bắt đầu ngay</a>
            <a className="hero-secondary" href="#features">Khám phá tính năng</a>
          </div>
        </div>
        <div className="product-stage" aria-label="Bản xem trước dashboard SmartMoney">
          <div className="stage-backdrop" />
          <div className="stage-window stage-desktop">
            <div className="stage-window-bar"><span /><span /><span /><b>SmartMoney / Tổng quan</b></div>
            <div className="stage-dashboard">
              <div className="stage-side"><i /><i /><i /><i /></div>
              <div className="stage-content">
                <span className="stage-kicker">SỐ DƯ HIỆN TẠI</span>
                <strong>28.460.000 đ</strong>
                <div className="stage-chart"><i /><i /><i /><i /><i /><i /><i /></div>
              </div>
            </div>
          </div>
          <div className="stage-window stage-mobile">
            <span className="stage-mobile-camera" />
            <span className="stage-kicker">TỔNG SỐ DƯ</span>
            <strong>28,46 triệu</strong>
            <span className="stage-mobile-track"><i /></span>
            <span className="stage-mobile-row"><i /> Giao dịch gần đây</span>
            <span className="stage-mobile-row"><i /> Ngân sách tháng</span>
          </div>
        </div>
      </section>
      <section className="feature-section" id="features" aria-labelledby="feature-title">
        <div className="feature-intro">
          <p className="eyebrow">MỌI THỨ TRONG TẦM MẮT</p>
          <h2 id="feature-title">Tài chính cá nhân, đơn giản hơn</h2>
          <p>Theo dõi dòng tiền, kiểm soát ngân sách và tiến gần hơn tới những mục tiêu quan trọng.</p>
        </div>
        <div className="feature-cards">
          <a className="feature-card" href="#reports">
            <div className="feature-art art-ledger"><span>THU <b>+18,5 tr</b></span><span>CHI <b>-8,7 tr</b></span><i /></div>
            <div className="feature-card-copy"><h3>Theo dõi dòng tiền</h3><p>Nhìn rõ các khoản thu, chi và biến động theo thời gian.</p></div>
          </a>
          <a className="feature-card" href="#budgets">
            <div className="feature-art art-budget"><span>NGÂN SÁCH THÁNG</span><strong>72%</strong><i /></div>
            <div className="feature-card-copy"><h3>Giữ ngân sách đúng hướng</h3><p>Quan sát hạn mức từng danh mục trước khi vượt kế hoạch.</p></div>
          </a>
          <a className="feature-card" href="#overview">
            <div className="feature-art art-goal"><span>MỤC TIÊU TIẾT KIỆM</span><strong>68%</strong><i /></div>
            <div className="feature-card-copy"><h3>Tiến gần mục tiêu</h3><p>Theo dõi khoản tích lũy và chặng đường còn lại.</p></div>
          </a>
        </div>
      </section>
      <section className="product-explainer" aria-labelledby="explainer-title">
        <div className="explainer-copy">
          <p className="eyebrow">MỘT GÓC NHÌN RÕ RÀNG</p>
          <h2 id="explainer-title">Biết tiền đến từ đâu và đang đi về đâu.</h2>
          <p>SmartMoney gom các tài khoản, giao dịch và kế hoạch vào một nơi. Từ bức tranh tổng quan đến từng khoản nhỏ, thông tin luôn dễ theo dõi.</p>
          <a className="text-link" href="#reports">Xem báo cáo <span aria-hidden="true">→</span></a>
        </div>
        <div className="explainer-visual" aria-label="Biểu đồ thu chi theo tháng">
          <div className="explainer-window-bar"><span /> Dòng tiền theo tháng</div>
          <div className="explainer-legend"><span><i /> Thu nhập</span><span><i /> Chi tiêu</span></div>
          <div className="explainer-chart">
            {[58, 76, 47, 88, 66, 96].map((height, index) => (
              <div className="explainer-bar-pair" key={index}>
                <i style={{ height: `${height}%` }} />
                <b style={{ height: `${Math.max(26, height - 25)}%` }} />
              </div>
            ))}
          </div>
          <div className="explainer-months"><span>T5</span><span>T6</span><span>T7</span><span>T8</span><span>T9</span><span>T10</span></div>
        </div>
      </section>
      <section className="platform-section" aria-labelledby="platform-title">
        <div className="platform-copy">
          <p className="eyebrow">LINH HOẠT TRÊN MỌI THIẾT BỊ</p>
          <h2 id="platform-title">Một thói quen tốt, bắt đầu từ những thao tác nhỏ.</h2>
          <p>Ghi lại giao dịch, xem hạn mức và theo dõi mục tiêu trong cùng một trải nghiệm nhất quán.</p>
          <div className="platform-points">
            <span><i>✓</i> Ví và tài khoản</span>
            <span><i>✓</i> Ngân sách theo danh mục</span>
            <span><i>✓</i> Mục tiêu tiết kiệm</span>
          </div>
        </div>
        <div className="platform-visual" aria-hidden="true">
          <div className="platform-browser"><span /><span /><span /><div className="platform-browser-chart"><i /><i /><i /><i /></div></div>
          <div className="platform-phone"><span /><b>Ví của bạn</b><strong>28.460.000 đ</strong><i /><i /><i /></div>
          <div className="platform-tablet"><span /><span /><span /><b>Chi tiêu tháng này</b><strong>8.740.000 đ</strong><i /></div>
        </div>
      </section>
      <main className="dashboard-shell" id="overview">
        <div className="page-meta">
          <span>KHÔNG GIAN CỦA MINH ANH</span>
          <time dateTime="2026-10-12">THỨ HAI, 12 THÁNG 10, 2026</time>
        </div>

        <section className="welcome-row" aria-labelledby="welcome-title">
          <div>
            <p className="eyebrow">TỔNG QUAN TÀI CHÍNH</p>
            <h1 id="welcome-title">Chào Minh Anh.</h1>
            <p className="welcome-note">Đây là bức tranh chi tiêu của bạn trong tháng này.</p>
          </div>
          <button className="add-transaction" type="button">
            <span aria-hidden="true">+</span> Thêm giao dịch
          </button>
        </section>

        <section className="panel api-example-panel" id="api-data" aria-labelledby="api-example-title">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">VÍ DỤ KẾT NỐI BACKEND</p>
              <h2 id="api-example-title">Fetch API từ NestJS</h2>
            </div>
            <div className="api-controls">
              <label className="api-limit-control">
                <span>Số bản ghi</span>
                <select
                  value={apiLimit}
                  onChange={(event) => {
                    setApiLimit(event.target.value);
                    loadApiData(event.target.value);
                  }}
                >
                  <option value="2">2</option>
                  <option value="5">5</option>
                  <option value="all">Tất cả</option>
                </select>
              </label>
              <button className="api-retry" type="button" onClick={() => loadApiData()} disabled={apiLoading}>
                {apiLoading ? 'Đang tải...' : 'Tải lại'}
              </button>
              <span className={`api-status ${apiError ? 'api-status-fallback' : apiData.length ? 'api-status-online' : ''}`}>
                {apiLoading ? 'ĐANG TẢI' : apiError ? 'DỮ LIỆU MẪU' : `ĐÃ TẢI ${apiData.length} BẢN GHI`}
              </span>
            </div>
          </div>
          {apiLoading ? (
            <p className="api-message" role="status">Đang lấy dữ liệu từ backend...</p>
          ) : apiError && !apiData.length ? (
            <div className="api-error-row">
              <p className="api-message" role="alert">{apiError} Hãy kiểm tra backend đang chạy ở cổng 3000.</p>
              <button className="api-retry" type="button" onClick={loadApiData}>Thử lại</button>
            </div>
          ) : (
            <>
              {apiError && <p className="api-fallback-notice" role="status">API chưa kết nối ({apiError}); đang hiển thị dữ liệu mẫu.</p>}
              <div className="api-table-scroll">
                <table className="api-result-table">
                  <thead>
                    <tr><th>ID</th><th>GIAO DỊCH</th><th>NGÀY</th><th className="amount-cell">SỐ TIỀN</th><th>TRẠNG THÁI</th></tr>
                  </thead>
                  <tbody>
                    {apiData.map((item) => (
                      <tr key={item.id}>
                        <td>{item.id}</td>
                        <td><strong>{item.name}</strong><small>{item.category}</small></td>
                        <td>{item.date}</td>
                        <td className={`amount-cell transaction-amount ${item.type}`}>{item.type === 'income' ? '+' : '-'}{new Intl.NumberFormat('vi-VN').format(item.amount)} đ</td>
                        <td><span className={`record-status ${item.active ? 'record-active' : 'record-inactive'}`}>{item.active ? 'Active' : 'Inactive'}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="api-result-count">Đang hiển thị {apiData.length} trên {apiTotal} bản ghi.</p>
              </div>
            </>
          )}
          <div className="api-endpoints">
            <p className="api-endpoint">GET <code>/api/data</code> → NestJS <code>localhost:3000/data</code></p>
            <a href="/api/data" target="_blank" rel="noreferrer">JSON đầy đủ</a>
            <a href="/api/data?limit=2" target="_blank" rel="noreferrer">JSON 2 bản ghi</a>
          </div>
        </section>

        <section className="summary-grid" aria-label="Tóm tắt tài chính">
          <article className="summary-card balance-card">
            <div className="summary-label"><span>TỔNG SỐ DƯ</span><span className="balance-mark">SM</span></div>
            <p className="summary-value">28.460.000 <small>đ</small></p>
            <p className="summary-foot">Tổng hợp từ 3 ví đang hoạt động</p>
          </article>
          <article className="summary-card">
            <div className="summary-label"><span>TỔNG THU THÁNG</span><span className="metric-dot income-dot" /></div>
            <p className="summary-value">18.500.000 <small>đ</small></p>
            <p className="summary-foot"><strong className="positive">+8,4%</strong> so với tháng trước</p>
          </article>
          <article className="summary-card">
            <div className="summary-label"><span>TỔNG CHI THÁNG</span><span className="metric-dot expense-dot" /></div>
            <p className="summary-value">8.740.000 <small>đ</small></p>
            <p className="summary-foot">Còn <strong>6.260.000 đ</strong> trong ngân sách</p>
          </article>
        </section>

        <section className="insight-grid">
          <article className="panel spending-panel" id="reports">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">DÒNG TIỀN</p>
                <h2>Chi tiêu trong tuần</h2>
              </div>
              <label className="period-select">
                <span className="visually-hidden">Kỳ báo cáo</span>
                <select defaultValue="week" aria-label="Kỳ báo cáo">
                  <option value="week">Tuần này</option>
                  <option value="month">Tháng này</option>
                </select>
              </label>
            </div>
            <div className="chart-summary">
              <strong>2.486.000 đ</strong>
              <span><i /> 7 ngày gần nhất</span>
            </div>
            <div className="bar-chart" role="img" aria-label="Biểu đồ chi tiêu từ thứ Hai đến Chủ nhật">
              {weeklySpending.map((item) => (
                <div className="bar-column" key={item.day}>
                  <div className="bar-space">
                    <span className={`bar ${item.day === 'T7' ? 'bar-highlight' : ''}`} style={{ height: `${item.value}%` }} />
                  </div>
                  <span className="bar-label">{item.day}</span>
                </div>
              ))}
            </div>
          </article>

          <article className="panel budget-panel" id="budgets">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">KIỂM SOÁT CHI TIÊU</p>
                <h2>Ngân sách tháng</h2>
              </div>
              <a className="text-link" href="#transactions">Chi tiết</a>
            </div>
            <div className="budget-total">
              <div><strong>3.750.000 đ</strong><span> / 5.200.000 đ</span></div>
              <span className="budget-percent">72%</span>
            </div>
            <div className="budget-track"><span style={{ width: '72%' }} /></div>
            <div className="budget-list">
              {budgets.map((budget) => (
                <div className="budget-item" key={budget.name}>
                  <div className="budget-item-top">
                    <span><i className={`category-dot ${budget.color}`} />{budget.name}</span>
                    <strong>{budget.spent}</strong>
                  </div>
                  <div className="budget-item-bottom">
                    <div className="mini-track"><span className={budget.color} style={{ width: `${budget.progress}%` }} /></div>
                    <span>{budget.progress}%</span>
                  </div>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="panel transactions-panel" id="transactions">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">CẬP NHẬT MỚI NHẤT</p>
              <h2>Giao dịch gần đây</h2>
            </div>
            <a className="text-link" href="#transactions">Xem tất cả</a>
          </div>
          <div className="table-scroll">
            <table className="transaction-table">
              <thead>
                <tr><th>GIAO DỊCH</th><th>THỜI GIAN</th><th className="amount-cell">SỐ TIỀN</th></tr>
              </thead>
              <tbody>
                {filteredTransactions.length ? filteredTransactions.map((transaction) => (
                  <tr key={`${transaction.title}-${transaction.date}`}>
                    <td>
                      <div className="transaction-name">
                        <span className={`transaction-mark ${transaction.type}`}>{transaction.mark}</span>
                        <span><strong>{transaction.title}</strong><small>{transaction.category}</small></span>
                      </div>
                    </td>
                    <td className="transaction-date">{transaction.date}</td>
                    <td className={`amount-cell transaction-amount ${transaction.type}`}>{transaction.amount}</td>
                  </tr>
                )) : <tr><td className="empty-transactions" colSpan="3">Không tìm thấy giao dịch phù hợp.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

createRoot(document.getElementById('root')).render(<Dashboard />);