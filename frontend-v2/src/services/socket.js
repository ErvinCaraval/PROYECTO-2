let socket = null;

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || 'http://localhost:5000';

export async function getSocket() {
  if (socket) return socket;
  const { io } = await import('socket.io-client');
  
  // Configuración optimizada para dispositivos móviles
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  socket = io(SOCKET_URL, { 
    autoConnect: false,
    // Configuración optimizada para dispositivos móviles
    transports: isMobile ? ['polling', 'websocket'] : ['websocket', 'polling'],
    timeout: isMobile ? 15000 : (import.meta.env.VITE_SOCKET_TIMEOUT || 8000),
    forceNew: true, // Forzar nueva conexión
    reconnection: true,
    reconnectionAttempts: isMobile ? 8 : 5,
    reconnectionDelay: isMobile ? 3000 : 1000,
    reconnectionDelayMax: isMobile ? 15000 : 8000,
    maxReconnectionAttempts: isMobile ? 8 : 5,
    // Configuraciones adicionales para móviles
    upgrade: true,
    rememberUpgrade: false,
    // Mejorar estabilidad en redes móviles
    pingTimeout: isMobile ? 60000 : 20000,
    pingInterval: isMobile ? 25000 : 10000
  });
  
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    try { socket.disconnect(); } catch (e) { /* noop */ }
    socket = null;
  }
}
