const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const connectDB = require('./db');
const Document = require('./models/Document');
const authMiddleware = require('./middleware/auth');

const app = express();
app.use(cors({
    origin: ["https://ytsyke.github.io", "http://localhost:3000"],
    credentials: true
}));
app.use(express.json());

connectDB();
app.use('/api/auth', require('./auth'));

const JWT_SECRET = 'your_super_secret_key_123';

async function getAccessibleDocument(docId, userId, inviteToken) {
    let document = await Document.findById(docId);

    if (!document) {
        return { status: 'not_found', document: null };
    }

    const isOwner = String(document.ownerId) === String(userId);
    const isCollaborator = document.collaborators.some((id) => String(id) === String(userId));

    if (isOwner || isCollaborator) {
        return { status: 'allowed', document };
    }

    if (inviteToken) {
        const tokenIndex = document.shareTokens.findIndex((item) => item.token === inviteToken);
        if (tokenIndex >= 0) {
            document.collaborators.push(userId);
            document.shareTokens.splice(tokenIndex, 1);
            await document.save();
            return { status: 'allowed', document };
        }
    }

    return { status: 'forbidden', document: null };
}

app.get('/api/auth/documents', authMiddleware, async (req, res) => {
    const docs = await Document.find({
        $or: [{ ownerId: req.userId }, { collaborators: req.userId }]
    }, '_id ownerId');

    res.json(docs.map((doc) => ({
        _id: doc._id,
        isOwner: String(doc.ownerId) === String(req.userId)
    })));
});

app.get('/api/auth/document/:docId/access', authMiddleware, async (req, res) => {
    const { docId } = req.params;
    const inviteToken = req.query.invite;

    let document = await Document.findById(docId);
    if (!document) {
        document = await Document.create({
            _id: docId,
            data: "",
            ownerId: req.userId,
            collaborators: [],
            shareTokens: []
        });
        return res.json({ canAccess: true, isOwner: true });
    }

    const access = await getAccessibleDocument(docId, req.userId, inviteToken);
    if (access.status !== 'allowed') {
        return res.status(403).json({ msg: 'Нет доступа к документу' });
    }

    const isOwner = String(access.document.ownerId) === String(req.userId);
    return res.json({ canAccess: true, isOwner });
});

app.post('/api/auth/document/:docId/share', authMiddleware, async (req, res) => {
    const { docId } = req.params;
    const document = await Document.findById(docId);

    if (!document) {
        return res.status(404).json({ msg: 'Документ не найден' });
    }

    if (String(document.ownerId) !== String(req.userId)) {
        return res.status(403).json({ msg: 'Только владелец может делиться документом' });
    }

    const token = crypto.randomBytes(24).toString('hex');
    document.shareTokens.push({ token });
    await document.save();

    res.json({ inviteToken: token });
});

const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "https://ytsyke.github.io", methods: ["GET", "POST"] }
});

io.on('connection', (socket) => {
    const token = socket.handshake.auth?.token;
    let userId = null;

    try {
        if (token) {
            const payload = jwt.verify(token, JWT_SECRET);
            userId = payload.id;
        }
    } catch (error) {
        userId = null;
    }

    socket.on('join-document', async ({ docId, inviteToken }) => {
        if (!userId) {
            socket.emit('access-denied', 'Требуется авторизация');
            return;
        }

        try {
            let document = await Document.findById(docId);
            if (!document) {
                document = await Document.create({
                    _id: docId,
                    data: "",
                    ownerId: userId,
                    collaborators: [],
                    shareTokens: []
                });
            } else {
                const access = await getAccessibleDocument(docId, userId, inviteToken);
                if (access.status !== 'allowed') {
                    socket.emit('access-denied', 'Нет доступа к документу');
                    return;
                }
            }

            socket.join(docId);
            socket.emit('load-document', document.data);
        } catch (err) { console.error(err); }
    });

    socket.on('edit-content', async ({ docId, html }) => {
        if (!userId) return;

        socket.to(docId).emit('update-content', html);
        try {
            await Document.findOneAndUpdate({
                _id: docId,
                $or: [{ ownerId: userId }, { collaborators: userId }]
            }, { data: html });
        } catch (err) { console.error(err); }
    });

    socket.on('disconnect', () => console.log('Disconnected'));
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));