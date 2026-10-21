import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const AuthPage = () => {
  const [activeTab, setActiveTab] = useState('login');
  
  // Khai báo state lưu trữ thông tin đăng nhập
  const [loginData, setLoginData] = useState({
    username: '',
    password: ''
  });

  // Khai báo state lưu trữ thông tin đăng ký
  const [registerData, setRegisterData] = useState({
    fullName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const navigate = useNavigate();

  // Xử lý khi người dùng gõ vào ô input Đăng nhập
  const handleLoginChange = (e) => {
    setLoginData({
      ...loginData,
      [e.target.name]: e.target.value
    });
  };

  // Xử lý gửi request Đăng nhập lên Backend NestJS (cổng 3000)
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:3000/auth/login', {
        username: loginData.username,
        password: loginData.password
      });
      
      alert('Đăng nhập thành công!');
      console.log('Token trả về:', response.data);
      
      // Chuyển hướng sang trang quản trị hoặc trang chủ sau khi đăng nhập thành công
      navigate('/admin');
    } catch (error) {
      console.error('Lỗi đăng nhập:', error.response?.data || error.message);
      alert('Đăng nhập thất bại! Vui lòng kiểm tra lại tài khoản hoặc mật khẩu.');
    }
  };

  // Xử lý đăng ký (nếu backend đã có API register)
  const handleRegister = async (e) => {
    e.preventDefault();
    if (registerData.password !== registerData.confirmPassword) {
      alert('Mật khẩu nhập lại không khớp!');
      return;
    }
    
    try {
      // Ví dụ gọi API đăng ký (nếu backend có route /auth/register)
      // await axios.post('http://localhost:3000/auth/register', registerData);
      alert('Đăng ký thành công! Hãy chuyển sang tab Đăng Nhập.');
      setActiveTab('login');
    } catch (error) {
      console.error('Lỗi đăng ký:', error);
      alert('Đăng ký thất bại.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-emerald-900 via-slate-900 to-slate-950">
      <div className="bg-white/95 backdrop-blur-md w-full max-w-md rounded-2xl shadow-2xl p-8 border border-white/20">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500 text-white text-3xl mb-3 shadow-lg shadow-emerald-500/30">
            <i className="fa-solid fa-wallet"></i>
          </div>
          <h1 className="text-2xl font-bold text-slate-800">SmartMoney</h1>
          <p className="text-sm text-slate-500 mt-1">Hệ thống quản lý chi tiêu cá nhân thông minh</p>
        </div>

        {/* Nút chuyển đổi Tab */}
        <div className="flex bg-slate-100 p-1 rounded-xl mb-6 font-medium text-sm">
          <button 
            type="button"
            onClick={() => setActiveTab('login')} 
            className={`flex-1 py-2.5 rounded-lg ${activeTab === 'login' ? 'text-slate-700 bg-white shadow-sm font-semibold' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Đăng Nhập
          </button>
          <button 
            type="button"
            onClick={() => setActiveTab('register')} 
            className={`flex-1 py-2.5 rounded-lg ${activeTab === 'register' ? 'text-slate-700 bg-white shadow-sm font-semibold' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Đăng Ký
          </button>
        </div>

        {/* Form Đăng Nhập */}
        <form onSubmit={handleLogin} className={`space-y-4 ${activeTab === 'login' ? 'block' : 'hidden'}`}>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">Tên đăng nhập hoặc Email</label>
            <input 
              type="text" 
              name="username"
              value={loginData.username}
              onChange={handleLoginChange}
              required 
              placeholder="user@smartmoney.vn" 
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" 
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">Mật khẩu</label>
            <input 
              type="password" 
              name="password"
              value={loginData.password}
              onChange={handleLoginChange}
              required 
              placeholder="Mật khẩu" 
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" 
            />
          </div>
          <button type="submit" className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-lg shadow-emerald-600/30 transition">
            Đăng Nhập Hệ Thống
          </button>
        </form>

        {/* Form Đăng Ký */}
        <form onSubmit={handleRegister} className={`space-y-3.5 ${activeTab === 'register' ? 'block' : 'hidden'}`}>
          <input 
            type="text" 
            required 
            placeholder="Họ và tên" 
            onChange={(e) => setRegisterData({...registerData, fullName: e.target.value})}
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm" 
          />
          <input 
            type="text" 
            required 
            placeholder="Tên đăng nhập" 
            onChange={(e) => setRegisterData({...registerData, username: e.target.value})}
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm" 
          />
          <input 
            type="email" 
            required 
            placeholder="Email" 
            onChange={(e) => setRegisterData({...registerData, email: e.target.value})}
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm" 
          />
          <div className="grid grid-cols-2 gap-2">
            <input 
              type="password" 
              required 
              placeholder="Mật khẩu" 
              onChange={(e) => setRegisterData({...registerData, password: e.target.value})}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm" 
            />
            <input 
              type="password" 
              required 
              placeholder="Nhập lại mật khẩu" 
              onChange={(e) => setRegisterData({...registerData, confirmPassword: e.target.value})}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm" 
            />
          </div>
          <button type="submit" className="w-full py-3 mt-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl">
            Đăng Ký Tài Khoản
          </button>
        </form>
        
        <Link to="/" className="mt-5 block text-center text-sm font-semibold text-emerald-700 hover:underline">
          Về trang chủ SmartMoney
        </Link>
      </div>
    </div>
  );
};

export default AuthPage;