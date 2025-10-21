const nanoid = require("nanoid");
const {getDb} = require("./db");
const md5 = require('md5');

const TABLE_NAME = "users";
const USER_PROFILES_TABLE = "user_profiles";

const USER_ROLES = {
    CLIENT: 'client',
    ADMIN: 'admin'
};

module.exports = {
    TABLE_NAME,
    USER_ROLES,
    
    addUser: async (login, password, role = USER_ROLES.CLIENT, profileData = {}) => {
        const newUser = {
            login,
            password: md5(password),
            role
        };
        
        const result = await getDb().run(
            `INSERT INTO ${TABLE_NAME} (login, password, role) VALUES (?, ?, ?)`,
            newUser.login, newUser.password, newUser.role
        );
        newUser.id = result.lastID;

        if (Object.keys(profileData).length > 0) {
            await getDb().run(
                `INSERT INTO ${USER_PROFILES_TABLE} (user_id, full_name, company_name, phone, company_legal_address, company_tax_id) 
                 VALUES (?, ?, ?, ?, ?, ?)`,
                newUser.id,
                profileData.full_name || '',
                profileData.company_name || '',
                profileData.phone || '',
                profileData.company_legal_address || '',
                profileData.company_tax_id || ''
            );
        }

        return newUser;
    },

    getUserByLogin: async (login) => {
        const user = await getDb().get(
            `SELECT u.*, up.* 
             FROM ${TABLE_NAME} u 
             LEFT JOIN ${USER_PROFILES_TABLE} up ON u.id = up.user_id 
             WHERE u.login = ?`,
            login
        );
        return user;
    },

    getUserById: async (id) => {
        const user = await getDb().get(
            `SELECT u.*, up.* 
             FROM ${TABLE_NAME} u 
             LEFT JOIN ${USER_PROFILES_TABLE} up ON u.id = up.user_id 
             WHERE u.id = ?`,
            id
        );
        return user;
    },

    getUsers: async () => await getDb().all(
        `SELECT u.*, up.* 
         FROM ${TABLE_NAME} u 
         LEFT JOIN ${USER_PROFILES_TABLE} up ON u.id = up.user_id 
         ORDER BY u.created_at DESC`
    ),

    updateUserProfile: async (userId, profileData) => {
        const existingProfile = await getDb().get(
            `SELECT * FROM ${USER_PROFILES_TABLE} WHERE user_id = ?`,
            userId
        );

        if (existingProfile) {
            await getDb().run(
                `UPDATE ${USER_PROFILES_TABLE} 
                 SET full_name = ?, company_name = ?, phone = ?, company_legal_address = ?, company_tax_id = ?
                 WHERE user_id = ?`,
                profileData.full_name,
                profileData.company_name,
                profileData.phone,
                profileData.company_legal_address,
                profileData.company_tax_id,
                userId
            );
        } else {
            await getDb().run(
                `INSERT INTO ${USER_PROFILES_TABLE} (user_id, full_name, company_name, phone, company_legal_address, company_tax_id) 
                 VALUES (?, ?, ?, ?, ?, ?)`,
                userId,
                profileData.full_name || '',
                profileData.company_name || '',
                profileData.phone || '',
                profileData.company_legal_address || '',
                profileData.company_tax_id || ''
            );
        }
    },

    updateUserRole: async (userId, newRole) => {
        await getDb().run(
            `UPDATE ${TABLE_NAME} SET role = ? WHERE id = ?`,
            newRole, userId
        );
    },

    getUsersByRole: async (role) => await getDb().all(
        `SELECT u.*, up.* 
         FROM ${TABLE_NAME} u 
         LEFT JOIN ${USER_PROFILES_TABLE} up ON u.id = up.user_id 
         WHERE u.role = ? 
         ORDER BY u.created_at DESC`,
        role
    ),

    isAdmin: (user) => user && user.role === USER_ROLES.ADMIN,

    isClient: (user) => user && user.role === USER_ROLES.CLIENT
};