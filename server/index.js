const express = require('express');
const cors = require('cors');
const cookies = require("cookie-parser");
const userRouter = require("./routes/user");
const authRouter = require("./routes/auth");
const {initDb} = require("./db/db");
const cargoRouter = require("./routes/cargo");

const app = express();

app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

;



app.use(express.json({ limit: '10mb' }));

app.use(cookies());

const allowedOrigins = process.env.ALLOWED_ORIGINS 
    ? process.env.ALLOWED_ORIGINS.split(',') 
    : ['http://localhost:3000', 'http://127.0.0.1:3000'];

app.use(
    cors({
        credentials: true,
        origin: (origin, callback) => {
            if (!origin) return callback(null, true);
            
            if (allowedOrigins.indexOf(origin) !== -1) {
                callback(null, true);
            } else {
                callback(new Error('Not allowed by CORS'));
            }
        },
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'Cookie']
    })
);
app.use("/cargo", cargoRouter);
app.get("/", (req, res) => {
    res.status(200).json({
        ok: true,
        message: "API системы управления грузоперевозками Авианорд",
        version: "1.0.0"
    });
});

app.get("/health", (req, res) => {
    res.status(200).json({
        status: "OK",
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

app.use("/auth", authRouter);
app.use("/user", userRouter);

app.use((req, res) => {
    res.status(404).json({
        error: "Маршрут не найден",
        path: req.path,
        method: req.method
    });
});

app.use((error, req, res, next) => {
    console.error('Global error handler:', error);
    
    if (error.message === 'Not allowed by CORS') {
        return res.status(403).json({
            error: "Доступ запрещен: неразрешенный домен"
        });
    }
    
    res.status(500).json({
        error: "Внутренняя ошибка сервера",
        ...(process.env.NODE_ENV === 'development' && { details: error.message })
    });
});

const port = process.env.PORT || 3001;

(async () => {
    try {
        await initDb();
        console.log('✅ База данных инициализирована');
        
        app.listen(port, () => {
            console.log(`🚀 Сервер запущен на порту ${port}!`);
            console.log(`📊 Режим: ${process.env.NODE_ENV || 'development'}`);
            console.log(`🌐 Доступен по адресу: http://localhost:${port}`);
        });
    } catch (error) {
        console.error('❌ Ошибка при запуске сервера:', error);
        process.exit(1);
    }
})();