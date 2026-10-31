import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Alert, Badge, Button, ButtonGroup, Card, Col, ListGroup, ProgressBar, Row } from 'react-bootstrap';
import { useAuth } from '../../auth/AuthContext';
import { dashboardApi } from '../../api/dashboardApi';
import { goalApi } from '../../api/goalApi';
import { recurringApi } from '../../api/recurringApi';
import { getErrorMessage } from '../../api/axiosClient';
import { useDataRefresh } from '../../context/DataRefreshContext';
import { useToast } from '../../context/ToastContext';
import StatCard from '../../components/StatCard';
import BudgetAlerts from '../../components/BudgetAlerts';
import Loading from '../../components/Loading';
import EmptyState from '../../components/EmptyState';
import IncomeExpenseChart from '../../components/charts/IncomeExpenseChart';
import CategoryPieChart from '../../components/charts/CategoryPieChart';
import { categoryIcon, formatDate, formatVND } from '../../utils/format';

const RECURRING_FLAG = 'SM_RECURRING_PROCESSED';

/**
 * [Thành viên 4] Dashboard: thẻ số liệu + biểu đồ thu/chi theo tháng + biểu đồ tròn chi theo danh mục
 * + giao dịch gần đây + tiến độ mục tiêu. Dữ liệu từ /dashboard/* (userId lấy từ JWT).
 */
export default function OverviewPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const { version, refresh } = useDataRefresh();
  const [months, setMonths] = useState(6);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  // Mỗi phiên làm việc: tự tạo các giao dịch định kỳ đã đến hạn (1 lần)
  useEffect(() => {
    let done = false;
    try { done = sessionStorage.getItem(RECURRING_FLAG) === '1'; } catch { /* bỏ qua */ }
    if (done) return;
    try { sessionStorage.setItem(RECURRING_FLAG, '1'); } catch { /* bỏ qua */ }
    recurringApi
      .process()
      .then((r) => {
        if (r.created > 0) {
          toast.info(`Đã tự động ghi ${r.created} giao dịch định kỳ đến hạn`);
          refresh();
        }
        if (r.skipped?.length) toast.warning(`${r.skipped.length} giao dịch định kỳ bị bỏ qua (VD: vượt hạn mức)`);
      })
      .catch(() => {});
  }, [toast, refresh]);

  const load = useCallback(async () => {
    setError('');
    try {
      const [summary, monthly, byCategory, recent, goals] = await Promise.all([
        dashboardApi.summary(),
        dashboardApi.monthly(months),
        dashboardApi.byCategory(),
        dashboardApi.recent(),
        goalApi.list(),
      ]);
      setData({ summary, monthly, byCategory, recent, goals });
    } catch (e) {
      setError(getErrorMessage(e, 'Không tải được dữ liệu tổng quan'));
    }
  }, [months]);

  useEffect(() => {
    load();
  }, [load, version]);

  const s = data?.summary;
  const hour = new Date().getHours();
  const greeting = hour < 11 ? 'Chào buổi sáng' : hour < 14 ? 'Chào buổi trưa' : hour < 18 ? 'Chào buổi chiều' : 'Chào buổi tối';

  return (
    <>
      <Card className="border-0 text-white mb-4 shadow-sm" style={{ background: 'linear-gradient(120deg,#059669,#0f766e)' }}>
        <Card.Body className="p-4 d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
          <div>
            <h1 className="h3 fw-800 mb-1">{greeting}, {user?.FullName}! 👋</h1>
            <p className="mb-0 opacity-75">
              {s ? `Tháng ${s.month.slice(5)}/${s.month.slice(0, 4)}: bạn đã chi ${formatVND(s.totalExpense)} qua ${s.transactionCount} giao dịch.` : 'Chúc bạn một ngày quản lý chi tiêu hiệu quả.'}
            </p>
          </div>
          <div className="d-flex gap-2">
            <Button as={Link} to="/user/transactions" variant="light" className="fw-semibold">
              <i className="fa-solid fa-receipt me-1"></i> Sổ giao dịch
            </Button>
          </div>
        </Card.Body>
      </Card>

      {error && <Alert variant="danger">{error} <Alert.Link onClick={load}>Thử lại</Alert.Link></Alert>}

      <BudgetAlerts onViewAll={() => navigate('/user/budgets')} />

      {!data && !error ? (
        <Loading />
      ) : data && (
        <>
          <Row className="g-3 mb-4">
            <Col sm={6} xl={3}>
              <StatCard label="Tổng số dư" icon="fa-wallet" color="primary" value={formatVND(s.totalBalance)} sub={`${s.walletCount} ví VND`} />
            </Col>
            <Col sm={6} xl={3}>
              <StatCard label="Thu tháng này" icon="fa-arrow-trend-up" color="success" value={`+${formatVND(s.totalIncome)}`} valueClass="text-success" />
            </Col>
            <Col sm={6} xl={3}>
              <StatCard label="Chi tháng này" icon="fa-arrow-trend-down" color="danger" value={`−${formatVND(s.totalExpense)}`} valueClass="text-danger"
                sub={<>Chênh lệch: <b className={s.netThisMonth >= 0 ? 'text-success' : 'text-danger'}>{formatVND(s.netThisMonth)}</b></>} />
            </Col>
            <Col sm={6} xl={3}>
              <StatCard label="Đã tích luỹ" icon="fa-piggy-bank" color="warning" value={formatVND(s.totalSaved)}
                sub={s.goalCount ? `${s.goalCount} mục tiêu · ${s.totalTarget ? Math.round((s.totalSaved / s.totalTarget) * 100) : 0}% tổng mục tiêu` : 'Chưa có mục tiêu'} />
            </Col>
          </Row>

          <Row className="g-3 mb-4">
            <Col xl={8}>
              <Card className="h-100 shadow-sm border-0">
                <Card.Header className="bg-white border-0 pt-3 d-flex justify-content-between align-items-center">
                  <h2 className="h6 fw-bold mb-0">Thu chi theo tháng</h2>
                  <ButtonGroup size="sm">
                    {[3, 6, 12].map((m) => (
                      <Button key={m} variant={months === m ? 'success' : 'outline-secondary'} onClick={() => setMonths(m)}>{m} tháng</Button>
                    ))}
                  </ButtonGroup>
                </Card.Header>
                <Card.Body>
                  <IncomeExpenseChart data={data.monthly} />
                </Card.Body>
              </Card>
            </Col>
            <Col xl={4}>
              <Card className="h-100 shadow-sm border-0">
                <Card.Header className="bg-white border-0 pt-3">
                  <h2 className="h6 fw-bold mb-0">Chi tiêu theo danh mục <span className="text-secondary fw-normal">(tháng này)</span></h2>
                </Card.Header>
                <Card.Body>
                  {data.byCategory.length ? (
                    <CategoryPieChart data={data.byCategory} />
                  ) : (
                    <EmptyState icon="fa-chart-pie" title="Chưa có khoản chi" text="Tháng này bạn chưa ghi khoản chi nào." />
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Row className="g-3">
            <Col lg={7}>
              <Card className="h-100 shadow-sm border-0">
                <Card.Header className="bg-white border-0 pt-3 d-flex justify-content-between">
                  <h2 className="h6 fw-bold mb-0">Giao dịch gần đây</h2>
                  <Link to="/user/transactions" className="small">Xem tất cả</Link>
                </Card.Header>
                {data.recent.length ? (
                  <ListGroup variant="flush">
                    {data.recent.map((t) => {
                      const income = t.Type === 'Income';
                      return (
                        <ListGroup.Item key={t.TransactionId} className="d-flex align-items-center gap-3 py-3">
                          <span className={`sm-stat-icon bg-${income ? 'success' : 'danger'}-subtle text-${income ? 'success' : 'danger'}`} style={{ width: 38, height: 38 }}>
                            <i className={`fa-solid ${categoryIcon(t.Icon)}`}></i>
                          </span>
                          <div className="flex-grow-1 min-w-0">
                            <div className="fw-semibold text-truncate">{t.Note || t.CategoryName}</div>
                            <div className="small text-secondary">{t.CategoryName} · {t.AccountName} · {formatDate(t.TransactionDate)}</div>
                          </div>
                          <span className={`fw-bold ${income ? 'text-success' : 'text-danger'}`}>{income ? '+' : '−'}{formatVND(t.Amount)}</span>
                        </ListGroup.Item>
                      );
                    })}
                  </ListGroup>
                ) : (
                  <Card.Body>
                    <EmptyState icon="fa-receipt" title="Chưa có giao dịch" text="Bấm nút + ở góc màn hình để thêm nhanh giao dịch đầu tiên." />
                  </Card.Body>
                )}
              </Card>
            </Col>
            <Col lg={5}>
              <Card className="h-100 shadow-sm border-0">
                <Card.Header className="bg-white border-0 pt-3 d-flex justify-content-between">
                  <h2 className="h6 fw-bold mb-0">Mục tiêu tiết kiệm</h2>
                  <Link to="/user/goals" className="small">Quản lý</Link>
                </Card.Header>
                <Card.Body>
                  {data.goals.length ? (
                    data.goals.slice(0, 4).map((g) => {
                      const pct = g.targetAmount > 0 ? Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100)) : 0;
                      return (
                        <div key={g.id} className="mb-3">
                          <div className="d-flex justify-content-between small mb-1">
                            <span className="fw-semibold">{g.name}</span>
                            <Badge bg={pct >= 100 ? 'success' : 'light'} text={pct >= 100 ? undefined : 'dark'}>{pct}%</Badge>
                          </div>
                          <ProgressBar now={pct} variant="success" style={{ height: 8 }} />
                          <div className="small text-secondary mt-1">{formatVND(g.currentAmount)} / {formatVND(g.targetAmount)}</div>
                        </div>
                      );
                    })
                  ) : (
                    <EmptyState icon="fa-piggy-bank" title="Chưa có mục tiêu" text="Đặt mục tiêu để bắt đầu tích luỹ.">
                      <Button as={Link} to="/user/goals" variant="success" size="sm">+ Tạo mục tiêu</Button>
                    </EmptyState>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </>
      )}
    </>
  );
}
