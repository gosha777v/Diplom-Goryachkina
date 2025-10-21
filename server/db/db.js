const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

let db;

const initDb = async () => {
    if (!db) {
        db = await open({
            filename: 'database.db',
            driver: sqlite3.Database
        });
    }

    await db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            login TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'client',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

    await db.exec(`
        CREATE TABLE IF NOT EXISTS user_profiles (
            profile_id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            full_name TEXT,
            company_name TEXT,
            phone TEXT,
            company_legal_address TEXT,
            company_tax_id TEXT,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )`);

    await db.exec(`
        CREATE TABLE IF NOT EXISTS tokens (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            userId INTEGER NOT NULL,
            token TEXT NOT NULL,
            FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
        )`);

    await db.exec(`
        CREATE TABLE IF NOT EXISTS cargo_types (
            type_id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            base_price_per_kg DECIMAL(10,2),
            base_price_per_m3 DECIMAL(10,2),
            requires_temperature BOOLEAN DEFAULT FALSE,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

    await db.exec(`
        CREATE TABLE IF NOT EXISTS city_prices (
            city_id INTEGER PRIMARY KEY AUTOINCREMENT,
            city_name TEXT NOT NULL UNIQUE,
            price_multiplier DECIMAL(3,2) DEFAULT 1.00,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

    await db.exec(`
        CREATE TABLE IF NOT EXISTS addresses (
            address_id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            full_address TEXT NOT NULL,
            address_type TEXT NOT NULL,
            city TEXT NOT NULL,
            contact_person TEXT NOT NULL,
            contact_phone TEXT NOT NULL,
            is_default BOOLEAN DEFAULT FALSE,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )`);

    await db.exec(`
        CREATE TABLE IF NOT EXISTS calculation_requests (
            calculation_id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            cargo_type_id INTEGER NOT NULL,
            weight_kg DECIMAL(10,2),
            volume_m3 DECIMAL(10,2),
            city_to TEXT NOT NULL,
            calculated_price DECIMAL(10,2),
            calculation_formula TEXT,
            calculated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (cargo_type_id) REFERENCES cargo_types(type_id)
        )`);

    await db.exec(`
        CREATE TABLE IF NOT EXISTS orders (
            order_id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            calculation_id INTEGER,
            order_number TEXT UNIQUE NOT NULL,
            status TEXT NOT NULL DEFAULT 'pending',
            customer_full_name TEXT NOT NULL,
            customer_phone TEXT NOT NULL,
            pickup_address_id INTEGER NOT NULL,
            delivery_address_id INTEGER NOT NULL,
            cargo_description TEXT NOT NULL,
            cargo_type_id INTEGER NOT NULL,
            quantity_places INTEGER,
            weight_kg DECIMAL(10,2),
            volume_m3 DECIMAL(10,2),
            dimensions TEXT,
            declared_value DECIMAL(10,2),
            temperature_requirements TEXT,
            total_price DECIMAL(10,2),
            payment_method TEXT,
            assigned_delivery_time DATETIME,
            assigned_location TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (calculation_id) REFERENCES calculation_requests(calculation_id),
            FOREIGN KEY (pickup_address_id) REFERENCES addresses(address_id),
            FOREIGN KEY (delivery_address_id) REFERENCES addresses(address_id),
            FOREIGN KEY (cargo_type_id) REFERENCES cargo_types(type_id)
        )`);

    await db.exec(`
        CREATE TABLE IF NOT EXISTS order_status_history (
            history_id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_id INTEGER NOT NULL,
            old_status TEXT,
            new_status TEXT NOT NULL,
            changed_by_user_id INTEGER NOT NULL,
            changed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            notes TEXT,
            FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
            FOREIGN KEY (changed_by_user_id) REFERENCES users(id)
        )`);

    await initBasicData();
    console.log('✅ База данных инициализирована');
};

const initBasicData = async () => {
    const cargoTypes = [
        { name: 'Молочная продукция', description: 'Молоко, сыры, йогурты, творог', base_price_per_kg: 36.00, base_price_per_m3: 1200.00, requires_temperature: true },
        { name: 'Колбасные изделия', description: 'Колбасы, сосиски, сардельки', base_price_per_kg: 38.00, base_price_per_m3: 1250.00, requires_temperature: true },
        { name: 'Овощи/Фрукты', description: 'Свежие овощи и фрукты', base_price_per_kg: 32.00, base_price_per_m3: 1100.00, requires_temperature: true },
        { name: 'Бакалея', description: 'Крупы, макароны, консервы', base_price_per_kg: 30.00, base_price_per_m3: 1000.00, requires_temperature: false },
        { name: 'Напитки', description: 'Соки, воды, газированные напитки', base_price_per_kg: 28.00, base_price_per_m3: 950.00, requires_temperature: false },
        { name: 'Замороженные продукты', description: 'Замороженные овощи, мясо, рыба', base_price_per_kg: 42.00, base_price_per_m3: 1400.00, requires_temperature: true }
    ];

    for (const type of cargoTypes) {
        await db.run(`
            INSERT OR IGNORE INTO cargo_types (name, description, base_price_per_kg, base_price_per_m3, requires_temperature)
            VALUES (?, ?, ?, ?, ?)
        `, [type.name, type.description, type.base_price_per_kg, type.base_price_per_m3, type.requires_temperature]);
    }

    const cities = [
        { name: 'Москва', multiplier: 1.0 },
        { name: 'Санкт-Петербург', multiplier: 1.1 },
        { name: 'Новосибирск', multiplier: 1.3 },
        { name: 'Екатеринбург', multiplier: 1.2 },
        { name: 'Казань', multiplier: 1.1 },
        { name: 'Нижний Новгород', multiplier: 1.15 },
        { name: 'Ростов-на-Дону', multiplier: 1.25 },
        { name: 'Краснодар', multiplier: 1.2 }
    ];

    for (const city of cities) {
        await db.run(`
            INSERT OR IGNORE INTO city_prices (city_name, price_multiplier)
            VALUES (?, ?)
        `, [city.name, city.multiplier]);
    }

    const md5 = require('md5');
    await db.run(`
        INSERT OR IGNORE INTO users (login, password, role) 
        VALUES (?, ?, ?)
    `, ['admin', md5('admin123'), 'admin']);

    const adminUser = await db.get(`SELECT id FROM users WHERE login = 'admin'`);
    if (adminUser) {
        await db.run(`
            INSERT OR IGNORE INTO user_profiles (user_id, full_name, company_name) 
            VALUES (?, ?, ?)
        `, [adminUser.id, 'Администратор Системы', 'ООО Авианорд']);
    }
};

const getDb = () => {
    if (!db) {
        throw new Error('База данных не инициализирована. Сначала вызовите initDb()');
    }
    return db;
};

module.exports = {
    initDb,
    getDb
};