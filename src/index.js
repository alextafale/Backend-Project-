import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';

// Configurar dotenv
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Log de variables (para debug)
console.log('🚀 Iniciando servidor...');
console.log('📋 Variables de entorno:');
console.log('- PORT:', process.env.PORT);
console.log('- NODE_ENV:', process.env.NODE_ENV);
console.log('- MONGODB_URL:', process.env.MONGODB_URL ? '✅ Definida' : '❌ No definida');

// Conectar a MongoDB
async function connectDB() {
  try {
    const mongoURI = process.env.MONGODB_URL;
    
    if (!mongoURI) {
      console.error('❌ ERROR: MONGODB_URL no está definida');
      console.log('🔍 Por favor, agrega MONGODB_URL en Railway Shared Variables');
      return;
    }

    console.log('🔌 Conectando a MongoDB...');
    
    // Opciones para mongoose 8.x
    const options = {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    };

    await mongoose.connect(mongoURI, options);
    
    console.log('✅ MongoDB conectado exitosamente!');
    console.log(`📊 Base de datos: ${mongoose.connection.name}`);
    console.log(`🏠 Host: ${mongoose.connection.host}`);

    // Event listeners
    mongoose.connection.on('error', (err) => {
      console.error('❌ Error de MongoDB:', err.message);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('⚠️  MongoDB desconectado');
    });

  } catch (error) {
    console.error('❌ Error al conectar a MongoDB:', error.message);
    console.error('📌 Detalles:', error);
    
    // Reintentar después de 5 segundos
    setTimeout(connectDB, 5000);
  }
}

// Iniciar conexión
connectDB();

// Importar rutas (ajusta la ruta según tu estructura)
// Si tu archivo de rutas está en: src/routes/studentsRoutes.js
import studentsRoutes from './routes/studentsRoutes.js';

// Middleware para verificar conexión a DB
const checkDB = (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      success: false,
      error: 'Database not available',
      message: 'La base de datos no está disponible temporalmente',
      databaseState: mongoose.connection.readyState
    });
  }
  next();
};

// Usar rutas
app.use('/api/students', checkDB, studentsRoutes);

// Ruta de health check (CRÍTICA para Railway)
app.get('/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState;
  const isHealthy = dbStatus === 1;
  
  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'healthy' : 'unhealthy',
    database: isHealthy ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Ruta principal
app.get('/', (req, res) => {
  const dbStatus = mongoose.connection.readyState;
  const statusMap = {
    0: 'disconnected',
    1: 'connected', 
    2: 'connecting',
    3: 'disconnecting'
  };

  res.json({
    success: true,
    message: 'API de Estudiantes funcionando',
    status: 'online',
    database: statusMap[dbStatus] || 'unknown',
    endpoints: {
      students: '/api/students',
      health: '/health'
    },
    environment: process.env.NODE_ENV || 'development'
  });
});

// Ruta de debug
app.get('/debug', (req, res) => {
  res.json({
    nodeVersion: process.version,
    environment: process.env.NODE_ENV,
    port: process.env.PORT,
    hasMongoURL: !!process.env.MONGODB_URL,
    mongoURLPrefix: process.env.MONGODB_URL ? 
      process.env.MONGODB_URL.substring(0, 30) + '...' : 
      'not set',
    database: {
      state: mongoose.connection.readyState,
      name: mongoose.connection.name,
      host: mongoose.connection.host,
      models: Object.keys(mongoose.models)
    }
  });
});

// Manejo de 404
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    message: `La ruta ${req.originalUrl} no existe`,
    availableRoutes: ['/', '/health', '/debug', '/api/students']
  });
});

// Error handler global
app.use((err, req, res, next) => {
  console.error('💥 Error:', err.stack || err);
  
  res.status(500).json({
    success: false,
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' ? 
      'Ocurrió un error en el servidor' : 
      err.message
  });
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log('='.repeat(50));
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  console.log(`🌍 Entorno: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log('='.repeat(50));
});