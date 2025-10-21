import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { API } from "../services/api";
import './Home.css';

function Home() {
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [isLogged, setLogged] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const userRequest = async () => {
      setLogged(false);
      setResult("");
      setError("");
      try {
        const userData = await API.user.getCurrentUser();
        setUser(userData);
        setResult(`Добро пожаловать, ${userData.login}`);
        setLogged(true);
      } catch (e) {
        if (e instanceof Error) {
          setError(e.message);
        }
      }
    };
    userRequest();
  }, []);

  const handleLogout = () => {
    const logoutRequest = async () => {
      try {
        await API.auth.logout();
        setLogged(false);
        setResult("");
        setUser(null);
        window.location.reload();
      } catch (e) {
        if (e instanceof Error) {
          setError(e.message);
        }
      }
    };
    logoutRequest();
  };

  return (
    <div className="container fade-in">
      <div className="page-header">
        <div className="brand-hero">
          <div className="hero-logo">
            <div className="logo-icon large">
              <div className="logo-plane">✈</div>
              <div className="logo-pulse"></div>
            </div>
            <h1 className="page-title">АВИАНОРД</h1>
          </div>
          <p className="page-subtitle">Надежные авиагрузоперевозки по всей России</p>
          <div className="hero-features">
            <span className="feature-tag">🚀 Быстро</span>
            <span className="feature-tag">🔒 Надежно</span>
            <span className="feature-tag">💰 Выгодно</span>
          </div>
        </div>
      </div>

      {result && (
        <div className="alert alert-success">
          <strong>Успешно!</strong> {result}
        </div>
      )}
      
      {error && (
        <div className="alert alert-error">
          <strong>Ошибка!</strong> {error}
        </div>
      )}

      <div className="grid grid-3">
        <div className="card feature-card">
          <div className="card-header">
            <div className="feature-icon">🚀</div>
            <h3 className="card-title">Скорость доставки</h3>
          </div>
          <p>Авиадоставка от 24 часов по основным направлениям России</p>
        </div>

        <div className="card feature-card">
          <div className="card-header">
            <div className="feature-icon">📊</div>
            <h3 className="card-title">Прозрачный расчет</h3>
          </div>
          <p>Точный онлайн-калькулятор стоимости без скрытых платежей</p>
        </div>

        <div className="card feature-card">
          <div className="card-header">
            <div className="feature-icon">🔒</div>
            <h3 className="card-title">Безопасность груза</h3>
          </div>
          <p>Специальная упаковка и температурный контроль для всех типов грузов</p>
        </div>
      </div>

      {isLogged && user && (
        <div className="card user-welcome">
          <div className="card-header">
            <h3 className="card-title">👋 Ваш профиль</h3>
          </div>
          <div className="user-info">
            <p><strong>Логин:</strong> {user.login}</p>
            <p><strong>Роль:</strong> {user.role === 'admin' ? 'Администратор' : 'Клиент'}</p>
            {user.full_name && <p><strong>ФИО:</strong> {user.full_name}</p>}
            {user.company_name && <p><strong>Компания:</strong> {user.company_name}</p>}
          </div>
          <div className="actions">
            <button onClick={handleLogout} className="btn btn-outline">
              🚪 Выйти
            </button>
          </div>
        </div>
      )}

      {!isLogged && (
        <div className="card auth-promo">
          <div className="card-header">
            <h3 className="card-title">Начните работу с Авианорд</h3>
          </div>
          <p>Войдите в систему или зарегистрируйтесь, чтобы получить доступ ко всем возможностям логистической платформы:</p>
          <div className="actions">
            <Link to="/login" className="btn btn-primary">
              🔐 Войти в систему
            </Link>
            <Link to="/registration" className="btn btn-secondary">
              👤 Зарегистрироваться
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;