import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Badge, Button, Dropdown, Nav, Navbar, Offcanvas } from 'react-bootstrap';
import { useAuth } from '../auth/AuthContext';
import ConfirmDialog from '../components/ConfirmDialog';

/**
 * Khung giao diện dùng chung cho trang Người dùng và Admin:
 * thanh trên (Navbar) + menu bên trái (Nav) + nội dung (Outlet của react-router).
 */
export default function AppShell({ variant = 'user', sections, homePath, extra }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const isAdmin = variant === 'admin';
  const color = isAdmin ? 'var(--sm-admin)' : 'var(--sm-brand)';

  const doLogout = () => {
    logout();
    navigate('/auth', { replace: true });
  };

  const menu = (
    <Nav className={`flex-column sm-nav ${variant} p-3 gap-1`} onClick={() => setShowMenu(false)}>
      {sections.map((sec) => (
        <div key={sec.title}>
          <div className="sm-nav-section">{sec.title}</div>
          {sec.items.map((item) => (
            <Nav.Link as={NavLink} key={item.to} to={item.to} end={item.end}>
              <i className={`fa-solid ${item.icon}`}></i>
              <span>{item.label}</span>
            </Nav.Link>
          ))}
        </div>
      ))}
    </Nav>
  );

  return (
    <div className="sm-app">
      <Navbar bg="white" className="sm-topbar border-bottom px-3 fixed-top">
        <Button variant="light" className="d-lg-none me-2" onClick={() => setShowMenu(true)} aria-label="Mở menu">
          <i className="fa-solid fa-bars"></i>
        </Button>
        <Navbar.Brand as={Link} to={homePath} className="d-flex align-items-center gap-2 fw-800">
          <span className="sm-avatar" style={{ background: color }}>
            <i className={`fa-solid ${isAdmin ? 'fa-shield-halved' : 'fa-wallet'}`}></i>
          </span>
          <span className="d-none d-sm-inline">SmartMoney</span>
          <Badge bg={isAdmin ? 'dark' : 'success'} className="fw-semibold" style={isAdmin ? { background: color } : undefined}>
            {isAdmin ? 'ADMIN' : 'USER'}
          </Badge>
        </Navbar.Brand>

        <div className="ms-auto d-flex align-items-center gap-2">
          {extra}
          <Dropdown align="end">
            <Dropdown.Toggle variant="light" className="d-flex align-items-center gap-2 border-0">
              <span className="sm-avatar" style={{ background: color, width: 32, height: 32 }}>
                {(user?.FullName || '?').charAt(0).toUpperCase()}
              </span>
              <span className="d-none d-md-inline text-start lh-sm">
                <span className="d-block fw-semibold small">{user?.FullName}</span>
                <span className="d-block text-secondary" style={{ fontSize: 11 }}>{user?.Email}</span>
              </span>
            </Dropdown.Toggle>
            <Dropdown.Menu>
              <Dropdown.Item as={Link} to={`${homePath}/profile`}>
                <i className="fa-solid fa-user-gear me-2"></i>Hồ sơ cá nhân
              </Dropdown.Item>
              <Dropdown.Item as={Link} to="/">
                <i className="fa-solid fa-house me-2"></i>Trang chủ
              </Dropdown.Item>
              <Dropdown.Divider />
              <Dropdown.Item className="text-danger" onClick={() => setConfirmLogout(true)}>
                <i className="fa-solid fa-arrow-right-from-bracket me-2"></i>Đăng xuất
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </div>
      </Navbar>

      <aside className="sm-sidebar">{menu}</aside>

      <Offcanvas show={showMenu} onHide={() => setShowMenu(false)} style={{ width: 'var(--sm-sidebar-w)' }}>
        <Offcanvas.Header closeButton>
          <Offcanvas.Title className="fw-800">SmartMoney</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body className="p-0">{menu}</Offcanvas.Body>
      </Offcanvas>

      <main className="sm-main" style={{ paddingTop: 'calc(60px + 1.5rem)' }}>
        <Outlet />
      </main>

      <ConfirmDialog
        show={confirmLogout}
        title="Đăng xuất"
        message="Bạn có chắc chắn muốn đăng xuất?"
        confirmText="Đăng xuất"
        onConfirm={doLogout}
        onClose={() => setConfirmLogout(false)}
      />
    </div>
  );
}
