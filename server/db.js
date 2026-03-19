const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        await mongoose.connect('mongodb+srv://admin:1234@cluster0.tmnwfee.mongodb.net/?appName=Cluster0');
        console.log('MongoDB подключена успешно!');
    } catch (err) {
        console.error('Ошибка подключения к MongoDB:', err.message);
        process.exit(1);
    }
};

module.exports = connectDB;