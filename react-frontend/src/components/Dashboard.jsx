import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
// Import CSS của Bootstrap nếu file index.tsx của nhóm chưa import
import 'bootstrap/dist/css/bootstrap.min.css';
import { Outlet, Link } from 'react-router-dom';

export default function Dashboard() {
  const [summary, setSummary] = useState({ totalBalance: 0, totalIncome: 0, totalExpense: 0 });

  useEffect(() => {
    // Gọi API từ Backend NestJS (Mặc định NestJS chạy port 3000)
    fetch('http://localhost:3000/dashboard/summary')
      .then(res => res.json())
      .then(data => setSummary(data))
      .catch(err => console.error('Lỗi lấy dữ liệu API:', err));
  }, []);

  return (
    <Container className="mt-4">
      <h2 className="mb-4">Tổng quan tài chính</h2>
      <Row>
        <Col md={4}>
          <Card className="text-white bg-primary mb-3 shadow-sm">
            <Card.Body>
              <Card.Title>Tổng số dư</Card.Title>
              <Card.Text className="fs-3 fw-bold">
                {summary.totalBalance.toLocaleString('vi-VN')} đ
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="text-white bg-success mb-3 shadow-sm">
            <Card.Body>
              <Card.Title>Tổng thu</Card.Title>
              <Card.Text className="fs-3 fw-bold">
                {summary.totalIncome.toLocaleString('vi-VN')} đ
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="text-white bg-danger mb-3 shadow-sm">
            <Card.Body>
              <Card.Title>Tổng chi</Card.Title>
              <Card.Text className="fs-3 fw-bold">
                {summary.totalExpense.toLocaleString('vi-VN')} đ
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}