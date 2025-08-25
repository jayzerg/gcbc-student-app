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

// Teacher Schema
const teacherSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  department: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const Teacher = mongoose.model('Teacher', teacherSchema);



// Serve main HTML file for root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'student-masterlist.html'));
});

// Route for dashboard (protected)
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'student-masterlist.html'));
});



// Teacher Authentication Routes
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const teacher = await Teacher.findOne({ email, password });
    
    if (teacher) {
      // Return teacher data for session
      res.json({
        success: true,
        teacher: {
          id: teacher._id,
          firstName: teacher.firstName,
          lastName: teacher.lastName,
          email: teacher.email,
          department: teacher.department
        }
      });
    } else {
      res.status(401).json({ success: false, error: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/teachers', async (req, res) => {
  try {
    const teacher = new Teacher(req.body);
    await teacher.save();
    res.status(201).json({ success: true, teacher });
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ success: false, error: 'Email already exists' });
    } else {
      res.status(400).json({ success: false, error: error.message });
    }
  }
});

app.get('/api/teachers', async (req, res) => {
  try {
    const teachers = await Teacher.find().select('-password');
    res.json(teachers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Initialize default teachers
app.post('/api/setup/default-teachers', async (req, res) => {
  try {
    // Check if teachers already exist
    const existingTeachers = await Teacher.find();
    if (existingTeachers.length > 0) {
      return res.json({ 
        success: true, 
        message: 'Default teachers already exist',
        count: existingTeachers.length 
      });
    }

    // Create default teachers
    const defaultTeachers = [
      {
        firstName: 'System',
        lastName: 'Administrator',
        email: 'admin@gcbc.edu',
        department: 'Information Technology',
        password: 'admin123'
      },
      {
        firstName: 'Demo',
        lastName: 'Teacher',
        email: 'teacher@gcbc.edu',
        department: 'Computer Science',
        password: 'teacher123'
      }
    ];

    await Teacher.insertMany(defaultTeachers);
    res.json({ 
      success: true, 
      message: 'Default teachers created successfully',
      count: defaultTeachers.length
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Student Routes
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

// Catch-all handler: serve login page for non-API routes
app.get('*', (req, res) => {
  // If it's an API route, return 404
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API route not found' });
  }
  
  // For all other routes, serve the student masterlist
  res.sendFile(path.join(__dirname, 'student-masterlist.html'));
});



app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});