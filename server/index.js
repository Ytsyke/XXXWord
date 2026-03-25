const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const connectDB = require('./db');
const Document = require('./models/Document');

const app = express();
app.use(cors({
    origin: ["https://ytsyke.github.io", "http://localhost:3000"],
    credentials: true
}));
app.use(express.json());

connectDB();
app.use('/api/auth', require('./auth'));

// Эндпоинт для получения всех документов
app.get('/api/auth/documents', async (req, res) => {
    const docs = await Document.find({}, '_id');
    res.json(docs);
});

const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "https://ytsyke.github.io", methods: ["GET", "POST"] }
});

io.on('connection', (socket) => {
    socket.on('join-document', async (docId) => {
        socket.join(docId);
        try {
            let document = await Document.findById(docId);
            if (!document) {
                document = await Document.create({ _id: docId, data: "" });
            }
            socket.emit('load-document', document.data);
        } catch (err) { console.error(err); }
    });

    socket.on('edit-content', async ({ docId, html }) => {
        socket.to(docId).emit('update-content', html);
        try {
            await Document.findByIdAndUpdate(docId, { data: html });
        } catch (err) { console.error(err); }
    });

    socket.on('disconnect', () => console.log('Disconnected'));
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));