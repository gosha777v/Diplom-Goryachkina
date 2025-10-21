import React, { useState, useEffect } from 'react';
import { API, CargoType, CityPrice, CalculationRequest } from '../../services/api';
import './Calculator.css';

const Calculator: React.FC = () => {
  const [cargoTypes, setCargoTypes] = useState<CargoType[]>([]);
  const [cities, setCities] = useState<CityPrice[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState<CalculationRequest>({
    cargo_type_id: 0,
    weight_kg: undefined,
    volume_m3: undefined,
    city_to: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [types, citiesData] = await Promise.all([
        API.cargo.getCargoTypes(),
        API.cargo.getCities()
      ]);
      setCargoTypes(types);
      setCities(citiesData);
    } catch (err) {
      setError('Ошибка при загрузке данных');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev: CalculationRequest) => ({
      ...prev,
      [name]: value === '' ? undefined : (name.includes('_id') ? parseInt(value) : value)
    }));
  };

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    try {
      if (!formData.cargo_type_id || !formData.city_to) {
        setError('Выберите тип груза и город назначения');
        setLoading(false);
        return;
      }

      if (!formData.weight_kg && !formData.volume_m3) {
        setError('Укажите вес или объем груза');
        setLoading(false);
        return;
      }

      const calculationResult = await API.cargo.calculatePrice(formData);
      setResult(calculationResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при расчете стоимости');
    } finally {
      setLoading(false);
    }
  };

  const selectedCargoType = cargoTypes.find(type => type.type_id === formData.cargo_type_id);
  const selectedCity = cities.find(city => city.city_name === formData.city_to);

  return (
    <div className="calculator">
      <h2>Калькулятор стоимости доставки</h2>
      
      <form onSubmit={handleCalculate} className="calculator-form">
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
            {cargoTypes.map((type: CargoType) => (
              <option key={type.type_id} value={type.type_id}>
                {type.name} ({type.base_price_per_kg} руб/кг, {type.base_price_per_m3} руб/м³)
              </option>
            ))}
          </select>
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
              placeholder="0.0"
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
              placeholder="0.00"
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="city_to">Город назначения *</label>
          <select
            id="city_to"
            name="city_to"
            value={formData.city_to}
            onChange={handleInputChange}
            required
          >
            <option value="">Выберите город</option>
            {cities.map((city: CityPrice) => (
              <option key={city.city_id} value={city.city_name}>
                {city.city_name} (коэф. {city.price_multiplier})
              </option>
            ))}
          </select>
        </div>

        <button type="submit" disabled={loading} className="calculate-btn">
          {loading ? 'Расчет...' : 'Рассчитать стоимость'}
        </button>
      </form>

      {error && <div className="error-message">{error}</div>}

      {result && (
        <div className="calculation-result">
          <h3>Результат расчета</h3>
          <div className="result-item">
            <strong>Стоимость доставки:</strong> {result.calculated_price.toFixed(2)} руб.
          </div>
          <div className="result-item">
            <strong>Базовая стоимость:</strong> {result.base_price.toFixed(2)} руб.
          </div>
          <div className="result-item">
            <strong>Множитель города:</strong> {result.city_multiplier}
          </div>
          <div className="result-item">
            <strong>Формула расчета:</strong> {result.formula}
          </div>
          <div className="result-actions">
            <button 
              className="create-order-btn"
              onClick={() => {
                console.log('Создание заказа с расчетом:', result.calculation_id);
              }}
            >
              Создать заказ
            </button>
          </div>
        </div>
      )}

      {selectedCargoType && (
        <div className="cargo-info">
          <h4>Информация о типе груза:</h4>
          <p><strong>Название:</strong> {selectedCargoType.name}</p>
          <p><strong>Описание:</strong> {selectedCargoType.description}</p>
          <p><strong>Требует температурного режима:</strong> {selectedCargoType.requires_temperature ? 'Да' : 'Нет'}</p>
        </div>
      )}
    </div>
  );
};

export default Calculator;