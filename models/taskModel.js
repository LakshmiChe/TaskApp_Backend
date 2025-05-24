const mongoose = require('mongoose');

const ReplySchema = new mongoose.Schema({
    content: { type: String, required: true },
    author: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
});

const CommentSchema = new mongoose.Schema({
    content: { type: String, required: true },
    author: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    replies: [ReplySchema],
});

const TaskSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    deadline: { type: Date, required: true },
    priority: { type: String, enum: ["Low", "Medium", "High"], required: true },
    category: { type: String, required: true },
    comments: [CommentSchema], // Add comments to the task schema
    assignee: { type: String }, // Name or ID of the assigned user
    dueDate: { type: Date }, // Optional due date
    reminderDate: { type: Date }, // Optional reminder date
     status: { 
            type: String, 
            enum: ["Pending", "In Progress", "Completed"], 
            default: "Pending" 
        }, // <-- Added status field
     sharedWith: [
        {
            user: { type: String, required: true }, // Username or email of the shared user/team
            permission: { type: String, enum: ["view", "edit"], required: true }, // Permission type
        },
    ],
    attachments: [{
        fileName: String,
        filePath: String,
        fileSize: Number
    }]
}, { timestamps: true });

module.exports = mongoose.model('Task', TaskSchema);
