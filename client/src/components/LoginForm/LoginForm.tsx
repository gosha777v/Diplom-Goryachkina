import React from 'react';
import { useForm } from 'react-hook-form';
import { isValidLogin, required, composeValidators } from '../../validators';
import './LoginForm.module.css';

export type LoginFormData = {
  login: string;
  password: string;
};

type Props = {
  onSubmit: (data: LoginFormData) => void;
};

const LoginForm: React.FC<Props> = ({ onSubmit }) => {
  const { 
    register, 
    handleSubmit, 
    formState: { errors, isSubmitting } 
  } = useForm<LoginFormData>();

  const onFormSubmit = async (data: LoginFormData) => {
    await onSubmit(data);
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h2>🔐 Вход в систему</h2>
          <p>Введите ваши учетные данные</p>
        </div>
        
        <form onSubmit={handleSubmit(onFormSubmit)} className="auth-form">
  <div className="form-group">
    <label htmlFor="login" className="form-label">Логин</label>
    <input
      id="login"
      type="text"
      className={`form-input compact ${errors.login ? 'error' : ''}`}
      placeholder="Ваш логин"
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
      className={`form-input compact ${errors.password ? 'error' : ''}`}
      placeholder="Ваш пароль"
      {...register('password', {
        validate: required
      })}
    />
    {errors.password && (
      <span className="form-error">{errors.password.message}</span>
    )}
  </div>

          <button 
            type="submit" 
            className="btn btn-primary btn-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? '⏳ Вход...' : '🚀 Войти'}
          </button>
        </form>

        <div className="auth-footer">
          <p>Нет аккаунта? <a href="/registration" className="auth-link">Зарегистрируйтесь</a></p>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;