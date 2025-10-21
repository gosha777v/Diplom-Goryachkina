import React from 'react';
import { Outlet, Link, useLocation } from "react-router-dom";
import './Layout.css';

const Layout = () => {
  const location = useLocation();

  return (
    <div className="app-dark">
      <nav className="nav-dark">
        <div className="nav-container">
          <Link to="/" className="nav-logo">
            <div className="logo-container">
              <div className="logo-icon">
                <div className="logo-plane">✈</div>
                <div className="logo-pulse"></div>
              </div>
              <div className="logo-text">
                <span className="logo-title">АВИАНОРД</span>
                <span className="logo-subtitle">грузоперевозки</span>
              </div>
            </div>
          </Link>
          
          <ul className="nav-menu">
            <li className="nav-item">
              <Link 
                to="/" 
                className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
              >
                🏠 Главная
              </Link>
            </li>
            <li className="nav-item">
              <Link 
                to="/calculator" 
                className={`nav-link ${location.pathname === '/calculator' ? 'active' : ''}`}
              >
                📊 Калькулятор
              </Link>
            </li>
            <li className="nav-item">
              <Link 
                to="/orders" 
                className={`nav-link ${location.pathname === '/orders' ? 'active' : ''}`}
              >
                📦 Мои заказы
              </Link>
            </li>
            <li className="nav-item">
              <Link 
                to="/create-order" 
                className={`nav-link ${location.pathname === '/create-order' ? 'active' : ''}`}
              >
                🚀 Создать заказ
              </Link>
            </li>
            <li className="nav-item">
              <Link 
                to="/registration" 
                className={`nav-link ${location.pathname === '/registration' ? 'active' : ''}`}
              >
                👤 Регистрация
              </Link>
            </li>
            <li className="nav-item">
              <Link 
                to="/login" 
                className={`nav-link ${location.pathname === '/login' ? 'active' : ''}`}
              >
                🔐 Вход
              </Link>
            </li>
          </ul>
        </div>
      </nav>

      <main className="main-content">
        <Outlet />
      </main>

      <footer className="footer-dark">
        <div className="container">
          <div className="footer-content">
            <div className="footer-logo">
              <div className="logo-container">
                <div className="logo-icon">
                  <div className="logo-plane">✈</div>
                </div>
                <div className="logo-text">
                  <span className="logo-title">АВИАНОРД</span>
                  <span className="logo-subtitle">грузоперевозки</span>
                </div>
              </div>
            </div>
            <p>© 2024 ООО Авианорд. Система управления грузоперевозками</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;