const express = require('express');
const md5 = require('md5');
const authRouter = express.Router();
const {getUserByLogin, USER_ROLES} = require("../db/users");
const {addToken, getUserIdByToken, deleteByToken} = require("../db/tokens");

const COOKIE_NAME = "token";

authRouter.post("/", async (req, res) => {
    const user = await getUserByLogin(req.body.login);

    if (!user) {
        return res.status(404).json({
            message: "Такой пользователь не найден"
        });
    }

    if (user.password !== md5(req.body.password)) {
        return res.status(400).json({
            message: "Пароль неверный"
        });
    }

    const token = await addToken(user.id);
    res.cookie(COOKIE_NAME, token, {
        maxAge: 24 * 60 * 60 * 1000,
        httpOnly: true,
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        secure: process.env.NODE_ENV === 'production'
    });

    const { password, ...userWithoutPassword } = user;
    res.status(200).json({
        ok: true,
        user: userWithoutPassword
    });
});

authRouter.post("/register", async (req, res) => {
    const { login, password, role = USER_ROLES.CLIENT, profileData = {} } = req.body;

    const existingUser = await getUserByLogin(login);
    if (existingUser) {
        return res.status(400).json({
            message: "Пользователь с таким логином уже существует"
        });
    }

    if (role === USER_ROLES.ADMIN) {
        const authToken = req.cookies.token;
        const adminUserId = await getUserIdByToken(authToken);
        if (!adminUserId) {
            return res.status(403).json({
                message: "Недостаточно прав для создания администратора"
            });
        }
    }

    try {
        const { addUser } = require("../db/users");
        const newUser = await addUser(login, password, role, profileData);
        
        const { password: _, ...userWithoutPassword } = newUser;
        res.status(201).json({
            message: "Пользователь успешно зарегистрирован",
            user: userWithoutPassword
        });
    } catch (error) {
        res.status(500).json({
            message: "Ошибка при регистрации пользователя"
        });
    }
});

authRouter.delete("/", async (req, res) => {
    const token = req.cookies.token;
    const userId = await getUserIdByToken(token);
    if (!userId) {
        return res.status(401).json({
            message: "Пользователь не авторизован"
        });
    }

    await deleteByToken(token);

    res.clearCookie(COOKIE_NAME);

    res.status(200).json({ok: true});
});

authRouter.get("/check", async (req, res) => {
    const token = req.cookies.token;
    const userId = await getUserIdByToken(token);
    
    if (!userId) {
        return res.status(401).json({
            authenticated: false,
            message: "Пользователь не авторизован"
        });
    }

    const { getUserById } = require("../db/users");
    const user = await getUserById(userId);
    
    if (!user) {
        return res.status(401).json({
            authenticated: false,
            message: "Пользователь не найден"
        });
    }

    const { password, ...userWithoutPassword } = user;
    res.status(200).json({
        authenticated: true,
        user: userWithoutPassword
    });
});

module.exports = authRouter;