const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const connectDB = require('./db');
const Document = require('./models/Document');
const User = require('./models/User');
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

const docParticipants = new Map();
const CURSOR_COLORS = ['#2b579a', '#d83b01', '#107c10', '#5c2d91', '#008272', '#c239b3'];

function colorByUserId(userId = '') {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
        hash = (hash << 5) - hash + userId.charCodeAt(i);
        hash |= 0;
    }
    return CURSOR_COLORS[Math.abs(hash) % CURSOR_COLORS.length];
}

function broadcastParticipants(ioServer, docId) {
    const participants = docParticipants.get(docId);
    const users = participants ? Array.from(participants.entries()).map(([socketId, meta]) => ({
        socketId,
        userId: meta.userId,
        username: meta.username,
        color: meta.color
    })) : [];
    ioServer.to(docId).emit('participants-update', users);
}

function removeParticipant(ioServer, docId, socketId) {
    const participants = docParticipants.get(docId);
    if (!participants) return;
    participants.delete(socketId);
    if (participants.size === 0) {
        docParticipants.delete(docId);
    }
    broadcastParticipants(ioServer, docId);
}

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
            const previousDocId = socket.data.docId;
            if (previousDocId && previousDocId !== docId) {
                socket.leave(previousDocId);
                removeParticipant(io, previousDocId, socket.id);
            }

            let document = await Document.findById(docId);
            if (!document) {
                document = await Document.create({
                    _id: docId,
                    data: "",
                    version: 0,
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
            socket.data.docId = docId;

            const user = await User.findById(userId, 'username').lean();
            const participantMeta = {
                userId: String(userId),
                username: user?.username || `User-${String(userId).slice(-4)}`,
                color: colorByUserId(String(userId))
            };
            if (!docParticipants.has(docId)) {
                docParticipants.set(docId, new Map());
            }
            docParticipants.get(docId).set(socket.id, participantMeta);

            socket.emit('load-document', {
                html: document.data,
                version: document.version || 0
            });
            broadcastParticipants(io, docId);
        } catch (err) { console.error(err); }
    });

    socket.on('edit-content', async ({ docId, html }) => {
        if (!userId) return;
        try {
            const updatedDocument = await Document.findOneAndUpdate({
                _id: docId,
                $or: [{ ownerId: userId }, { collaborators: userId }]
            }, {
                $set: { data: html },
                $inc: { version: 1 }
            }, {
                new: true
            });

            if (!updatedDocument) return;

            socket.to(docId).emit('update-content', {
                html,
                version: updatedDocument.version
            });
            socket.emit('document-version', updatedDocument.version);
        } catch (err) { console.error(err); }
    });

    socket.on('cursor-update', ({ docId, from, to }) => {
        if (!userId) return;
        const participants = docParticipants.get(docId);
        const participant = participants?.get(socket.id);
        if (!participant) return;

        socket.to(docId).emit('cursor-update', {
            socketId: socket.id,
            userId: participant.userId,
            username: participant.username,
            color: participant.color,
            from,
            to
        });
    });

    socket.on('disconnect', () => {
        if (socket.data.docId) {
            removeParticipant(io, socket.data.docId, socket.id);
        }
        console.log('Disconnected');
    });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));