const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('./models/User');

const JWT_SECRET = 'your_super_secret_key_123'; // В реальном проекте это хранят в .env

// РЕГИСТРАЦИЯ
router.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Проверяем, есть ли такой юзер
        let user = await User.findOne({ username });
        if (user) return res.status(400).json({ msg: 'Пользователь уже существует' });

        // Шифруем пароль
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        user = new User({ username, password: hashedPassword });
        await user.save();

        res.json({ msg: 'Регистрация успешна' });
    } catch (err) {
        res.status(500).send('Ошибка сервера');
    }
});

// ВХОД
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        const user = await User.findOne({ username });
        if (!user) return res.status(400).json({ msg: 'Неверные данные' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ msg: 'Неверные данные' });

        // Создаем токен, чтобы клиент "залогинился"
        const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '1h' });
        res.json({ token, user: { id: user._id, username: user.username } });
    } catch (err) {
        res.status(500).send('Ошибка сервера');
    }
});

module.exports = router;