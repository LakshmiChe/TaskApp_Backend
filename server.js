const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const cron = require("node-cron");
const multer = require('multer');
const fs = require('fs');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/taskRoutes');


// Load environment variables
dotenv.config();

// Initialize Express
const app = express();

// Middleware
app.use(cors());
app.use(express.json()); // Parse JSON requests

// Connect to MongoDB
connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);

// Cron Job for Daily Deadline Reminders
cron.schedule("0 8 * * *", async () => {
    console.log("Running daily deadline reminder cron job...");
    await sendDeadlineReminders();
});
// Error handling middleware
app.use((err, req, res, next) => {
    res.status(500).json({ message: err.message });
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
