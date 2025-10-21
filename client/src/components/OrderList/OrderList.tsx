import React, { useState, useEffect } from 'react';
import { API, Order } from '../../services/api';
import './OrderList.css';

const OrderList: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const ordersData = await API.cargo.getUserOrders();
      setOrders(ordersData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при загрузке заказов');
    } finally {
      setLoading(false);
    }
  };


  const getStatusColor = (status: string): string => {
  const statusColors: { [key: string]: string } = {
    pending: '#ffc107',
    waiting_payment: '#17a2b8',
    paid: '#007bff',
    processing: '#6f42c1',
    in_transit: '#fd7e14',
    delivered: '#28a745',
    cancelled: '#dc3545'
  };
  return statusColors[status] || '#6c757d';
};

const getStatusText = (status: string): string => {
  const statusTexts: { [key: string]: string } = {
    pending: 'Ожидает обработки',
    waiting_payment: 'Ожидает оплаты',
    paid: 'Оплачен',
    processing: 'В обработке',
    in_transit: 'В пути',
    delivered: 'Доставлен',
    cancelled: 'Отменен'
  };
  return statusTexts[status] || status;
};

  if (loading) {
    return <div className="loading">Загрузка заказов...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="order-list">
      <h2>Мои заказы</h2>
      
      {orders.length === 0 ? (
        <div className="no-orders">
          <p>У вас пока нет заказов</p>
          <a href="/calculator" className="create-order-link">
            Создать первый заказ
          </a>
        </div>
      ) : (
        <div className="orders-grid">
         {orders.map((order: Order) => (
  <div key={order.order_id} className="order-card">
              <div className="order-header">
                <h3>Заказ #{order.order_number}</h3>
                <span 
                  className="status-badge"
                  style={{ backgroundColor: getStatusColor(order.status || order.current_status || 'pending') }}
                >
                  {getStatusText(order.status || order.current_status || 'pending')}
                </span>
              </div>
              
              <div className="order-info">
                <div className="info-row">
                  <strong>Груз:</strong> {order.cargo_description}
                </div>
                <div className="info-row">
                  <strong>Тип груза:</strong> {order.cargo_type_name}
                </div>
                <div className="info-row">
                  <strong>Адрес забора:</strong> {order.pickup_address}
                </div>
                <div className="info-row">
                  <strong>Адрес доставки:</strong> {order.delivery_address}
                </div>
                {order.weight_kg && (
                  <div className="info-row">
                    <strong>Вес:</strong> {order.weight_kg} кг
                  </div>
                )}
                {order.volume_m3 && (
                  <div className="info-row">
                    <strong>Объем:</strong> {order.volume_m3} м³
                  </div>
                )}
                <div className="info-row">
                  <strong>Стоимость:</strong> {order.total_price.toFixed(2)} руб.
                </div>
                <div className="info-row">
                  <strong>Создан:</strong> {new Date(order.created_at).toLocaleDateString('ru-RU')}
                </div>
              </div>
              
              <div className="order-actions">
                <button 
                  className="details-btn"
                  onClick={() => {
                    console.log('Просмотр заказа:', order.order_id);
                  }}
                >
                  Подробнее
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrderList;