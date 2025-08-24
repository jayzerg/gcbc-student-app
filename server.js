const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/gcbc_students';
mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Student Schema
const studentSchema = new mongoose.Schema({
  studentId: { type: String, required: true, unique: true },
  lastName: { type: String, required: true },
  firstName: { type: String, required: true },
  middleName: { type: String, default: '' },
  course: { type: String, required: true },
  yearLevel: { type: String, required: true },
  address: { type: String, required: true },
  status: { type: String, enum: ['ACTIVE', 'PENDING'], default: 'PENDING' }
});

const Student = mongoose.model('Student', studentSchema);



// Serve main HTML file for root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'student-masterlist.html'));
});

// Routes
app.get('/api/students', async (req, res) => {
  try {
    const students = await Student.find();
    res.json(students);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/students', async (req, res) => {
  try {
    const student = new Student(req.body);
    await student.save();
    res.status(201).json(student);
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ error: 'Student ID already exists' });
    } else {
      res.status(400).json({ error: error.message });
    }
  }
});

app.put('/api/students/:id', async (req, res) => {
  try {
    const student = await Student.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(student);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/api/students/:id', async (req, res) => {
  try {
    await Student.findByIdAndDelete(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Catch-all handler: send back React's index.html file for any non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'student-masterlist.html'));
});



app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});