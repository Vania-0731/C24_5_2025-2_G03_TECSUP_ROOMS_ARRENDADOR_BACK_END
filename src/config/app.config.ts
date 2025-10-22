export const appConfig = {
  port: process.env.APP_PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3001',
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3001',
    credentials: true,
  },
  swagger: {
    title: 'TECSUP Rooms API',
    description: 'API para la aplicación de alquiler de habitaciones para estudiantes de TECSUP',
    version: '1.0',
    path: 'api/docs',
  },
};


