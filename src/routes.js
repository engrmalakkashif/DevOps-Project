const express = require("express");
const db = require("./database");

const router = express.Router();


// Health check
router.get("/health", (req, res) => {
    res.json({
        status: "healthy",
        application: "DevOps Task Manager",
        version: "1.0.0"
    });
});


// Get all tasks
router.get("/tasks", (req, res) => {

    const { status } = req.query;

    let tasks;

    if (status) {
        tasks = db.prepare(
            "SELECT * FROM tasks WHERE status = ? ORDER BY id DESC"
        ).all(status);
    } else {
        tasks = db.prepare(
            "SELECT * FROM tasks ORDER BY id DESC"
        ).all();
    }

    res.json(tasks);
});


// Get single task
router.get("/tasks/:id", (req, res) => {

    const task = db.prepare(
        "SELECT * FROM tasks WHERE id = ?"
    ).get(req.params.id);

    if (!task) {
        return res.status(404).json({
            error: "Task not found"
        });
    }

    res.json(task);
});


// Create task
router.post("/tasks", (req, res) => {

    const {
        title,
        description,
        priority
    } = req.body;

    if (!title) {
        return res.status(400).json({
            error: "Title is required"
        });
    }

    const result = db.prepare(`
        INSERT INTO tasks
        (title, description, priority)
        VALUES (?, ?, ?)
    `).run(
        title,
        description || null,
        priority || "medium"
    );

    const task = db.prepare(
        "SELECT * FROM tasks WHERE id = ?"
    ).get(result.lastInsertRowid);

    res.status(201).json(task);
});


// Update task
router.put("/tasks/:id", (req, res) => {

    const task = db.prepare(
        "SELECT * FROM tasks WHERE id = ?"
    ).get(req.params.id);

    if (!task) {
        return res.status(404).json({
            error: "Task not found"
        });
    }

    const {
        title,
        description,
        status,
        priority
    } = req.body;

    db.prepare(`
        UPDATE tasks
        SET
            title = ?,
            description = ?,
            status = ?,
            priority = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    `).run(
        title ?? task.title,
        description ?? task.description,
        status ?? task.status,
        priority ?? task.priority,
        req.params.id
    );

    const updatedTask = db.prepare(
        "SELECT * FROM tasks WHERE id = ?"
    ).get(req.params.id);

    res.json(updatedTask);
});


// Delete task
router.delete("/tasks/:id", (req, res) => {

    const result = db.prepare(
        "DELETE FROM tasks WHERE id = ?"
    ).run(req.params.id);

    if (result.changes === 0) {
        return res.status(404).json({
            error: "Task not found"
        });
    }

    res.json({
        message: "Task deleted successfully"
    });
});


// Mark task as completed
router.patch("/tasks/:id/complete", (req, res) => {

    const result = db.prepare(`
        UPDATE tasks
        SET
            status = 'completed',
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    `).run(req.params.id);

    if (result.changes === 0) {
        return res.status(404).json({
            error: "Task not found"
        });
    }

    const task = db.prepare(
        "SELECT * FROM tasks WHERE id = ?"
    ).get(req.params.id);

    res.json(task);
});


// Search tasks
router.get("/tasks/search", (req, res) => {

    const query = req.query.q || "";

    const tasks = db.prepare(`
        SELECT *
        FROM tasks
        WHERE title LIKE ?
           OR description LIKE ?
        ORDER BY id DESC
    `).all(
        `%${query}%`,
        `%${query}%`
    );

    res.json(tasks);
});


// Statistics
router.get("/stats", (req, res) => {

    const total = db.prepare(
        "SELECT COUNT(*) AS count FROM tasks"
    ).get().count;

    const pending = db.prepare(
        "SELECT COUNT(*) AS count FROM tasks WHERE status = 'pending'"
    ).get().count;

    const inProgress = db.prepare(
        "SELECT COUNT(*) AS count FROM tasks WHERE status = 'in_progress'"
    ).get().count;

    const completed = db.prepare(
        "SELECT COUNT(*) AS count FROM tasks WHERE status = 'completed'"
    ).get().count;

    const highPriority = db.prepare(
        "SELECT COUNT(*) AS count FROM tasks WHERE priority = 'high'"
    ).get().count;

    res.json({
        total_tasks: total,
        pending,
        in_progress: inProgress,
        completed,
        high_priority: highPriority
    });
});


module.exports = router;
