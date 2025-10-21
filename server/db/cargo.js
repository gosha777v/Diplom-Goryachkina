const { getDb } = require("./db");

const CARGO_TYPES_TABLE = "cargo_types";
const CITY_PRICES_TABLE = "city_prices";
const CALCULATION_REQUESTS_TABLE = "calculation_requests";
const ORDERS_TABLE = "orders";
const ADDRESSES_TABLE = "addresses";

module.exports = {
    getCargoTypes: async () => {
        return await getDb().all(`SELECT * FROM ${CARGO_TYPES_TABLE} ORDER BY name`);
    },

    getCargoTypeById: async (typeId) => {
        return await getDb().get(`SELECT * FROM ${CARGO_TYPES_TABLE} WHERE type_id = ?`, typeId);
    },

    getCities: async () => {
        return await getDb().all(`SELECT * FROM ${CITY_PRICES_TABLE} ORDER BY city_name`);
    },

    getCityPrice: async (cityName) => {
        const city = await getDb().get(`SELECT * FROM ${CITY_PRICES_TABLE} WHERE city_name = ?`, cityName);
        return city ? city.price_multiplier : 1.0;
    },

    calculatePrice: async (calculationData) => {
        const { cargo_type_id, weight_kg, volume_m3, city_to } = calculationData;
        
        const cargoType = await getDb().get(`SELECT * FROM ${CARGO_TYPES_TABLE} WHERE type_id = ?`, cargo_type_id);
        if (!cargoType) {
            throw new Error("Тип груза не найден");
        }

        const cityMultiplier = await getDb().get(`SELECT price_multiplier FROM ${CITY_PRICES_TABLE} WHERE city_name = ?`, city_to);
        const multiplier = cityMultiplier ? cityMultiplier.price_multiplier : 1.0;

        const priceByWeight = weight_kg * cargoType.base_price_per_kg;
        const priceByVolume = volume_m3 * cargoType.base_price_per_m3;
        const basePrice = Math.max(priceByWeight, priceByVolume);
        
        const finalPrice = basePrice * multiplier;

        const result = await getDb().run(
            `INSERT INTO ${CALCULATION_REQUESTS_TABLE} 
             (user_id, cargo_type_id, weight_kg, volume_m3, city_to, calculated_price, calculation_formula) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            calculationData.user_id,
            cargo_type_id,
            weight_kg,
            volume_m3,
            city_to,
            finalPrice,
            `MAX(${weight_kg} * ${cargoType.base_price_per_kg}, ${volume_m3} * ${cargoType.base_price_per_m3}) * ${multiplier}`
        );

        return {
            calculation_id: result.lastID,
            calculated_price: finalPrice,
            base_price: basePrice,
            city_multiplier: multiplier,
            formula: `MAX(вес × цена_за_кг, объем × цена_за_м³) × множитель_города`
        };
    },

    getUserAddresses: async (userId) => {
        return await getDb().all(`SELECT * FROM ${ADDRESSES_TABLE} WHERE user_id = ? ORDER BY is_default DESC, created_at DESC`, userId);
    },

    addAddress: async (addressData) => {
        const { user_id, full_address, address_type, city, contact_person, contact_phone, is_default = false } = addressData;
        
        if (is_default) {
            await getDb().run(`UPDATE ${ADDRESSES_TABLE} SET is_default = FALSE WHERE user_id = ? AND address_type = ?`, user_id, address_type);
        }

        const result = await getDb().run(
            `INSERT INTO ${ADDRESSES_TABLE} (user_id, full_address, address_type, city, contact_person, contact_phone, is_default)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            user_id, full_address, address_type, city, contact_person, contact_phone, is_default
        );

        return result.lastID;
    },

    createOrder: async (orderData) => {
        const {
            user_id, calculation_id, order_number, customer_full_name, customer_phone,
            pickup_address_id, delivery_address_id, cargo_description, cargo_type_id,
            quantity_places, weight_kg, volume_m3, dimensions, declared_value,
            temperature_requirements, total_price, payment_method
        } = orderData;

        const result = await getDb().run(
            `INSERT INTO ${ORDERS_TABLE} 
             (user_id, calculation_id, order_number, customer_full_name, customer_phone,
              pickup_address_id, delivery_address_id, cargo_description, cargo_type_id,
              quantity_places, weight_kg, volume_m3, dimensions, declared_value,
              temperature_requirements, total_price, payment_method)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            user_id, calculation_id, order_number, customer_full_name, customer_phone,
            pickup_address_id, delivery_address_id, cargo_description, cargo_type_id,
            quantity_places, weight_kg, volume_m3, JSON.stringify(dimensions), declared_value,
            temperature_requirements, total_price, payment_method
        );

        await getDb().run(
            `INSERT INTO order_status_history (order_id, old_status, new_status, changed_by_user_id, notes)
             VALUES (?, NULL, 'pending', ?, 'Заказ создан')`,
            result.lastID, user_id
        );

        return result.lastID;
    },

    getUserOrders: async (userId) => {
        return await getDb().all(`
            SELECT o.*, ct.name as cargo_type_name, 
                   pa.full_address as pickup_address, da.full_address as delivery_address,
                   osh.new_status as current_status, osh.changed_at as status_changed_at
            FROM ${ORDERS_TABLE} o
            LEFT JOIN ${CARGO_TYPES_TABLE} ct ON o.cargo_type_id = ct.type_id
            LEFT JOIN ${ADDRESSES_TABLE} pa ON o.pickup_address_id = pa.address_id
            LEFT JOIN ${ADDRESSES_TABLE} da ON o.delivery_address_id = da.address_id
            LEFT JOIN (
                SELECT osh1.* FROM order_status_history osh1
                INNER JOIN (
                    SELECT order_id, MAX(changed_at) as max_changed_at
                    FROM order_status_history
                    GROUP BY order_id
                ) osh2 ON osh1.order_id = osh2.order_id AND osh1.changed_at = osh2.max_changed_at
            ) osh ON o.order_id = osh.order_id
            WHERE o.user_id = ?
            ORDER BY o.created_at DESC
        `, userId);
    },

    getOrderById: async (orderId) => {
        return await getDb().get(`
            SELECT o.*, ct.name as cargo_type_name, 
                   pa.full_address as pickup_address, pa.contact_person as pickup_contact,
                   pa.contact_phone as pickup_phone, pa.city as pickup_city,
                   da.full_address as delivery_address, da.contact_person as delivery_contact,
                   da.contact_phone as delivery_phone, da.city as delivery_city
            FROM ${ORDERS_TABLE} o
            LEFT JOIN ${CARGO_TYPES_TABLE} ct ON o.cargo_type_id = ct.type_id
            LEFT JOIN ${ADDRESSES_TABLE} pa ON o.pickup_address_id = pa.address_id
            LEFT JOIN ${ADDRESSES_TABLE} da ON o.delivery_address_id = da.address_id
            WHERE o.order_id = ?
        `, orderId);
    },

    getAllOrders: async () => {
        return await getDb().all(`
            SELECT o.*, u.login as user_login, ct.name as cargo_type_name,
                   pa.full_address as pickup_address, da.full_address as delivery_address,
                   osh.new_status as current_status
            FROM ${ORDERS_TABLE} o
            LEFT JOIN users u ON o.user_id = u.id
            LEFT JOIN ${CARGO_TYPES_TABLE} ct ON o.cargo_type_id = ct.type_id
            LEFT JOIN ${ADDRESSES_TABLE} pa ON o.pickup_address_id = pa.address_id
            LEFT JOIN ${ADDRESSES_TABLE} da ON o.delivery_address_id = da.address_id
            LEFT JOIN (
                SELECT osh1.* FROM order_status_history osh1
                INNER JOIN (
                    SELECT order_id, MAX(changed_at) as max_changed_at
                    FROM order_status_history
                    GROUP BY order_id
                ) osh2 ON osh1.order_id = osh2.order_id AND osh1.changed_at = osh2.max_changed_at
            ) osh ON o.order_id = osh.order_id
            ORDER BY o.created_at DESC
        `);
    },

    updateOrderStatus: async (orderId, newStatus, changedByUserId, notes = '') => {
        const currentStatus = await getDb().get(
            `SELECT new_status FROM order_status_history 
             WHERE order_id = ? ORDER BY changed_at DESC LIMIT 1`,
            orderId
        );

        await getDb().run(
            `UPDATE ${ORDERS_TABLE} SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE order_id = ?`,
            newStatus, orderId
        );

        await getDb().run(
            `INSERT INTO order_status_history (order_id, old_status, new_status, changed_by_user_id, notes)
             VALUES (?, ?, ?, ?, ?)`,
            orderId, currentStatus ? currentStatus.new_status : null, newStatus, changedByUserId, notes
        );
    }
};