import { Modal, Button, Spinner } from 'react-bootstrap';

/** Hộp thoại xác nhận (xoá, khoá tài khoản...) */
export default function ConfirmDialog({
  show, title, message, confirmText = 'Xoá', variant = 'danger', loading, onConfirm, onClose,
}) {
  return (
    <Modal show={show} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title as="h5">{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ whiteSpace: 'pre-line' }}>{message}</Modal.Body>
      <Modal.Footer>
        <Button variant="light" onClick={onClose}>Huỷ</Button>
        <Button variant={variant} onClick={onConfirm} disabled={loading}>
          {loading ? <Spinner size="sm" animation="border" /> : confirmText}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
