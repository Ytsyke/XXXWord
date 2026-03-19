const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const connectDB = require('./db');
const Document = require('./models/Document');

const app = express();

// Настройки
app.use(cors());
app.use(express.json());

// Подключение БД и Роутов
connectDB();
app.use('/api/auth', require('./auth'));

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"]
    }
});

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

const PORT = 3001;
server.listen(PORT, () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
});