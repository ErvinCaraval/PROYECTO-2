let socket = null;

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || 'http://localhost:5000';

export async function getSocket() {
  if (socket) return socket;
  const { io } = await import('socket.io-client');
  
  // Configuración optimizada para dispositivos móviles
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  socket = io(SOCKET_URL, { 
    autoConnect: false,
    // Configuración para mejorar conectividad en móviles
    transports: isMobile ? ['polling', 'websocket'] : ['websocket', 'polling'],
    timeout: isMobile ? 10000 : (import.meta.env.VITE_SOCKET_TIMEOUT || 8000),
    forceNew: true, // Forzar nueva conexión
    reconnection: true,
    reconnectionAttempts: isMobile ? 5 : 3,
    reconnectionDelay: isMobile ? 2000 : 1000,
    reconnectionDelayMax: isMobile ? 10000 : 5000,
    maxReconnectionAttempts: isMobile ? 5 : 3
  });
  
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    try { socket.disconnect(); } catch (e) { /* noop */ }
    socket = null;
  }
}
