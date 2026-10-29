import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css'; 
import { Card, Table, Button, Spinner, Alert, Modal, Form, ProgressBar } from 'react-bootstrap';
import { useAuth } from '../auth/AuthContext';
import api, { getErrorMessage } from '../api/axiosClient';

const SavingGoals = () => {
  const { user } = useAuth();
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State cho Modal Thêm mới
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ name: '', targetAmount: '', deadline: '' });

  // State cho Modal Sửa
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({ id: '', name: '', targetAmount: '', currentAmount: '', deadline: '' });

  useEffect(() => {
    if (user) fetchGoals();
  }, [user]);

  const fetchGoals = async () => {
    try {
      const userId = user?.UserId || user?.id;
      if (!userId) throw new Error('Không tìm thấy thông tin người dùng.');
      const response = await api.get('/goal');
      setGoals(response.data);
      setLoading(false);
    } catch (err) {
      setError(getErrorMessage(err, 'Lỗi khi tải dữ liệu mục tiêu'));
      setLoading(false);
    }
  };

  // --- HÀM THÊM MỚI ---
  const handleAddGoal = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const newGoalData = {
        name: formData.name,
        targetAmount: Number(formData.targetAmount),
        deadline: formData.deadline,
        user: { UserId: user?.UserId || user?.id } 
      };
      await api.post('/goal', newGoalData);
      setShowModal(false);
      setFormData({ name: '', targetAmount: '', deadline: '' });
      fetchGoals();
    } catch (err) {
      alert('Lỗi: ' + getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- HÀM MỞ FORM SỬA ---
  const openEditModal = (goal) => {
    setEditFormData({
      id: goal.id,
      name: goal.name,
      targetAmount: goal.targetAmount,
      currentAmount: goal.currentAmount || 0,
      deadline: goal.deadline ? new Date(goal.deadline).toISOString().split('T')[0] : ''
    });
    setShowEditModal(true);
  };

  // --- HÀM CẬP NHẬT (SỬA) ---
  const handleUpdateGoal = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const updateData = {
        name: editFormData.name,
        targetAmount: Number(editFormData.targetAmount),
        currentAmount: Number(editFormData.currentAmount),
        deadline: editFormData.deadline,
      };
      await api.patch(`/goal/${editFormData.id}`, updateData);
      setShowEditModal(false);
      fetchGoals(); // Tải lại bảng để thanh tiến độ chạy
    } catch (err) {
      alert('Lỗi: ' + getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- HÀM XÓA ---
  const handleDeleteGoal = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa mục tiêu này? Hành động này không thể hoàn tác.')) {
      try {
        await api.delete(`/goal/${id}`);
        fetchGoals();
      } catch (err) {
        alert('Lỗi khi xóa: ' + getErrorMessage(err));
      }
    }
  };

  if (loading) return <div className="text-center mt-5"><Spinner animation="border" variant="success" /> <p className="mt-2 text-muted">Đang tải dữ liệu...</p></div>;
  if (error) return <Alert variant="danger" className="m-3">{error}</Alert>;

  return (
    <div className="p-4" style={{ backgroundColor: '#f8f9fa', minHeight: '100%' }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bolder" style={{ color: '#1e293b' }}>Mục tiêu tiết kiệm của tôi</h2>
        <Button variant="success" onClick={() => setShowModal(true)} className="fw-bold px-4 rounded-pill shadow-sm">
          + Thêm Mục Tiêu
        </Button>
      </div>

      <Card className="shadow-sm border-0" style={{ borderRadius: '1rem' }}>
        <Card.Body className="p-0">
          {goals.length === 0 ? (
            <div className="text-center text-muted py-5">
              <h5>Bạn chưa có mục tiêu tiết kiệm nào!</h5>
              <p>Hãy tạo một cái mới để bắt đầu tích lũy nhé.</p>
            </div>
          ) : (
            <Table hover responsive className="align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th className="px-4 py-3 text-uppercase text-secondary" style={{ fontSize: '0.85rem' }}>Tên mục tiêu</th>
                  <th className="px-4 py-3 text-uppercase text-secondary" style={{ fontSize: '0.85rem' }}>Mục tiêu</th>
                  <th className="px-4 py-3 text-uppercase text-secondary" style={{ fontSize: '0.85rem' }}>Đã gom được</th>
                  <th className="px-4 py-3 text-uppercase text-secondary" style={{ fontSize: '0.85rem' }}>Hạn chót</th>
                  <th className="px-4 py-3 text-uppercase text-secondary" style={{ fontSize: '0.85rem' }}>Tiến độ</th>
                  <th className="px-4 py-3 text-uppercase text-secondary text-end" style={{ fontSize: '0.85rem' }}>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {goals.map((goal) => {
                  const percent = goal.targetAmount > 0 ? ((goal.currentAmount / goal.targetAmount) * 100).toFixed(1) : 0;
                  return (
                    <tr key={goal.id}>
                      <td className="px-4 py-3 fw-bold" style={{ color: '#334155' }}>{goal.name}</td>
                      <td className="px-4 py-3">{Number(goal.targetAmount).toLocaleString('vi-VN')} đ</td>
                      <td className="px-4 py-3 fw-bold text-success">{Number(goal.currentAmount).toLocaleString('vi-VN')} đ</td>
                      <td className="px-4 py-3">{new Date(goal.deadline).toLocaleDateString('vi-VN')}</td>
                      <td className="px-4 py-3">
                        <div className="d-flex align-items-center gap-2">
                          <ProgressBar variant="success" now={percent} style={{ height: '8px', flex: 1 }} />
                          <span className="fw-bold text-secondary" style={{ fontSize: '0.85rem' }}>{percent}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-end">
                        <Button variant="outline-primary" size="sm" className="me-2 rounded-3" onClick={() => openEditModal(goal)}>Sửa</Button>
                        <Button variant="outline-danger" size="sm" className="rounded-3" onClick={() => handleDeleteGoal(goal.id)}>Xóa</Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* Modal Thêm Mục Tiêu */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered backdrop="static">
        <Modal.Header closeButton className="border-bottom-0 bg-light"><Modal.Title className="fw-bold">Tạo mục tiêu mới</Modal.Title></Modal.Header>
        <Form onSubmit={handleAddGoal}>
          <Modal.Body className="px-4">
            <Form.Group className="mb-4">
              <Form.Label className="fw-bold text-secondary text-uppercase" style={{ fontSize: '0.8rem' }}>Tên mục tiêu</Form.Label>
              <Form.Control type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required className="py-2"/>
            </Form.Group>
            <Form.Group className="mb-4">
              <Form.Label className="fw-bold text-secondary text-uppercase" style={{ fontSize: '0.8rem' }}>Số tiền cần đạt (VNĐ)</Form.Label>
              <Form.Control type="number" value={formData.targetAmount} onChange={(e) => setFormData({...formData, targetAmount: e.target.value})} required min="0" className="py-2"/>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold text-secondary text-uppercase" style={{ fontSize: '0.8rem' }}>Hạn chót dự kiến</Form.Label>
              <Form.Control type="date" value={formData.deadline} onChange={(e) => setFormData({...formData, deadline: e.target.value})} required className="py-2"/>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer className="border-top-0 px-4 pb-4">
            <Button variant="light" onClick={() => setShowModal(false)} className="fw-bold px-4">Hủy bỏ</Button>
            <Button variant="success" type="submit" disabled={isSubmitting} className="fw-bold px-4 shadow-sm">{isSubmitting ? 'Đang lưu...' : 'Lưu Mục Tiêu'}</Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Modal Sửa Mục Tiêu */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered backdrop="static">
        <Modal.Header closeButton className="border-bottom-0 bg-light"><Modal.Title className="fw-bold">Cập nhật tiến độ</Modal.Title></Modal.Header>
        <Form onSubmit={handleUpdateGoal}>
          <Modal.Body className="px-4">
            <Form.Group className="mb-4">
              <Form.Label className="fw-bold text-secondary text-uppercase" style={{ fontSize: '0.8rem' }}>Tên mục tiêu</Form.Label>
              <Form.Control type="text" value={editFormData.name} onChange={(e) => setEditFormData({...editFormData, name: e.target.value})} required className="py-2" />
            </Form.Group>
            <Form.Group className="mb-4">
              <Form.Label className="fw-bold text-secondary text-uppercase" style={{ fontSize: '0.8rem' }}>Số tiền cần đạt (VNĐ)</Form.Label>
              <Form.Control type="number" value={editFormData.targetAmount} onChange={(e) => setEditFormData({...editFormData, targetAmount: e.target.value})} required min="0" className="py-2" />
            </Form.Group>
            <Form.Group className="mb-4">
              <Form.Label className="fw-bold text-primary text-uppercase" style={{ fontSize: '0.8rem' }}>Đã gom được (VNĐ)</Form.Label>
              <Form.Control type="number" value={editFormData.currentAmount} onChange={(e) => setEditFormData({...editFormData, currentAmount: e.target.value})} required min="0" className="py-2 border-primary" />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold text-secondary text-uppercase" style={{ fontSize: '0.8rem' }}>Hạn chót dự kiến</Form.Label>
              <Form.Control type="date" value={editFormData.deadline} onChange={(e) => setEditFormData({...editFormData, deadline: e.target.value})} required className="py-2" />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer className="border-top-0 px-4 pb-4">
            <Button variant="light" onClick={() => setShowEditModal(false)} className="fw-bold px-4">Hủy</Button>
            <Button variant="primary" type="submit" disabled={isSubmitting} className="fw-bold px-4 shadow-sm">{isSubmitting ? 'Đang lưu...' : 'Cập nhật'}</Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default SavingGoals;