const express = require('express');
const cargoRouter = express.Router();
const { getUserIdByToken } = require("../db/tokens");
const { getUserById, isAdmin } = require("../db/users");
const cargoModel = require("../db/cargo");

const requireAuth = async (req, res, next) => {
    const token = req.cookies.token;
    const userId = await getUserIdByToken(token);
    
    if (!userId) {
        return res.status(401).json({
            message: "Пользователь не авторизован"
        });
    }
    
    req.userId = userId;
    req.user = await getUserById(userId);
    next();
};

const requireAdmin = async (req, res, next) => {
    if (!isAdmin(req.user)) {
        return res.status(403).json({
            message: "Недостаточно прав. Требуются права администратора"
        });
    }
    next();
};

cargoRouter.get("/types", async (req, res) => {
    try {
        const cargoTypes = await cargoModel.getCargoTypes();
        res.status(200).json(cargoTypes);
    } catch (error) {
        res.status(500).json({
            message: "Ошибка при получении типов грузов"
        });
    }
});

cargoRouter.get("/cities", async (req, res) => {
    try {
        const cities = await cargoModel.getCities();
        res.status(200).json(cities);
    } catch (error) {
        res.status(500).json({
            message: "Ошибка при получении списка городов"
        });
    }
});

cargoRouter.post("/calculate", requireAuth, async (req, res) => {
    try {
        const calculationData = {
            ...req.body,
            user_id: req.userId
        };

        if (!calculationData.cargo_type_id || !calculationData.city_to) {
            return res.status(400).json({
                message: "Обязательные поля: cargo_type_id, city_to"
            });
        }

        if (!calculationData.weight_kg && !calculationData.volume_m3) {
            return res.status(400).json({
                message: "Укажите вес или объем груза"
            });
        }

        const result = await cargoModel.calculatePrice(calculationData);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({
            message: error.message || "Ошибка при расчете стоимости"

        });
        return {
    calculation_id: result.lastID,
    calculated_price: Math.round(finalPrice),
    base_price: Math.round(basePrice),
    city_multiplier: multiplier,
    formula: `MAX(${weight_kg} × ${cargoType.base_price_per_kg}, ${volume_m3} × ${cargoType.base_price_per_m3}) × ${multiplier}`
};
    }
});

cargoRouter.get("/addresses", requireAuth, async (req, res) => {
    try {
        const addresses = await cargoModel.getUserAddresses(req.userId);
        res.status(200).json(addresses);
    } catch (error) {
        res.status(500).json({
            message: "Ошибка при получении адресов"
        });
    }
});

cargoRouter.post("/addresses", requireAuth, async (req, res) => {
    try {
        const addressData = {
            ...req.body,
            user_id: req.userId
        };

        const addressId = await cargoModel.addAddress(addressData);
        res.status(201).json({
            message: "Адрес успешно добавлен",
            address_id: addressId
        });
    } catch (error) {
        res.status(500).json({
            message: "Ошибка при добавлении адреса"
        });
    }
});

cargoRouter.post("/orders", requireAuth, async (req, res) => {
    try {
        const orderData = {
            ...req.body,
            user_id: req.userId,
            order_number: `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`
        };

        const orderId = await cargoModel.createOrder(orderData);
        res.status(201).json({
            message: "Заказ успешно создан",
            order_id: orderId,
            order_number: orderData.order_number
        });
    } catch (error) {
        res.status(500).json({
            message: "Ошибка при создании заказа"
        });
    }
});

cargoRouter.get("/orders", requireAuth, async (req, res) => {
    try {
        const orders = await cargoModel.getUserOrders(req.userId);
        res.status(200).json(orders);
    } catch (error) {
        res.status(500).json({
            message: "Ошибка при получении заказов"
        });
    }
});

cargoRouter.get("/orders/:orderId", requireAuth, async (req, res) => {
    try {
        const order = await cargoModel.getOrderById(req.params.orderId);
        
        if (!order) {
            return res.status(404).json({
                message: "Заказ не найден"
            });
        }

        if (order.user_id !== req.userId && !isAdmin(req.user)) {
            return res.status(403).json({
                message: "Нет доступа к этому заказу"
            });
        }

        res.status(200).json(order);
    } catch (error) {
        res.status(500).json({
            message: "Ошибка при получении заказа"
        });
    }
});


cargoRouter.get("/admin/orders", requireAuth, requireAdmin, async (req, res) => {
    try {
        const orders = await cargoModel.getAllOrders();
        res.status(200).json(orders);
    } catch (error) {
        res.status(500).json({
            message: "Ошибка при получении заказов"
        });
    }
});

cargoRouter.put("/admin/orders/:orderId/status", requireAuth, requireAdmin, async (req, res) => {
    try {
        const { status, notes } = req.body;
        
        if (!status) {
            return res.status(400).json({
                message: "Статус обязателен"
            });
        }

        await cargoModel.updateOrderStatus(req.params.orderId, status, req.userId, notes);
        res.status(200).json({
            message: "Статус заказа обновлен"
        });
    } catch (error) {
        res.status(500).json({
            message: "Ошибка при обновлении статуса заказа"
        });
    }
});

module.exports = cargoRouter;