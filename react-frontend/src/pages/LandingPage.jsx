import { Link } from 'react-router-dom';
import { Badge, Button, Card, Col, Container, Nav, Navbar, ProgressBar, Row } from 'react-bootstrap';
import { homePathFor, useAuth } from '../auth/AuthContext';

/**
 * Trang chủ — bố cục lấy cảm hứng từ reactnative.dev
 * (hero nền tối + các khối tính năng xen kẽ chữ / hình + footer nhiều cột),
 * nội dung là các chức năng của SmartMoney. 100% React web + React-Bootstrap.
 */

const FEATURES = [
  {
    kicker: 'Thành viên 2',
    title: 'Mọi nguồn tiền ở một nơi',
    text: 'Tiền mặt, tài khoản ngân hàng, thẻ tín dụng, ví điện tử... Tạo bao nhiêu ví tuỳ thích, xem tổng số dư tức thì và chuyển tiền giữa các ví chỉ với một thao tác.',
    bullets: ['Thêm / sửa / xoá ví', 'Chuyển tiền giữa các ví', 'Tổng số dư theo loại tiền'],
    visual: 'wallets',
  },
  {
    kicker: 'Thành viên 3',
    title: 'Sổ giao dịch rõ ràng, lọc trong tích tắc',
    text: 'Ghi lại từng khoản thu chi. Lọc theo ví, danh mục, loại thu/chi hoặc khoảng ngày. Phân trang, tìm theo ghi chú và xuất ra Excel khi cần.',
    bullets: ['Lọc bằng QueryBuilder phía server', 'Số dư ví tự cập nhật', 'Xuất CSV mở bằng Excel'],
    visual: 'transactions',
  },
  {
    kicker: 'Thành viên 2',
    title: 'Ngân sách biết lên tiếng',
    text: 'Đặt hạn mức cho từng danh mục chi tiêu. Dùng tới 80% là bạn được cảnh báo, còn khoản chi làm vượt hạn mức sẽ bị chặn ngay khi nhập.',
    bullets: ['Cảnh báo khi chạm 80%', 'Chặn khoản chi vượt hạn mức', 'Theo dõi tiến độ trực quan'],
    visual: 'budget',
  },
  {
    kicker: 'Thành viên 4',
    title: 'Biến ước mơ thành con số',
    text: 'Đặt mục tiêu tiết kiệm như mua laptop hay quỹ dự phòng. Nạp tiền từ ví vào mục tiêu và xem thanh tiến độ lớn dần mỗi ngày.',
    bullets: ['Nạp / rút từ ví', 'Đếm ngày tới hạn', 'Biểu đồ thu chi theo tháng'],
    visual: 'goals',
  },
];

const TEAM = [
  { name: 'Thành viên 1', role: 'Auth & Security', icon: 'fa-shield-halved', desc: 'Đăng nhập/đăng ký, JWT, băm mật khẩu, CORS, chống XSS, lưu Session.' },
  { name: 'Thành viên 2', role: 'Ví & Ngân sách', icon: 'fa-wallet', desc: 'CRUD ví và ngân sách, chặn vượt hạn mức (Budget Alerts).' },
  { name: 'Thành viên 3', role: 'Giao dịch', icon: 'fa-receipt', desc: 'Entity Transaction/Category, API lọc bằng QueryBuilder, Axios chặn lỗi Token.' },
  { name: 'Thành viên 4', role: 'Dashboard & QA', icon: 'fa-chart-pie', desc: 'API thống kê, Mục tiêu tiết kiệm, biểu đồ, "Thêm nhanh" ≤ 4 click, kiểm thử.' },
];

function MockWallets() {
  const items = [
    { name: 'Ví tiền mặt', type: 'Tiền mặt', icon: 'fa-money-bill-wave', color: 'success', amount: '2.500.000 ₫' },
    { name: 'Vietcombank', type: 'Ngân hàng', icon: 'fa-building-columns', color: 'primary', amount: '24.500.000 ₫' },
    { name: 'MoMo', type: 'Ví điện tử', icon: 'fa-mobile-screen', color: 'info', amount: '850.000 ₫' },
  ];
  return (
    <div className="lp-mock">
      <div className="d-flex justify-content-between align-items-end mb-3 p-3 rounded-4 text-white" style={{ background: 'linear-gradient(135deg,#2563eb,#4f46e5)' }}>
        <div>
          <div className="small opacity-75 text-uppercase fw-semibold">Tổng số dư</div>
          <div className="fs-3 fw-800">27.850.000 ₫</div>
        </div>
        <span className="small opacity-75">3 ví</span>
      </div>
      {items.map((w) => (
        <div key={w.name} className="d-flex align-items-center gap-3 p-2 border rounded-3 mb-2">
          <span className={`sm-stat-icon bg-${w.color}-subtle text-${w.color}`} style={{ width: 38, height: 38 }}>
            <i className={`fa-solid ${w.icon}`}></i>
          </span>
          <div className="flex-grow-1">
            <div className="fw-semibold small">{w.name}</div>
            <div className="text-secondary" style={{ fontSize: 11 }}>{w.type}</div>
          </div>
          <div className="fw-bold small">{w.amount}</div>
        </div>
      ))}
    </div>
  );
}

function MockTransactions() {
  const rows = [
    ['Lương tháng 10', 'Lương', '+20.000.000', 'success'],
    ['Ăn trưa cơm sườn', 'Ăn uống', '−65.000', 'danger'],
    ['Đổ xăng', 'Đi lại', '−120.000', 'danger'],
    ['Tiền nhà', 'Nhà ở', '−3.500.000', 'danger'],
  ];
  return (
    <div className="lp-mock">
      <div className="d-flex gap-2 mb-3">
        <Badge bg="light" text="dark" className="border">Tháng này</Badge>
        <Badge bg="light" text="dark" className="border">Chi</Badge>
        <Badge bg="success-subtle" text="success">Ví: Tất cả</Badge>
      </div>
      {rows.map(([note, cat, amt, color]) => (
        <div key={note} className="d-flex justify-content-between align-items-center py-2 border-bottom">
          <div>
            <div className="fw-semibold small">{note}</div>
            <div className="text-secondary" style={{ fontSize: 11 }}>{cat}</div>
          </div>
          <span className={`fw-bold small text-${color}`}>{amt} ₫</span>
        </div>
      ))}
      <div className="text-end mt-2"><Badge bg="dark"><i className="fa-solid fa-file-csv me-1"></i>Xuất CSV</Badge></div>
    </div>
  );
}

function MockBudget() {
  const rows = [
    ['Ăn uống', 72, 'success', '2.880.000 / 4.000.000'],
    ['Đi lại', 86, 'warning', '860.000 / 1.000.000'],
    ['Mua sắm', 104, 'danger', '1.560.000 / 1.500.000'],
  ];
  return (
    <div className="lp-mock">
      {rows.map(([name, pct, variant, text]) => (
        <div key={name} className="mb-3">
          <div className="d-flex justify-content-between small mb-1">
            <span className="fw-semibold">{name}</span>
            <span className="text-secondary">{text}</span>
          </div>
          <ProgressBar now={Math.min(pct, 100)} variant={variant} style={{ height: 10 }} />
        </div>
      ))}
      <div className="p-2 rounded-3 bg-danger-subtle text-danger small fw-semibold">
        <i className="fa-solid fa-ban me-1"></i> Bị chặn: khoản chi 300.000đ làm vượt hạn mức "Mua sắm"
      </div>
    </div>
  );
}

function MockGoals() {
  return (
    <div className="lp-mock">
      {[
        ['Mua Macbook', 50, '22.500.000 / 45.000.000', '62 ngày nữa'],
        ['Quỹ dự phòng', 63, '38.000.000 / 60.000.000', '243 ngày nữa'],
      ].map(([name, pct, text, days]) => (
        <div key={name} className="p-3 border rounded-4 mb-2">
          <div className="d-flex justify-content-between mb-1">
            <span className="fw-bold"><i className="fa-solid fa-piggy-bank text-warning me-2"></i>{name}</span>
            <Badge bg="light" text="dark">{days}</Badge>
          </div>
          <ProgressBar now={pct} label={`${pct}%`} variant="success" style={{ height: 16 }} className="mb-1" />
          <div className="small text-secondary">{text} ₫</div>
        </div>
      ))}
    </div>
  );
}

const VISUALS = { wallets: MockWallets, transactions: MockTransactions, budget: MockBudget, goals: MockGoals };

export default function LandingPage() {
  const { user } = useAuth();
  const appPath = user ? homePathFor(user) : '/auth';

  return (
    <div>
      {/* ===== Thanh menu tối ===== */}
      <Navbar expand="md" variant="dark" className="lp-nav sticky-top py-2">
        <Container>
          <Navbar.Brand as={Link} to="/" className="fw-800 d-flex align-items-center gap-2">
            <span className="sm-avatar" style={{ background: 'var(--sm-brand)', width: 32, height: 32 }}>
              <i className="fa-solid fa-wallet"></i>
            </span>
            SmartMoney
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="lp-nav" />
          <Navbar.Collapse id="lp-nav">
            <Nav className="ms-auto align-items-md-center gap-md-2">
              <Nav.Link href="#features">Tính năng</Nav.Link>
              <Nav.Link href="#quick-add">Thêm nhanh</Nav.Link>
              <Nav.Link href="#security">Bảo mật</Nav.Link>
              <Nav.Link href="#team">Nhóm 08</Nav.Link>
              {user ? (
                <Button as={Link} to={appPath} variant="success" size="sm" className="ms-md-2 px-3">
                  Vào ứng dụng
                </Button>
              ) : (
                <Button as={Link} to="/auth" variant="outline-light" size="sm" className="ms-md-2 px-3">
                  Đăng nhập
                </Button>
              )}
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      {/* ===== Hero ===== */}
      <header className="lp-hero">
        <Container>
          <Row className="align-items-center g-5">
            <Col lg={6}>
              <Badge bg="success" className="mb-3 px-3 py-2 rounded-pill fw-semibold">Đồ án Thiết kế Web nâng cao · Nhóm 08</Badge>
              <h1 className="mb-3">
                Quản lý chi tiêu <span className="lp-accent">thông minh</span>
              </h1>
              <p className="lead mb-4">
                Theo dõi ví, ghi chép thu chi, đặt ngân sách và mục tiêu tiết kiệm — tất cả trong một ứng dụng web
                xây dựng bằng React và NestJS.
              </p>
              <div className="d-flex flex-wrap gap-2">
                <Button as={Link} to={user ? appPath : '/auth?tab=register'} variant="success" size="lg" className="px-4">
                  {user ? 'Vào ứng dụng' : 'Bắt đầu miễn phí'}
                </Button>
                <Button href="#features" variant="outline-light" size="lg" className="px-4">
                  Xem tính năng
                </Button>
              </div>
            </Col>
            <Col lg={6}>
              <div className="lp-mock lp-mock-dark">
                <div className="d-flex gap-2 mb-3">
                  <span className="rounded-circle bg-danger" style={{ width: 10, height: 10 }}></span>
                  <span className="rounded-circle bg-warning" style={{ width: 10, height: 10 }}></span>
                  <span className="rounded-circle bg-success" style={{ width: 10, height: 10 }}></span>
                </div>
                <Row className="g-2 mb-3">
                  {[
                    ['Tổng số dư', '27,8tr', 'fa-wallet', '#60a5fa'],
                    ['Thu tháng', '+20tr', 'fa-arrow-trend-up', '#34d399'],
                    ['Chi tháng', '−9,5tr', 'fa-arrow-trend-down', '#fb7185'],
                  ].map(([label, value, icon, c]) => (
                    <Col xs={4} key={label}>
                      <div className="p-2 rounded-3" style={{ background: '#20232a' }}>
                        <div style={{ fontSize: 11, color: '#94a3b8' }}><i className={`fa-solid ${icon} me-1`} style={{ color: c }}></i>{label}</div>
                        <div className="fw-bold">{value}</div>
                      </div>
                    </Col>
                  ))}
                </Row>
                <div className="d-flex align-items-end gap-2 px-2" style={{ height: 140 }}>
                  {[[40, 25], [55, 30], [48, 42], [70, 38], [62, 50], [80, 45]].map(([inc, exp], i) => (
                    <div key={i} className="flex-grow-1 d-flex align-items-end gap-1" style={{ height: '100%' }}>
                      <div className="flex-grow-1 rounded-top" style={{ height: `${inc}%`, background: '#34d399' }}></div>
                      <div className="flex-grow-1 rounded-top" style={{ height: `${exp}%`, background: '#fb7185' }}></div>
                    </div>
                  ))}
                </div>
                <div className="d-flex justify-content-between px-2 mt-2" style={{ fontSize: 11, color: '#94a3b8' }}>
                  {['T5', 'T6', 'T7', 'T8', 'T9', 'T10'].map((m) => <span key={m}>{m}</span>)}
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </header>

      {/* ===== Các khối tính năng xen kẽ ===== */}
      <div id="features">
        {FEATURES.map((f, i) => {
          const Visual = VISUALS[f.visual];
          const reverse = i % 2 === 1;
          return (
            <section key={f.title} className={`lp-section ${i % 2 === 0 ? 'alt' : ''}`}>
              <Container>
                <Row className={`align-items-center g-5 ${reverse ? 'flex-lg-row-reverse' : ''}`}>
                  <Col lg={6}>
                    <div className="lp-kicker mb-2">{f.kicker}</div>
                    <h2 className="mb-3">{f.title}</h2>
                    <p className="lead mb-4">{f.text}</p>
                    <ul className="list-unstyled mb-0">
                      {f.bullets.map((b) => (
                        <li key={b} className="mb-2">
                          <i className="fa-solid fa-circle-check text-brand me-2"></i>{b}
                        </li>
                      ))}
                    </ul>
                  </Col>
                  <Col lg={6}>
                    <Visual />
                  </Col>
                </Row>
              </Container>
            </section>
          );
        })}
      </div>

      {/* ===== Thêm nhanh (giống khối "code snippet" của reactnative.dev) ===== */}
      <section id="quick-add" className="lp-section lp-dark-band">
        <Container>
          <Row className="align-items-center g-5">
            <Col lg={5}>
              <div className="lp-kicker mb-2" style={{ color: 'var(--sm-accent)' }}>Thành viên 4 · Tối ưu UX</div>
              <h2 className="mb-3">Thêm giao dịch chỉ trong 3 click</h2>
              <p className="mb-0">
                Nút <b>+</b> luôn nằm ở góc màn hình. Ví và danh mục dùng lần trước được chọn sẵn, số tiền được focus
                ngay — gõ xong bấm Enter là xong.
              </p>
            </Col>
            <Col lg={7}>
              <Row className="g-3">
                {[
                  ['1', 'Bấm nút +', 'Ở bất kỳ trang nào'],
                  ['2', 'Gõ số tiền', 'Ô nhập đã được focus sẵn'],
                  ['3', 'Chọn danh mục & Lưu', 'Danh mục hay dùng hiện đầu tiên'],
                ].map(([n, t, d]) => (
                  <Col md={4} key={n}>
                    <Card className="h-100 border-0" style={{ background: '#2a2e36', color: '#fff' }}>
                      <Card.Body>
                        <span className="lp-step-num mb-3">{n}</span>
                        <h6 className="fw-bold">{t}</h6>
                        <p className="small mb-0">{d}</p>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>
              <pre className="lp-code mt-3 p-3 rounded-3 mb-0" style={{ background: '#16181d', color: '#a7f3d0' }}>
{`POST /transactions
{ "AccountId": 1, "CategoryId": 3, "Amount": 65000 }
→ 201 Created · số dư ví tự cập nhật`}
              </pre>
            </Col>
          </Row>
        </Container>
      </section>

      {/* ===== Bảo mật ===== */}
      <section id="security" className="lp-section alt">
        <Container>
          <div className="text-center mb-5">
            <div className="lp-kicker mb-2">Thành viên 1</div>
            <h2>An toàn ngay từ thiết kế</h2>
            <p className="lead mx-auto" style={{ maxWidth: 640 }}>Dữ liệu tài chính là dữ liệu nhạy cảm, nên bảo mật được làm kỹ ở cả backend lẫn frontend.</p>
          </div>
          <Row className="g-4">
            {[
              ['fa-key', 'JWT & phân quyền', 'Mọi API đều cần token; route admin chỉ dành cho quản trị viên.'],
              ['fa-lock', 'Băm mật khẩu bcrypt', 'Không bao giờ lưu hay trả mật khẩu thô. Sai 5 lần bị khoá 15 phút.'],
              ['fa-shield-virus', 'Chống XSS', 'ValidationPipe + SanitizePipe gỡ mọi thẻ HTML độc hại trước khi lưu.'],
              ['fa-globe', 'CORS & giới hạn request', 'Chỉ frontend được phép gọi API; chặn spam theo IP.'],
            ].map(([icon, t, d]) => (
              <Col md={6} lg={3} key={t}>
                <Card className="h-100 border-0 shadow-sm sm-hover-lift">
                  <Card.Body>
                    <span className="sm-stat-icon bg-success-subtle text-success mb-3"><i className={`fa-solid ${icon}`}></i></span>
                    <h6 className="fw-bold">{t}</h6>
                    <p className="small text-secondary mb-0">{d}</p>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* ===== Nhóm ===== */}
      <section id="team" className="lp-section">
        <Container>
          <div className="text-center mb-5">
            <div className="lp-kicker mb-2">Nhóm 08</div>
            <h2>4 thành viên, 4 mảnh ghép</h2>
          </div>
          <Row className="g-4">
            {TEAM.map((m) => (
              <Col md={6} lg={3} key={m.name}>
                <Card className="h-100 border-0 shadow-sm text-center">
                  <Card.Body>
                    <span className="sm-avatar mb-3" style={{ background: 'var(--sm-dark)', width: 56, height: 56, borderRadius: 16 }}>
                      <i className={`fa-solid ${m.icon} fs-4`} style={{ color: 'var(--sm-accent)' }}></i>
                    </span>
                    <h6 className="fw-bold mb-0">{m.name}</h6>
                    <div className="text-brand small fw-semibold mb-2">{m.role}</div>
                    <p className="small text-secondary mb-0">{m.desc}</p>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* ===== CTA ===== */}
      <section className="lp-dark-band py-5">
        <Container className="text-center py-3">
          <h2 className="fw-800 mb-3">Sẵn sàng làm chủ chi tiêu?</h2>
          <Button as={Link} to={user ? appPath : '/auth?tab=register'} variant="success" size="lg" className="px-5">
            {user ? 'Vào ứng dụng' : 'Tạo tài khoản ngay'}
          </Button>
        </Container>
      </section>

      {/* ===== Footer nhiều cột ===== */}
      <footer className="lp-footer py-5">
        <Container>
          <Row className="g-4">
            <Col md={4}>
              <div className="fw-800 text-white fs-5 mb-2"><i className="fa-solid fa-wallet me-2 lp-accent"></i>SmartMoney</div>
              <p className="small mb-0">Hệ thống quản lý chi tiêu cá nhân thông minh. React · React-Bootstrap · NestJS · TypeORM · MySQL.</p>
            </Col>
            <Col xs={6} md={2}>
              <h6 className="mb-3">Sản phẩm</h6>
              <ul className="list-unstyled small">
                <li className="mb-2"><a href="#features">Tính năng</a></li>
                <li className="mb-2"><a href="#quick-add">Thêm nhanh</a></li>
                <li className="mb-2"><a href="#security">Bảo mật</a></li>
              </ul>
            </Col>
            <Col xs={6} md={3}>
              <h6 className="mb-3">Tài khoản</h6>
              <ul className="list-unstyled small">
                <li className="mb-2"><Link to="/auth">Đăng nhập</Link></li>
                <li className="mb-2"><Link to="/auth?tab=register">Đăng ký</Link></li>
              </ul>
            </Col>
            <Col md={3}>
              <h6 className="mb-3">Mã nguồn</h6>
              <ul className="list-unstyled small">
                <li className="mb-2">
                  <a href="https://github.com/nhomwebncaon02-cpu/Nhom08" target="_blank" rel="noreferrer">
                    <i className="fa-brands fa-github me-1"></i>GitHub Nhom08
                  </a>
                </li>
              </ul>
            </Col>
          </Row>
          <hr className="border-secondary my-4" />
          <div className="small text-center">© 2026 Nhóm 08 · Thiết kế Web nâng cao</div>
        </Container>
      </footer>
    </div>
  );
}
