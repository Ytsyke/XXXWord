const jwt = require('jsonwebtoken');

const JWT_SECRET = 'your_super_secret_key_123';

function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
        return res.status(401).json({ msg: 'Требуется авторизация' });
    }

    try {
        const payload = jwt.verify(token, JWT_SECRET);
        req.userId = payload.id;
        next();
    } catch (error) {
        return res.status(401).json({ msg: 'Неверный токен' });
    }
}

module.exports = authMiddleware;
