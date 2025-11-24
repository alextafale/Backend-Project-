import express from 'express';
import Student from '../Models/studentModel.js';
import mongoose from 'mongoose';
const router = express.Router();

// Middleware para validar ID y cargar estudiante
const getStudent = async (req, res, next) => {
  const id = req.params.id;
  if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(400).json({ error: 'Invalid or missing ID format' });
  }
  try {
    const student = await Student.findById(id);
    if (!student) return res.status(404).json({ error: 'Student not found' });
    req.student = student;
    next();
  } catch (error) {
    console.error('getStudent error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

router.get('/', async (req, res) => {
  try {
    const students = await Student.find();
    if (students.length === 0) return res.status(204).json([]);
    res.json(students);
  } catch (error) {
    console.error('GET /students error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post('/new', async (req, res) => {
  const { name, age, email, phone, address } = req.body;
  if (!name || !age || !email || !phone || !address) {
    return res.status(422).json({ error: 'Please fill all the fields' });
  }
  try {
    const student = new Student({ name, age, email, phone, address });
    const newStudent = await student.save();

    //Logs antes de responder
    console.log('Entró a POST /students/new');
    console.log('Base actual:', mongoose.connection.name);
    console.log('Colección usada:', Student.collection.name);
    console.log('Estudiante insertado:', newStudent);

    res.status(201).json(newStudent);
  } catch (error) {
    console.error('POST /students/new error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/:id', getStudent, (req, res) => {
  res.json(req.student);
});

router.delete('/:id', getStudent, async (req, res) => {
  try {
    await req.student.remove();
    res.json({ message: 'Student deleted' });
  } catch (error) {
    console.error('DELETE /students/:id error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
