import React, { useState } from 'react';
import { useNavigate } from "react-router-dom";
import LoginForm, { LoginFormData } from "../components/LoginForm/LoginForm";
import { API } from "../services/api";

const LoginView = () => {
  const navigate = useNavigate();
  const [result, setResult] = useState("");
  const [error, setError] = useState("");

  const onSubmit = (data: LoginFormData) => {
    const authRequest = async () => {
      setResult("");
      setError("");
      try {
        await API.auth.login(data);
        setResult("Пользователь успешно вошел!");
        setTimeout(() => {
          navigate("/");
        }, 1000);
      } catch (e) {
        if (e instanceof Error) {
          setError(e.message);
        }
      }
    };
    authRequest();
  };

  return (
    <div>
      <LoginForm onSubmit={onSubmit}/>
      {result && <>{result}</>}
      {error && <>{error}</>}
    </div>
  );
};

export default LoginView;