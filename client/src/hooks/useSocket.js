import { io } from 'socket.io-client';
import { useEffect, useMemo } from 'react';

export const useSocket = (token) => {
  const socket = useMemo(() => io('https://xxxword.onrender.com', {
    auth: { token }
  }), [token]);

  useEffect(() => {
    return () => socket.disconnect();
  }, [socket]);

  return socket;
};