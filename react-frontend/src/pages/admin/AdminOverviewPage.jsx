import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Alert, Button, Card, Col, ProgressBar, Row } from 'react-bootstrap';
import { adminApi } from '../../api/adminApi';
import { getErrorMessage } from '../../api/axiosClient';
import { useDataRefresh } from '../../context/DataRefreshContext';
import StatCard from '../../components/StatCard';
import Loading from '../../components/Loading';
import EmptyState from '../../components/EmptyState';
import AdminActivityChart from '../../components/charts/AdminActivityChart';
import { formatVND } from '../../utils/format';

/** [Admin] Tổng quan hệ thống: người dùng, giao dịch, biểu đồ hoạt động, top danh mục chi */
export default function AdminOverviewPage() {
  const { version } = useDataRefresh();
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      setStats(await adminApi.stats());
    } catch (e) {
      setError(getErrorMessage(e, 'Không tải được thống kê'));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, version]);

  const topMax = stats?.topCategories?.[0]?.total ?? 0;

  return (
    <>
      <Card className="border-0 text-white mb-4 shadow-sm" style={{ background: 'linear-gradient(120deg,#5b21b6,#312e81)' }}>
        <Card.Body className="p-4 d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
          <div>
            <h1 className="h3 fw-800 mb-1">Trung tâm quản trị</h1>
            <p className="mb-0 opacity-75">Giám sát người dùng, hoạt động giao dịch và danh mục mặc định của hệ thống.</p>
          </div>
          <div className="d-flex gap-2">
            <Button as={Link} to="/admin/users" variant="light"><i className="fa-solid fa-users me-1"></i> Người dùng</Button>
            <Button as={Link} to="/admin/audit-logs" variant="outline-light"><i className="fa-solid fa-clock-rotate-left me-1"></i> Nhật ký</Button>
          </div>
        </Card.Body>
      </Card>

      {error && <Alert variant="danger">{error} <Alert.Link onClick={load}>Thử lại</Alert.Link></Alert>}

      {!stats && !error ? (
        <Loading />
      ) : stats && (
        <>
          <Row className="g-3 mb-4">
            <Col sm={6} xl={3}>
              <StatCard label="Người dùng" icon="fa-users" color="primary" value={stats.users.total}
                sub={`${stats.users.admins} admin · ${stats.users.locked} bị khoá`} />
            </Col>
            <Col sm={6} xl={3}>
              <StatCard label="Người dùng mới (tháng)" icon="fa-user-plus" color="info" value={`+${stats.users.newThisMonth}`} />
            </Col>
            <Col sm={6} xl={3}>
              <StatCard label="Giao dịch (tháng)" icon="fa-receipt" color="success" value={stats.transactions.thisMonth}
                sub={`Tổng cộng: ${stats.transactions.total.toLocaleString('vi-VN')}`} />
            </Col>
            <Col sm={6} xl={3}>
              <StatCard label="Danh mục hệ thống" icon="fa-tags" color="warning" value={stats.systemCategories}
                sub={`${stats.wallets} ví · ${stats.budgets} ngân sách · ${stats.goals} mục tiêu`} />
            </Col>
          </Row>

          <Row className="g-3 mb-4">
            <Col md={6}>
              <StatCard label="Tổng thu toàn hệ thống (tháng)" icon="fa-arrow-trend-up" color="success" value={formatVND(stats.transactions.incomeThisMonth)} valueClass="text-success" />
            </Col>
            <Col md={6}>
              <StatCard label="Tổng chi toàn hệ thống (tháng)" icon="fa-arrow-trend-down" color="danger" value={formatVND(stats.transactions.expenseThisMonth)} valueClass="text-danger" />
            </Col>
          </Row>

          <Row className="g-3">
            <Col xl={8}>
              <Card className="h-100 border-0 shadow-sm">
                <Card.Header className="bg-white border-0 pt-3"><h2 className="h6 fw-bold mb-0">Hoạt động 6 tháng gần nhất</h2></Card.Header>
                <Card.Body><AdminActivityChart data={stats.monthly} /></Card.Body>
              </Card>
            </Col>
            <Col xl={4}>
              <Card className="h-100 border-0 shadow-sm">
                <Card.Header className="bg-white border-0 pt-3"><h2 className="h6 fw-bold mb-0">Top danh mục chi (tháng này)</h2></Card.Header>
                <Card.Body>
                  {stats.topCategories.length === 0 ? (
                    <EmptyState icon="fa-chart-simple" title="Chưa có dữ liệu" text="Tháng này chưa có khoản chi nào." />
                  ) : (
                    stats.topCategories.map((c, i) => (
                      <div key={c.name} className="mb-3">
                        <div className="d-flex justify-content-between small mb-1">
                          <span className="fw-semibold">{i + 1}. {c.name}</span>
                          <span>{formatVND(c.total)} <span className="text-secondary">({c.count} GD)</span></span>
                        </div>
                        <ProgressBar now={topMax ? (c.total / topMax) * 100 : 0} variant="danger" style={{ height: 8 }} />
                      </div>
                    ))
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
