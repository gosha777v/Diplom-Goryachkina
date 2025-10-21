import React from 'react';
import { useForm } from 'react-hook-form';
import { isValidLogin, required, composeValidators } from '../../validators';
import './RegistrationForm.module.css';

export type RegistrationFormData = {
  login: string;
  password: string;
  confirmPassword: string;
  role?: string;
  profileData?: {
    full_name?: string;
    company_name?: string;
    phone?: string;
    company_legal_address?: string;
    company_tax_id?: string;
  };
};

type Props = {
  onSubmit: (data: RegistrationFormData) => void;
};

const RegistrationForm: React.FC<Props> = ({ onSubmit }) => {
  const { 
    register, 
    handleSubmit, 
    watch,
    formState: { errors, isSubmitting } 
  } = useForm<RegistrationFormData>();

  const password = watch('password');

  const validateConfirmPassword = (value: string) => {
    if (!value) return 'Поле обязательно';
    if (value !== password) return 'Пароли не совпадают';
    return undefined;
  };

  const onFormSubmit = async (data: RegistrationFormData) => {
    await onSubmit(data);
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h2>👤 Регистрация</h2>
          <p>Создайте новый аккаунт</p>
        </div>
        
        <form onSubmit={handleSubmit(onFormSubmit)} className="auth-form">
          <div className="form-group">
            <label htmlFor="login" className="form-label">Логин</label>
            <input
              id="login"
              type="text"
              className={`form-input ${errors.login ? 'error' : ''}`}
              placeholder="Придумайте логин"
              {...register('login', {
                validate: composeValidators(required, isValidLogin)
              })}
            />
            {errors.login && (
              <span className="form-error">{errors.login.message}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">Пароль</label>
            <input
              id="password"
              type="password"
              className={`form-input ${errors.password ? 'error' : ''}`}
              placeholder="Придумайте пароль"
              {...register('password', {
                validate: required
              })}
            />
            {errors.password && (
              <span className="form-error">{errors.password.message}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword" className="form-label">Подтверждение пароля</label>
            <input
              id="confirmPassword"
              type="password"
              className={`form-input ${errors.confirmPassword ? 'error' : ''}`}
              placeholder="Повторите пароль"
              {...register('confirmPassword', {
                validate: validateConfirmPassword
              })}
            />
            {errors.confirmPassword && (
              <span className="form-error">{errors.confirmPassword.message}</span>
            )}
          </div>

          <button 
            type="submit" 
            className="btn btn-primary btn-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? '⏳ Регистрация...' : '🚀 Зарегистрироваться'}
          </button>
        </form>

        <div className="auth-footer">
          <p>Уже есть аккаунт? <a href="/login" className="auth-link">Войдите</a></p>
        </div>
      </div>
    </div>
  );
};

export default RegistrationForm;