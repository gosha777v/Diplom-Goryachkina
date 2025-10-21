import React from 'react';
import {
  Route,
  Routes
} from 'react-router-dom';
import './App.css';
import Home from "./views/Home";
import Layout from "./views/Layout";
import LoginView from "./views/LoginView";
import RegistrationView from "./views/RegistrationView";
import Calculator from "./components/Calculator/Calculator";
import CreateOrder from "./components/CreateOrder/CreateOrder";
import OrderList from "./components/OrderList/OrderList";

function App() {
  return <>
    <Routes>
      <Route path='/' element={<Layout/>}>
        <Route index element={<Home />} />
        <Route path='/login' element={<LoginView/>} />
        <Route path='/registration' element={<RegistrationView/>} />
        <Route path='/calculator' element={<Calculator/>} />
        <Route path='/orders' element={<OrderList/>} />
        <Route path='/create-order' element={<CreateOrder/>} />
      </Route>
    </Routes>
  </>;
}

export default App;