import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import studentsRoutes from './Routes/studentsRoutes.js';

dotenv.config();

const app = express();
app.use(express.json());

// Función para conectar con reintentos
async function connectWithRetry(retries = 5, delay = 3000) {
  const uri = process.env.MONGO_URI || 'mongodb://mongo-db:27017/students';
  const opts = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  };

  for (let i = 0; i < retries; i++) {
    try {
      console.log("Intentando conectar a MongoDB en:", uri);
      await mongoose.connect(uri, opts);
      console.log('Conectado correctamente a MongoDB');
      return;
    } catch (err) {
      console.error(`Error de conexión a MongoDB (intento ${i + 1}/${retries}):`, err.message);
      if (i < retries - 1) {
        console.log(`Reintentando en ${delay}ms...`);
        await new Promise(r => setTimeout(r, delay));
      } else {
        throw err;
      }
    }
  }
}

// Conectar
connectWithRetry().catch(err => {
  console.error('No se pudo conectar a MongoDB después de varios intentos:', err);
  process.exit(1);
});

// Rutas
app.use('/students', studentsRoutes);

app.get('/', (req, res) => {
  res.send('Servidor funcionando correctamente');
});

// Puerto
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
