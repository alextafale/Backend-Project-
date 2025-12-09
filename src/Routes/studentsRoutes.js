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

router.get('/:id', getStudent, (req, res) => {
  res.json(req.student);
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

router.put('/update/:id', getStudent , async (req,res)=> {
  console.log("Entró al PUT /update");
  try{
    const student = req.student;
    student.name= req.body.name || student.name;
    student.age= req.body.age || student.age;
    student.email= req.body.email || student.email;
    student.phone = req.body.phone || student.phone;
    student.address = req.body.address || student.address;
    const updatedStudent = await student.save();
    res.json(updatedStudent);

  } catch(error){
    res.status(400).json({
      message: error.message
    })

  }
});

router.patch('/upload/:id', getStudent, async (req, res) => {
  if (!req.body.name && !req.body.age && !req.body.email && !req.body.phone && !req.body.address) {
    return res.status(400).json({
      message: 'At least one field must be provided for update'
    });
  }
  
  try {
    const student = req.student;
    student.name = req.body.name || student.name;
    student.age = req.body.age || student.age;
    student.email = req.body.email || student.email;
    student.phone = req.body.phone || student.phone;
    student.address = req.body.address || student.address;
    
    const updatedStudent = await student.save();
    res.json(updatedStudent);
  } catch (error) {
    console.error('PATCH /students/upload/:id error:', error);
    res.status(400).json({
      message: error.message
    });
  }
});

router.delete('/drop/user/:id', getStudent, async (req, res) => {
  try {
    await req.student.deleteOne(); 
    res.json({ message: 'Student deleted' });
  } catch (error) {
    console.error('DELETE /students/:id error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});



export default router;
