const { nanoid } = require("nanoid");
const {getDb} = require("./db");

const TABLE_NAME = "tokens";

module.exports = {
    TABLE_NAME,
    getUserIdByToken: async (token) => {
        const result = await getDb().get(`SELECT * FROM ${TABLE_NAME} WHERE token = ?`, token);
        return result?.userId;
    },
    deleteByToken: async (token) => {
        await getDb().get(`DELETE FROM ${TABLE_NAME} WHERE token = ?`, token);
    },
    addToken: async (userId) => {
        const token = nanoid();
        const tokenRow = await getDb().get(`SELECT * FROM ${TABLE_NAME} WHERE userId = ?`, userId)
        if (tokenRow) {
            await getDb().run(
                `UPDATE ${TABLE_NAME} SET token = ? WHERE userId = ?`,
                token, userId
            );
        } else {
            await getDb().run(
                `INSERT INTO ${TABLE_NAME} (token, userId) VALUES (?, ?)`,
                token, userId
            );
        }
        return token;
    },
};