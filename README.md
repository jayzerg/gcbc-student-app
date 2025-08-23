# Student Masterlist with MongoDB

## Setup Instructions

1. **Install MongoDB**
   - Download and install MongoDB Community Server
   - Start MongoDB service

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Start the Server**
   ```bash
   npm start
   ```

4. **Access the Application**
   - Open browser to `http://localhost:3000`
   - The HTML file will be served automatically

## Features
- Add students with ID, name, and address
- View all students in a table
- Delete students from database
- Data persists in MongoDB

## API Endpoints
- `GET /api/students` - Get all students
- `POST /api/students` - Add new student
- `DELETE /api/students/:id` - Delete student by ID