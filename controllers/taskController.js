const Task = require('../models/taskModel');
const { sendEmail } = require("../emailService");
const { ChartJSNodeCanvas } = require('chartjs-node-canvas');
// Create a new task
const createTask = async (req, res) => {
    try {
        const { title, description, deadline, priority, category, assignee, dueDate, reminderDate } = req.body;

        if (!title || !description || !deadline || !priority || !category) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const task = new Task({ title, description, deadline, priority, category, assignee, dueDate, reminderDate });
        const savedTask = await task.save();

        res.status(201).json(savedTask);
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};

// Get all tasks
const getTasks = async (req, res) => {
    try {
        const tasks = await Task.find().sort({ deadline: 1, priority: 1 }); // Sort by deadline, then priority
        res.status(200).json(tasks);
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};

// Update Task Controller with Notification
const updateTask = async (req, res) => {
    const { id } = req.params;
    const { title, description, status, assigneeEmail } = req.body;

    try {
        const updatedTask = await Task.findByIdAndUpdate(
            id,
            { title, description, status },
            { new: true }
        );

        if (updatedTask) {
            // Notify assignee about the update
            if (assigneeEmail) {
                await sendEmail(
                    assigneeEmail,
                    `Task "${title}" Updated`,
                    `The task "${title}" has been updated. Current status: ${status}.`
                );
            }

            res.status(200).json({ message: "Task updated successfully", updatedTask });
        } else {
            res.status(404).json({ message: "Task not found" });
        }
    } catch (error) {
        console.error("Error updating task:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
// Cron Job for Deadline Notifications
const sendDeadlineReminders = async () => {
    try {
        const today = new Date();
        const tomorrow = new Date();
        tomorrow.setDate(today.getDate() + 1);

        const tasksDueSoon = await Task.find({
            deadline: { $lte: tomorrow, $gte: today },
        });

        for (const task of tasksDueSoon) {
            if (task.assigneeEmail) {
                await sendEmail(
                    task.assigneeEmail,
                    `Reminder: Task "${task.title}" is due soon`,
                    `The task "${task.title}" is due on ${new Date(task.deadline).toLocaleDateString()}.`
                );
            }
        }

        console.log("Deadline reminders sent.");
    } catch (error) {
        console.error("Error sending deadline reminders:", error);
    }
};
// Delete a task
const deleteTask = async (req, res) => {
    try {
        const { id } = req.params;

        const deletedTask = await Task.findByIdAndDelete(id);

        if (!deletedTask) {
            return res.status(404).json({ message: "Task not found" });
        }

        res.status(200).json({ message: "Task deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};
// Share a task
const shareTask = async (req, res) => {
    try {
        const { id } = req.params; // Task ID
        const { user, permission } = req.body;

        if (!user || !permission) {
            return res.status(400).json({ message: "User and permission are required" });
        }

        const task = await Task.findById(id);
        if (!task) {
            return res.status(404).json({ message: "Task not found" });
        }

        task.sharedWith.push({ user, permission });
        await task.save();

        res.status(200).json(task);
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};

// Update sharing permissions
const updateSharing = async (req, res) => {
    try {
        const { id, user } = req.params;
        const { permission } = req.body;

        if (!permission) {
            return res.status(400).json({ message: "Permission is required" });
        }

        const task = await Task.findById(id);
        if (!task) {
            return res.status(404).json({ message: "Task not found" });
        }

        const sharedUser = task.sharedWith.find((u) => u.user === user);
        if (!sharedUser) {
            return res.status(404).json({ message: "User not found in shared list" });
        }

        sharedUser.permission = permission;
        await task.save();

        res.status(200).json(task);
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};

// Remove a shared user/team
const removeSharedUser = async (req, res) => {
    try {
        const { id, user } = req.params;

        const task = await Task.findById(id);
        if (!task) {
            return res.status(404).json({ message: "Task not found" });
        }

        task.sharedWith = task.sharedWith.filter((u) => u.user !== user);
        await task.save();

        res.status(200).json(task);
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};
// Add a new comment to a task
const addComment = async (req, res) => {
    try {
        const { id } = req.params; // Task ID
        const { content, author } = req.body;

        if (!content || !author) {
            return res.status(400).json({ message: "Content and author are required" });
        }

        const task = await Task.findById(id);
        if (!task) {
            return res.status(404).json({ message: "Task not found" });
        }

        const newComment = { content, author };
        task.comments.push(newComment);
        await task.save();

        res.status(201).json(task.comments);
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};

// Add a reply to a comment
const addReply = async (req, res) => {
    try {
        const { id, commentId } = req.params; // Task ID and Comment ID
        const { content, author } = req.body;

        if (!content || !author) {
            return res.status(400).json({ message: "Content and author are required" });
        }

        const task = await Task.findById(id);
        if (!task) {
            return res.status(404).json({ message: "Task not found" });
        }

        const comment = task.comments.id(commentId);
        if (!comment) {
            return res.status(404).json({ message: "Comment not found" });
        }

        const newReply = { content, author };
        comment.replies.push(newReply);
        await task.save();

        res.status(201).json(comment);
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};

// Fetch comments for a task
const getComments = async (req, res) => {
    try {
        const { id } = req.params; // Task ID
        const task = await Task.findById(id).select('comments');
        if (!task) {
            return res.status(404).json({ message: "Task not found" });
        }

        res.status(200).json(task.comments);
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};

// Attach files to a task
const attachFile = async (req, res) => {
    try {
        const { id } = req.params; // Task ID
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        const task = await Task.findById(id);
        if (!task) {
            return res.status(404).json({ message: "Task not found" });
        }

        const fileData = {
            fileName: req.file.originalname,
            filePath: req.file.path,
            fileSize: req.file.size,
        };

        task.attachments.push(fileData);
        await task.save();

        res.status(200).json({ message: "File attached successfully", fileData });
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};

// Update the status of a task
const updateTaskStatus = async (req, res) => {
    const { id } = req.params; // Task ID
    const { status } = req.body; // New status

    try {
        if (!["Pending", "In Progress", "Completed"].includes(status)) {
            return res.status(400).json({ message: "Invalid status value" });
        }

        const task = await Task.findById(id);
        if (!task) {
            return res.status(404).json({ message: "Task not found" });
        }

        task.status = status;
        await task.save();

        res.status(200).json({ message: "Task status updated successfully", task });
    } catch (error) {
        console.error("Error updating task status:", error);
        res.status(500).json({ message: "Server error", error });
    }
};


const generateProgressReport = async (req, res) => {
    try {
        // Fetch task data
        const tasks = await Task.find();
        
        // Calculate completion rates
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter(task => task.status === "Completed").length;
        const inProgressTasks = tasks.filter(task => task.status === "In Progress").length;
        const pendingTasks = totalTasks - completedTasks - inProgressTasks;

        // Group tasks by category
        const tasksByCategory = tasks.reduce((acc, task) => {
            acc[task.category] = (acc[task.category] || 0) + 1;
            return acc;
        }, {});
        const chartBuffer = await generateBarChart(tasksByCategory);
        // Prepare data for charts
        const progressData = {
            totalTasks,
            completedTasks,
            inProgressTasks,
            pendingTasks,
            tasksByCategory,
        };
         res.setHeader('Content-Type', 'image/png');
        res.send(chartBuffer);
        res.status(200).json(progressData);
    } catch (error) {
        console.error("Error generating progress report:", error);
        res.status(500).json({ message: "Server error", error });
    }
};




module.exports = { createTask, getTasks, updateTask, deleteTask,shareTask, updateSharing, removeSharedUser,addComment,
   addReply, getComments,attachFile,sendDeadlineReminders,updateTaskStatus,generateProgressReport 
   
 };
