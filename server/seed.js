const { initDb, getDb } = require('./db/db');
const md5 = require('md5');

async function seedDatabase() {
    try {
        await initDb();
        const db = getDb();

        // Тестовые пользователи (клиенты)
        const testUsers = [
            { login: 'company1', password: 'company123', role: 'client', full_name: 'Иван Петров', company_name: 'ООО Ромашка' },
            { login: 'company2', password: 'company123', role: 'client', full_name: 'Мария Сидорова', company_name: 'ИП Сидорова' },
            { login: 'aviacompany', password: 'aviao123', role: 'client', full_name: 'Алексей Крылов', company_name: 'ООО Авиагруз' }
        ];

        for (const user of testUsers) {
            // Проверяем, существует ли пользователь
            const existingUser = await db.get(`SELECT id FROM users WHERE login = ?`, user.login);
            
            if (!existingUser) {
                const result = await db.run(
                    `INSERT INTO users (login, password, role) VALUES (?, ?, ?)`,
                    user.login, md5(user.password), user.role
                );
                
                await db.run(
                    `INSERT INTO user_profiles (user_id, full_name, company_name) VALUES (?, ?, ?)`,
                    result.lastID, user.full_name, user.company_name
                );
                
                console.log(`✅ Создан пользователь: ${user.login}`);
            } else {
                console.log(`ℹ️ Пользователь ${user.login} уже существует`);
            }
        }

        console.log('\n🎉 Тестовые данные успешно добавлены!');
        console.log('\n👤 Доступные пользователи:');
        console.log('   Админ:      login=admin, password=admin123');
        console.log('   Клиент 1:   login=company1, password=company123');
        console.log('   Клиент 2:   login=company2, password=company123');
        console.log('   Клиент 3:   login=aviacompany, password=aviao123');
        console.log('\n🚀 Сервер готов к работе!');

    } catch (error) {
        console.error('❌ Ошибка при добавлении тестовых данных:', error);
    }
}

if (require.main === module) {
    seedDatabase();
}

module.exports = seedDatabase;