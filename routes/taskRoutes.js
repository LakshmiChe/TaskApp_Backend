const express = require('express');
const upload = require('../upload')
const authMiddleware = require('../middleware/authMiddleware');
const { createTask, getTasks, updateTask, deleteTask,shareTask, updateSharing, removeSharedUser, 
    addComment, 
    addReply, 
    getComments,
    attachFile,
    updateTaskStatus,
    generateProgressReport 
    

 } = require('../controllers/taskController');

const router = express.Router();

// Apply authMiddleware to ALL routes in this router
// router.use(authMiddleware);

// POST: Create a new task
router.post('/', createTask);

// GET: Retrieve all tasks
router.get('/', getTasks);

// PUT: Update a task
router.put('/:id', updateTask);

// DELETE: Delete a task
router.delete('/:id', deleteTask);

// Share a task
router.post("/:id/share", shareTask);

// Update sharing permissions
router.patch("/:id/share/:user", updateSharing);

// Remove a shared user/team
router.delete("/:id/share/:user", removeSharedUser);


// New routes for comments
router.post('/:id/comments', addComment); // Add a new comment to a task
router.get('/:id/comments', getComments); // Get all comments for a task
router.post('/:id/comments/:commentId/replies', addReply); // Add a reply to a specific comment

//attch file
router.post('/:id/attach', upload.single('file'), attachFile);

// Update task status
router.patch('/:id/status', updateTaskStatus);


router.get('/reports/progress', generateProgressReport);

module.exports = router;
