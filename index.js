// index.js (en la RAÍZ del proyecto)
import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import studentsRoutes from './Routes/studentsRoutes.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Log de inicio
console.log('='.repeat(50));
console.log('🚀 INICIANDO BACKEND EN RAILWAY');
console.log('='.repeat(50));

// Mostrar variables de entorno (sin credenciales)
console.log('📋 CONFIGURACIÓN:');
console.log('   PORT:', process.env.PORT);
console.log('   NODE_ENV:', process.env.NODE_ENV || 'development');
console.log('   MONGODB_URL:', process.env.MONGODB_URL ? '✅ Definida' : '❌ No definida');

if (process.env.MONGODB_URL) {
  const safeURL = process.env.MONGODB_URL.replace(/\/\/(.*):(.*)@/, '//***:***@');
  console.log('   MongoDB Safe URL:', safeURL);
}

// Conectar a MongoDB
async function connectDB() {
  try {
    if (!process.env.MONGODB_URL) {
      throw new Error('MONGODB_URL no está definida en las variables');
    }

    console.log('🔌 Conectando a MongoDB...');
    
    await mongoose.connect(process.env.MONGODB_URL, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    
    console.log('✅ MongoDB conectado exitosamente!');
    console.log(`   Base de datos: ${mongoose.connection.name}`);
    console.log(`   Host: ${mongoose.connection.host}`);

    // Manejar reconexiones
    mongoose.connection.on('error', (err) => {
      console.error('❌ Error de MongoDB:', err.message);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('⚠️  MongoDB desconectado. Reconectando en 5s...');
      setTimeout(connectDB, 5000);
    });

  } catch (error) {
    console.error('❌ Error al conectar a MongoDB:', error.message);
    console.log('🔄 Reintentando en 5 segundos...');
    setTimeout(connectDB, 5000);
  }
}

// Iniciar conexión
connectDB();

// Middleware para verificar conexión a DB
const checkDB = (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      success: false,
      error: 'Service Temporarily Unavailable',
      message: 'La base de datos no está disponible. Por favor, intente más tarde.',
      databaseState: mongoose.connection.readyState
    });
  }
  next();
};

// Usar rutas con verificación de DB
app.use('/api/students', checkDB, studentsRoutes);

// Ruta de health check (CRÍTICA para Railway)
app.get('/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState;
  const isHealthy = dbStatus === 1;
  
  const response = {
    status: isHealthy ? 'healthy' : 'unhealthy',
    database: isHealthy ? 'connected' : 'disconnected',
    databaseCode: dbStatus,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    service: 'students-api'
  };

  res.status(isHealthy ? 200 : 503).json(response);
});

// Ruta principal
app.get('/', (req, res) => {
  const dbStatus = mongoose.connection.readyState;
  const statusText = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  }[dbStatus] || 'unknown';

  res.json({
    success: true,
    service: 'Students API',
    status: 'online',
    database: statusText,
    version: '1.0.0',
    endpoints: {
      students: '/api/students',
      health: '/health'
    },
    documentation: 'API para gestión de estudiantes'
  });
});

// Ruta de debug/info
app.get('/info', (req, res) => {
  res.json({
    nodeVersion: process.version,
    environment: process.env.NODE_ENV || 'development',
    port: process.env.PORT,
    database: {
      state: mongoose.connection.readyState,
      name: mongoose.connection.name,
      host: mongoose.connection.host,
      ready: mongoose.connection.readyState === 1
    }
  });
});

// Manejo de rutas no encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint Not Found',
    message: `La ruta ${req.method} ${req.originalUrl} no existe`,
    availableRoutes: [
      { method: 'GET', path: '/', description: 'Información del API' },
      { method: 'GET', path: '/health', description: 'Health check' },
      { method: 'GET', path: '/info', description: 'Información técnica' },
      { method: 'ALL', path: '/api/students', description: 'API de estudiantes' }
    ]
  });
});

// Error handler global
app.use((err, req, res, next) => {
  console.error('💥 ERROR NO MANEJADO:', err.stack || err);
  
  res.status(500).json({
    success: false,
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' 
      ? 'Ocurrió un error interno en el servidor' 
      : err.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log('='.repeat(50));
  console.log(`✅ SERVIDOR INICIADO CORRECTAMENTE`);
  console.log(`   URL: http://${HOST}:${PORT}`);
  console.log(`   Health: http://${HOST}:${PORT}/health`);
  console.log(`   Info: http://${HOST}:${PORT}/info`);
  console.log(`   Estudiantes: http://${HOST}:${PORT}/api/students`);
  console.log('='.repeat(50));
});