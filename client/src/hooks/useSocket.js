import { io } from 'socket.io-client';

// Подключаемся к нашему серверу (порт 3001, который мы указали в server/index.js)
const socket = io('https://xxxword.onrender.com');

export const useSocket = () => {
  return socket;
};