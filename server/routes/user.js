const express = require('express');
const {getUserIdByToken} = require("../db/tokens");
const {getUserByLogin, addUser, getUserById, updateUserProfile, updateUserRole, getUsers, getUsersByRole, USER_ROLES, isAdmin} = require("../db/users");
const userRouter = express.Router();

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

userRouter.get("/", requireAuth, async (req, res) => {
    const { password, ...userWithoutPassword } = req.user;
    res.status(200).json(userWithoutPassword);
});

userRouter.put("/profile", requireAuth, async (req, res) => {
    try {
        await updateUserProfile(req.userId, req.body);
        const updatedUser = await getUserById(req.userId);
        const { password, ...userWithoutPassword } = updatedUser;
        
        res.status(200).json({
            message: "Профиль успешно обновлен",
            user: userWithoutPassword
        });
    } catch (error) {
        res.status(500).json({
            message: "Ошибка при обновлении профиля"
        });
    }
});


userRouter.get("/all", requireAuth, requireAdmin, async (req, res) => {
    try {
        const users = await getUsers();
        const usersWithoutPasswords = users.map(({ password, ...user }) => user);
        res.status(200).json(usersWithoutPasswords);
    } catch (error) {
        res.status(500).json({
            message: "Ошибка при получении списка пользователей"
        });
    }
});

userRouter.get("/role/:role", requireAuth, requireAdmin, async (req, res) => {
    try {
        const users = await getUsersByRole(req.params.role);
        const usersWithoutPasswords = users.map(({ password, ...user }) => user);
        res.status(200).json(usersWithoutPasswords);
    } catch (error) {
        res.status(500).json({
            message: "Ошибка при получении пользователей"
        });
    }
});

userRouter.put("/:userId/role", requireAuth, requireAdmin, async (req, res) => {
    try {
        const { role } = req.body;
        
        if (!Object.values(USER_ROLES).includes(role)) {
            return res.status(400).json({
                message: "Некорректная роль пользователя"
            });
        }

        await updateUserRole(req.params.userId, role);
        res.status(200).json({
            message: "Роль пользователя успешно обновлена"
        });
    } catch (error) {
        res.status(500).json({
            message: "Ошибка при обновлении роли пользователя"
        });
    }
});

userRouter.get("/:userId", requireAuth, requireAdmin, async (req, res) => {
    try {
        const user = await getUserById(req.params.userId);
        if (!user) {
            return res.status(404).json({
                message: "Пользователь не найден"
            });
        }
        
        const { password, ...userWithoutPassword } = user;
        res.status(200).json(userWithoutPassword);
    } catch (error) {
        res.status(500).json({
            message: "Ошибка при получении информации о пользователе"
        });
    }
});

module.exports = userRouter;