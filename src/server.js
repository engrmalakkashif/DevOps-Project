const express = require("express");
const routes = require("./routes");

const app = express();

const PORT = process.env.PORT || 5000;


// Middleware
app.use(express.json());


// API routes
app.use("/api", routes);


// Root endpoint
app.get("/", (req, res) => {
    res.json({
        message: "DevOps Task Manager API",
        status: "running"
    });
});


// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: "Route not found"
    });
});


// Start server
app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
});
