#  Node.js + MongoDB + Docker

Proyecto de aprendizaje de MongoDB con Node.js, completamente dockerizado para facilitar el desarrollo y despliegue.

##  Descripción

Este proyecto está diseñado para aprender y practicar MongoDB utilizando Node.js como backend, con una arquitectura completamente dockerizada que incluye tanto la aplicación como la base de datos MongoDB.

##  Características

-  **Docker & Docker Compose** - Entorno completamente containerizado
-  **MongoDB** - Base de datos NoSQL para almacenamiento de datos
-  **Node.js** - Runtime de JavaScript para el backend
-  **Express.js** - Framework web minimalista
-  **Arquitectura MVC** - Separación en Models y Routes
-  **Hot Reload** - Desarrollo con recarga automática
-  **REST API** - Endpoints para operaciones CRUD

##  Tecnologías

- **Node.js** 
- **Express.js**
- **MongoDB**
- **Mongoose** (ODM para MongoDB)
- **Docker & Docker Compose**

##  Prerequisitos

Antes de comenzar, asegúrate de tener instalado:

- **Docker** (versión 20.10 o superior)
- **Docker Compose** (versión 2.0 o superior)
- **Git**

> **Nota:** No necesitas tener Node.js ni MongoDB instalados localmente, Docker se encargará de todo.

 Instalación y Uso

 1. Clonar el repositorio

```bash
git clone <url-del-repositorio>
cd <nombre-del-proyecto>
```

 2. Iniciar los contenedores

```bash
docker-compose up -d
```

Este comando:
-  Construye las imágenes de Docker
-  Inicia el contenedor de MongoDB
-  Inicia el contenedor de Node.js
-  Crea la red entre los contenedores

 3. Verificar que los contenedores estén corriendo

```bash
docker-compose ps
```

 4. Acceder a la aplicación

La aplicación estará disponible en:
```
http://localhost:3000
```

MongoDB estará disponible en:
```
mongodb://localhost:27017
```

 Estructura del Proyecto

```
.
├── src/
│   ├── Models/
│   │   └── studentModel.js        # Modelo de datos de estudiantes
│   ├── Routes/
│   │   └── index.js               # Definición de rutas de la API
│   └── index.js                   # Punto de entrada de la aplicación
├── .gitignore                     # Archivos ignorados por Git
├── Dockerfile                     # Configuración de la imagen de Node.js
├── docker-compose.yml             # Orquestación de contenedores
├── init-db.js                     # Script de inicialización de BD
├── package.json                   # Dependencias del proyecto
└── package-lock.json              # Lock de versiones
```

 API Endpoints

 Estudiantes

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/students` | Obtener todos los estudiantes |
| GET | `/api/students/:id` | Obtener un estudiante por ID |
| POST | `/api/students` | Crear un nuevo estudiante |
| PUT | `/api/students/:id` | Actualizar un estudiante |
| DELETE | `/api/students/:id` | Eliminar un estudiante |

 Ejemplos de Uso

 Crear un estudiante

```bash
curl -X POST http://localhost:3000/api/students \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Juan Pérez",
    "age": 20,
    "email": "juan@example.com",
    "enrollment": "2024001"
  }'
```

**Respuesta:**

```json
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "Juan Pérez",
  "age": 20,
  "email": "juan@example.com",
  "enrollment": "2024001",
  "createdAt": "2025-01-15T10:30:00.000Z",
  "__v": 0
}
```

 Obtener todos los estudiantes

```bash
curl http://localhost:3000/api/students
```

 Obtener un estudiante por ID

```bash
curl http://localhost:3000/api/students/507f1f77bcf86cd799439011
```

 Actualizar un estudiante

```bash
curl -X PUT http://localhost:3000/api/students/507f1f77bcf86cd799439011 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Juan Pérez Actualizado",
    "age": 21
  }'
```

 Eliminar un estudiante

```bash
curl -X DELETE http://localhost:3000/api/students/507f1f77bcf86cd799439011
```

 Ejemplos de Código

 Modelo de Estudiante (studentModel.js)

```javascript
const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  age: {
    type: Number,
    required: true,
    min: 18,
    max: 100
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  enrollment: {
    type: String,
    required: true,
    unique: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Student', studentSchema);
```

 Rutas (Routes/index.js)

```javascript
const express = require('express');
const router = express.Router();
const Student = require('../Models/studentModel');

// GET todos los estudiantes
router.get('/students', async (req, res) => {
  try {
    const students = await Student.find();
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET estudiante por ID
router.get('/students/:id', async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Estudiante no encontrado' });
    }
    res.json(student);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST crear estudiante
router.post('/students', async (req, res) => {
  const student = new Student(req.body);
  try {
    const newStudent = await student.save();
    res.status(201).json(newStudent);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PUT actualizar estudiante
router.put('/students/:id', async (req, res) => {
  try {
    const student = await Student.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!student) {
      return res.status(404).json({ message: 'Estudiante no encontrado' });
    }
    res.json(student);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE eliminar estudiante
router.delete('/students/:id', async (req, res) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Estudiante no encontrado' });
    }
    res.json({ message: 'Estudiante eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
```

 Servidor Principal (src/index.js)

```javascript
const express = require('express');
const mongoose = require('mongoose');
const routes = require('./Routes');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://mongodb:27017/students_db';

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Conexión a MongoDB
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ Conectado a MongoDB'))
.catch(err => console.error('❌ Error al conectar a MongoDB:', err));

// Rutas
app.use('/api', routes);

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({ message: '🚀 API de Estudiantes con MongoDB' });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
```

 Configuración de Docker

 Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
```

 docker-compose.yml

```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:7.0
    container_name: mongodb
    restart: always
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db
      - ./init-db.js:/docker-entrypoint-initdb.d/init-db.js:ro
    environment:
      MONGO_INITDB_DATABASE: students_db

  app:
    build: .
    container_name: nodejs_app
    restart: always
    ports:
      - "3000:3000"
    volumes:
      - .:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development
      - MONGODB_URI=mongodb://mongodb:27017/students_db
    depends_on:
      - mongodb
    command: npm run dev

volumes:
  mongodb_data:
```

 init-db.js

```javascript
// Script para inicializar la base de datos con datos de prueba
db = db.getSiblingDB('students_db');

db.students.insertMany([
  {
    name: "Juan Pérez",
    age: 20,
    email: "juan@example.com",
    enrollment: "2024001",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: "María García",
    age: 22,
    email: "maria@example.com",
    enrollment: "2024002",
    createdAt: new Date(),
    updatedAt: new Date()
  }
]);

print('✅ Base de datos inicializada con datos de prueba');
```

 Comandos Útiles de Docker

 Ver logs de los contenedores

```bash
# Ver logs de todos los servicios
docker-compose logs -f

# Ver logs solo de Node.js
docker-compose logs -f app

# Ver logs solo de MongoDB
docker-compose logs -f mongodb
```

 Detener los contenedores

```bash
docker-compose down
```

 Detener y eliminar volúmenes (CUIDADO: elimina datos)

```bash
docker-compose down -v
```

 Reconstruir los contenedores

```bash
docker-compose up -d --build
```

 Acceder al contenedor de Node.js

```bash
docker exec -it nodejs_app sh
```

 Acceder al contenedor de MongoDB

```bash
docker exec -it mongodb mongosh
```

 Ver los contenedores activos

```bash
docker ps
```

 Comandos de MongoDB

 Conectarse a MongoDB desde la terminal

```bash
docker exec -it mongodb mongosh
```

 Comandos útiles dentro de MongoDB

```javascript
// Usar la base de datos
use students_db

// Ver todas las colecciones
show collections

// Ver todos los estudiantes
db.students.find().pretty()

// Contar documentos
db.students.countDocuments()

// Buscar un estudiante específico
db.students.findOne({ email: "juan@example.com" })

// Eliminar todos los documentos
db.students.deleteMany({})

// Eliminar la base de datos
db.dropDatabase()
```

 Scripts disponibles en package.json

```json
{
  "scripts": {
    "start": "node src/index.js",
    "dev": "nodemon src/index.js"
  }
}
```

 Ejecutar scripts

```bash
# Modo producción
npm start

# Modo desarrollo (con nodemon)
npm run dev
```
 Troubleshooting

 Error: Puerto 3000 ya en uso

Cambiar el puerto en `docker-compose.yml`:

```yaml
ports:
  - "3001:3000"
```

 Error: MongoDB no está disponible

Esperar unos segundos después de `docker-compose up` para que MongoDB se inicie completamente.

 Error: Cannot find module

```bash
# Reconstruir los contenedores
docker-compose down
docker-compose up -d --build
```

 Ver errores en tiempo real

```bash
docker-compose logs -f app
```

 Limpiar volúmenes de Docker

```bash
docker-compose down -v
docker volume prune
```

 Recursos de Aprendizaje

- [MongoDB Documentation](https://docs.mongodb.com/)
- [Mongoose Documentation](https://mongoosejs.com/docs/)
- [Express.js Guide](https://expressjs.com/es/)
- [Docker Documentation](https://docs.docker.com/)
- [Node.js Documentation](https://nodejs.org/docs/)

 Objetivos de Aprendizaje

Con este proyecto aprenderás:

-  Fundamentos de MongoDB y bases de datos NoSQL
-  Creación de modelos con Mongoose
-  Operaciones CRUD con MongoDB
-  Dockerización de aplicaciones Node.js
-  Uso de Docker Compose para múltiples servicios
-  Creación de APIs REST con Express
-  Manejo de rutas y controladores
-  Persistencia de datos con volúmenes de Docker

 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/NuevaCaracteristica`)
3. Commit tus cambios (`git commit -m 'Add: nueva característica'`)
4. Push a la rama (`git push origin feature/NuevaCaracteristica`)
5. Abre un Pull Request

 Información Académica

**Proyecto de aprendizaje:** MongoDB con Node.js y Docker  
**Objetivo:** Comprender bases de datos NoSQL y containerización

 Licencia

Este proyecto es de uso educativo y de aprendizaje.

---

⭐ Proyecto de aprendizaje - MongoDB + Node.js + Docker
