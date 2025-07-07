const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const app = express();
app.use(express.json());

const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/attendance';
mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('MongoDB connected');
}).catch(err => {
  console.error('MongoDB connection error:', err);
});

const userSchema = new mongoose.Schema({
  username: { type: String, unique: true },
  password: String,
  address: String,
  englishProficiency: String,
  hobby: String,
});

const attendanceSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  date: { type: Date, default: Date.now },
  status: String,
  comment: String,
});

const User = mongoose.model('User', userSchema);
const Attendance = mongoose.model('Attendance', attendanceSchema);

// Register new user
app.post('/register', async (req, res) => {
  try {
    const { username, password, address, englishProficiency, hobby } = req.body;
    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({
      username,
      password: hash,
      address,
      englishProficiency,
      hobby,
    });
    res.status(201).json({ id: user._id, username: user.username });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: 'Registration failed' });
  }
});

// Login existing user
app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });
    res.json({ id: user._id, username: user.username });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Create attendance record
app.post('/attendance', async (req, res) => {
  try {
    const { userId, date, status, comment } = req.body;
    const record = await Attendance.create({
      user: userId,
      date: date ? new Date(date) : undefined,
      status,
      comment,
    });
    res.status(201).json(record);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: 'Could not create record' });
  }
});

// Get all attendance records
app.get('/attendance', async (req, res) => {
  try {
    const records = await Attendance.find().populate('user', 'username');
    res.json(records);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not fetch records' });
  }
});

// Update attendance record
app.put('/attendance/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { date, status, comment } = req.body;
    const record = await Attendance.findByIdAndUpdate(
      id,
      { date, status, comment },
      { new: true }
    );
    if (!record) return res.status(404).json({ error: 'Record not found' });
    res.json(record);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: 'Could not update record' });
  }
});

// Delete attendance record
app.delete('/attendance/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const record = await Attendance.findByIdAndDelete(id);
    if (!record) return res.status(404).json({ error: 'Record not found' });
    res.json({ message: 'Record deleted' });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: 'Could not delete record' });
  }
});

module.exports = app;

if (require.main === module) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
}
