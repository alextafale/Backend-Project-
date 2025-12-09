import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import studentsRoutes from './Routes/studentsRoutes.js';

dotenv.config();

const app = express();
app.use(express.json());

// Middleware para CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Función para conectar con reintentos
async function connectDB() {
  try {
    // En Railway, las bases de datos internas usan MONGODB_URL o MONGO_URL
    // La variable que viste es la interna: mongodb.railway.internal
    const uri = process.env.MONGODB_URL || process.env.MONGO_URL || process.env.MONGODB_URI;
    
    if (!uri) {
      console.error('❌ ERROR: No se encontró variable de conexión a MongoDB');
      console.log('🔍 Variables de entorno disponibles:');
      Object.keys(process.env).forEach(key => {
        if (key.includes('MONGO') || key.includes('URL') || key.includes('URI')) {
          console.log(`  ${key}: ${process.env[key]}`);
        }
      });
      throw new Error('No se configuró la conexión a MongoDB');
    }

    console.log('🔌 Conectando a MongoDB...');
    console.log('📡 URI (oculta):', uri.replace(/\/\/(.*):(.*)@/, '//***:***@'));
    
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    await mongoose.connect(uri, options);
    console.log('✅ MongoDB conectado exitosamente');
    
    // Eventos de conexión
    mongoose.connection.on('error', (err) => {
      console.error('❌ Error de MongoDB:', err.message);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('⚠️  MongoDB desconectado. Reconectando...');
      setTimeout(connectDB, 5000);
    });

  } catch (error) {
    console.error('❌ Error crítico conectando a MongoDB:');
    console.error('   Mensaje:', error.message);
    console.error('   Stack:', error.stack);
    
    // Reintentar después de 5 segundos
    console.log('🔄 Reintentando conexión en 5 segundos...');
    setTimeout(connectDB, 5000);
  }
}

// Iniciar conexión
connectDB();

// Middleware para verificar conexión a DB
app.use((req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      error: 'Database not connected',
      message: 'El servicio está temporalmente no disponible',
      databaseStatus: mongoose.connection.readyState
    });
  }
  next();
});

// Rutas de la API
app.use('/api/students', studentsRoutes);

// Ruta raíz
app.get('/', (req, res) => {
  const dbStatus = mongoose.connection.readyState;
  const statusMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };
  
  res.json({
    service: 'Students API',
    status: 'online',
    database: statusMap[dbStatus] || 'unknown',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    endpoints: {
      students: '/api/students',
      health: '/health'
    }
  });
});

// Ruta de health check (CRÍTICA para Railway)
app.get('/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState;
  const isHealthy = dbStatus === 1;
  
  const response = {
    status: isHealthy ? 'healthy' : 'unhealthy',
    database: isHealthy ? 'connected' : 'disconnected',
    databaseCode: dbStatus,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    service: 'backend-project'
  };

  res.status(isHealthy ? 200 : 503).json(response);
});

// Ruta para debug (muestra variables sin exponer credenciales)
app.get('/debug', (req, res) => {
  const envVars = {};
  Object.keys(process.env).forEach(key => {
    if (key.includes('MONGO') || key.includes('URL') || key.includes('URI') || key.includes('PORT')) {
      if (key.includes('PASS') || key.includes('SECRET') || key.includes('KEY')) {
        envVars[key] = '***HIDDEN***';
      } else if (key.includes('URL') || key.includes('URI')) {
        envVars[key] = process.env[key].replace(/\/\/(.*):(.*)@/, '//***:***@');
      } else {
        envVars[key] = process.env[key];
      }
    }
  });
  
  res.json({
    environment: envVars,
    database: {
      state: mongoose.connection.readyState,
      host: mongoose.connection.host || 'N/A',
      name: mongoose.connection.name || 'N/A'
    },
    memory: process.memoryUsage(),
    nodeVersion: process.version
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Ruta ${req.method} ${req.path} no encontrada`,
    availableRoutes: ['/', '/health', '/debug', '/api/students']
  });
});

// Error handler global
app.use((err, req, res, next) => {
  console.error('💥 Error no manejado:', err.stack || err);
  
  res.status(err.status || 500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' ? 'Algo salió mal' : err.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

// Puerto - Railway asigna automáticamente
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0'; // Importante para Railway

app.listen(PORT, HOST, () => {
  console.log('='.repeat(50));
  console.log(`🚀 Servidor iniciado en http://${HOST}:${PORT}`);
  console.log(`📊 Health check: http://${HOST}:${PORT}/health`);
  console.log(`🐛 Debug: http://${HOST}:${PORT}/debug`);
  console.log(`⏰ Hora: ${new Date().toISOString()}`);
  console.log(`🌍 Entorno: ${process.env.NODE_ENV || 'development'}`);
  console.log('='.repeat(50));
});