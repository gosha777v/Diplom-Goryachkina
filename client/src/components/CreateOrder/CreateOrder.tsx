import React, { useState, useEffect } from 'react';
import { API, CargoType, Address, CalculationResult, CreateOrderData } from '../../services/api';
import './CreateOrder.css';

interface CreateOrderProps {
  calculation?: CalculationResult;
  onOrderCreated?: (orderId: number) => void;
}

const CreateOrder: React.FC<CreateOrderProps> = ({ calculation, onOrderCreated }) => {
  const [cargoTypes, setCargoTypes] = useState<CargoType[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState<CreateOrderData>({
    customer_full_name: '',
    customer_phone: '',
    pickup_address_id: 0,
    delivery_address_id: 0,
    cargo_description: '',
    cargo_type_id: 0,
    quantity_places: 1,
    weight_kg: undefined,
    volume_m3: undefined,
    dimensions: { length: 0, width: 0, height: 0 },
    declared_value: undefined,
    temperature_requirements: '',
    total_price: calculation?.calculated_price || 0,
    payment_method: 'transfer'
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (calculation) {
      setFormData(prev => ({
        ...prev,
        total_price: calculation.calculated_price
      }));
    }
  }, [calculation]);

  const loadData = async () => {
    try {
      const [types, addressesData] = await Promise.all([
        API.cargo.getCargoTypes(),
        API.cargo.getUserAddresses()
      ]);
      setCargoTypes(types);
      setAddresses(addressesData);
    } catch (err) {
      setError('Ошибка при загрузке данных');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name.startsWith('dimensions.')) {
      const dimensionField = name.split('.')[1] as keyof { length: number; width: number; height: number };
      setFormData((prev: CreateOrderData) => ({
        ...prev,
        dimensions: {
          ...prev.dimensions!,
          [dimensionField]: parseFloat(value) || 0
        }
      }));
    } else {
      setFormData((prev: CreateOrderData) => ({
        ...prev,
        [name]: value === '' ? undefined : 
                (['pickup_address_id', 'delivery_address_id', 'cargo_type_id', 'quantity_places'].includes(name) ? 
                 parseInt(value) : 
                 (['weight_kg', 'volume_m3', 'declared_value', 'total_price'].includes(name) ? 
                  parseFloat(value) : value))
      }));
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (!formData.customer_full_name || !formData.customer_phone) {
        setError('Заполните обязательные поля: ФИО и телефон');
        setLoading(false);
        return;
      }

      if (!formData.pickup_address_id || !formData.delivery_address_id) {
        setError('Выберите адреса забора и доставки');
        setLoading(false);
        return;
      }

      if (!formData.cargo_type_id || !formData.cargo_description) {
        setError('Заполните информацию о грузе');
        setLoading(false);
        return;
      }

      const orderData: CreateOrderData = {
        ...formData,
        calculation_id: calculation?.calculation_id
      };

      const result = await API.cargo.createOrder(orderData);
      setSuccess(`Заказ успешно создан! Номер заказа: ${result.order_number}`);
      
      if (onOrderCreated) {
        onOrderCreated(result.order_id);
      }

      setFormData({
        customer_full_name: '',
        customer_phone: '',
        pickup_address_id: 0,
        delivery_address_id: 0,
        cargo_description: '',
        cargo_type_id: 0,
        quantity_places: 1,
        weight_kg: undefined,
        volume_m3: undefined,
        dimensions: { length: 0, width: 0, height: 0 },
        declared_value: undefined,
        temperature_requirements: '',
        total_price: 0,
        payment_method: 'transfer'
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при создании заказа');
    } finally {
      setLoading(false);
    }
  };

  const pickupAddresses = addresses.filter(addr => addr.address_type === 'pickup');
  const deliveryAddresses = addresses.filter(addr => addr.address_type === 'delivery');

  return (
    <div className="create-order">
      <h2>Создание заказа на доставку</h2>
      
      {calculation && (
        <div className="calculation-info">
          <h3>Информация о расчете</h3>
          <p><strong>Стоимость доставки:</strong> {calculation.calculated_price.toFixed(2)} руб.</p>
          <p><strong>Номер расчета:</strong> {calculation.calculation_id}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="order-form">
        <div className="form-section">
          <h3>Информация о клиенте</h3>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="customer_full_name">ФИО отправителя *</label>
              <input
                type="text"
                id="customer_full_name"
                name="customer_full_name"
                value={formData.customer_full_name}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="customer_phone">Телефон *</label>
              <input
                type="tel"
                id="customer_phone"
                name="customer_phone"
                value={formData.customer_phone}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Адреса</h3>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="pickup_address_id">Адрес забора груза *</label>
              <select
                id="pickup_address_id"
                name="pickup_address_id"
                value={formData.pickup_address_id}
                onChange={handleInputChange}
                required
              >
                <option value="">Выберите адрес забора</option>
                {pickupAddresses.map((address: Address) => (
  <option key={address.address_id} value={address.address_id}>
    {address.full_address} ({address.contact_person})
  </option>
))}
              </select>
              <small>Нет подходящего адреса? <a href="#add-address">Добавить новый</a></small>
            </div>
            <div className="form-group">
              <label htmlFor="delivery_address_id">Адрес доставки *</label>
              <select
                id="delivery_address_id"
                name="delivery_address_id"
                value={formData.delivery_address_id}
                onChange={handleInputChange}
                required
              >
                <option value="">Выберите адрес доставки</option>
                {deliveryAddresses.map(address => (
                  <option key={address.address_id} value={address.address_id}>
                    {address.full_address} ({address.contact_person})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Информация о грузе</h3>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="cargo_type_id">Тип груза *</label>
              <select
                id="cargo_type_id"
                name="cargo_type_id"
                value={formData.cargo_type_id}
                onChange={handleInputChange}
                required
              >
                <option value="">Выберите тип груза</option>
                {cargoTypes.map(type => (
                  <option key={type.type_id} value={type.type_id}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="quantity_places">Количество мест</label>
              <input
                type="number"
                id="quantity_places"
                name="quantity_places"
                value={formData.quantity_places || ''}
                onChange={handleInputChange}
                min="1"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="cargo_description">Описание груза *</label>
            <textarea
              id="cargo_description"
              name="cargo_description"
              value={formData.cargo_description}
              onChange={handleInputChange}
              rows={3}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="weight_kg">Вес (кг)</label>
              <input
                type="number"
                id="weight_kg"
                name="weight_kg"
                value={formData.weight_kg || ''}
                onChange={handleInputChange}
                step="0.1"
                min="0"
              />
            </div>
            <div className="form-group">
              <label htmlFor="volume_m3">Объем (м³)</label>
              <input
                type="number"
                id="volume_m3"
                name="volume_m3"
                value={formData.volume_m3 || ''}
                onChange={handleInputChange}
                step="0.01"
                min="0"
              />
            </div>
          </div>

          <div className="form-section">
            <h4>Габариты (см)</h4>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="dimensions.length">Длина</label>
                <input
                  type="number"
                  id="dimensions.length"
                  name="dimensions.length"
                  value={formData.dimensions?.length || ''}
                  onChange={handleInputChange}
                  min="0"
                />
              </div>
              <div className="form-group">
                <label htmlFor="dimensions.width">Ширина</label>
                <input
                  type="number"
                  id="dimensions.width"
                  name="dimensions.width"
                  value={formData.dimensions?.width || ''}
                  onChange={handleInputChange}
                  min="0"
                />
              </div>
              <div className="form-group">
                <label htmlFor="dimensions.height">Высота</label>
                <input
                  type="number"
                  id="dimensions.height"
                  name="dimensions.height"
                  value={formData.dimensions?.height || ''}
                  onChange={handleInputChange}
                  min="0"
                />
              </div>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="declared_value">Объявленная ценность (руб)</label>
              <input
                type="number"
                id="declared_value"
                name="declared_value"
                value={formData.declared_value || ''}
                onChange={handleInputChange}
                step="0.01"
                min="0"
              />
            </div>
            <div className="form-group">
              <label htmlFor="temperature_requirements">Температурный режим</label>
              <input
                type="text"
                id="temperature_requirements"
                name="temperature_requirements"
                value={formData.temperature_requirements || ''}
                onChange={handleInputChange}
                placeholder="Например: +2°C до +6°C"
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Оплата</h3>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="total_price">Общая стоимость (руб) *</label>
              <input
                type="number"
                id="total_price"
                name="total_price"
                value={formData.total_price}
                onChange={handleInputChange}
                step="0.01"
                min="0"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="payment_method">Способ оплаты</label>
              <select
                id="payment_method"
                name="payment_method"
                value={formData.payment_method}
                onChange={handleInputChange}
              >
                <option value="transfer">Банковский перевод</option>
                <option value="sbp">СБП</option>
                <option value="cash">Наличные</option>
              </select>
            </div>
          </div>
        </div>

        <button type="submit" disabled={loading} className="submit-btn">
          {loading ? 'Создание заказа...' : 'Создать заказ'}
        </button>
      </form>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}
    </div>
  );
};

export default CreateOrder;