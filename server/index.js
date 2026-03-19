const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const connectDB = require('./db');
const Document = require('./models/Document');

const app = express();

// 1. Настройки CORS (лучше объединить в одном месте)
app.use(cors({
    origin: ["https://ytsyke.github.io", "http://localhost:3000"], // Разрешаем и гитхаб, и локалку для тестов
    methods: ["GET", "POST"],
    credentials: true
}));

app.use(express.json());

// Подключение БД и Роутов
connectDB();
app.use('/api/auth', require('./auth'));

const server = http.createServer(app);

// 2. ИНИЦИАЛИЗАЦИЯ SOCKET.IO (Этого не хватало)
const io = new Server(server, {
    cors: {
        origin: "https://ytsyke.github.io",
        methods: ["GET", "POST"]
    }
});

// Теперь переменная io определена и код ниже сработает
io.on('connection', (socket) => {
    console.log(`Пользователь подключен: ${socket.id}`);

    // 1. Вход в конкретный документ (комнату)
    socket.on('join-document', async (docId) => {
        socket.join(docId);
        console.log(`Юзер ${socket.id} вошел в документ: ${docId}`);

        try {
            let document = await Document.findById(docId);
            
            // Если документа нет в базе — создаем его
            if (!document) {
                document = await Document.create({ _id: docId, content: "" });
            }

            // Отправляем содержимое клиенту
            socket.emit('load-document', document.content);
        } catch (err) {
            console.error("Ошибка при загрузке документа:", err);
        }
    });

    // 2. Обработка изменений в реальном времени
    socket.on('edit-content', async ({ docId, content }) => {
        // Отправляем изменения всем в комнате, КРОМЕ отправителя
        socket.to(docId).emit('update-content', content);
        
        // Сохраняем в БД
        try {
            await Document.findByIdAndUpdate(docId, { content });
        } catch (err) {
            console.error("Ошибка при сохранении:", err);
        }
    });

    socket.on('disconnect', () => {
        console.log('Пользователь отключился');
    });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});