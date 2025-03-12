require("dotenv").config();
const express = require("express");
const axios = require("axios");
const cors = require("cors");
const morgan = require("morgan");

const app = express();
const PORT = 5000;

// Middleware
app.use(express.json());
app.use(cors());
app.use(morgan("dev"));

app.use(
  cors({
    origin: "https://seo-tools-frontend.vercel.app", // Allow your frontend
    methods: "GET,POST,PUT,DELETE", // Allow specific methods
    allowedHeaders: "Content-Type,Authorization", // Allow specific headers
  })
);

// ✅ Store task status
const tasks = {}; // Track processing status
const completedTasks = new Set(); // ✅ Moved here

// Route to check broken links (Creates a task)
app.post("/check-links", async (req, res) => {
  const { target } = req.body;

  if (!target) {
    return res.status(400).json({ error: "Target URL is required" });
  }

  try {
    const post_array = [
      {
        target,
        max_crawl_pages: 10,
        force_sitewide_checks: true,
        load_resources: true,
        enable_javascript: true,
        custom_js: "meta = {}; meta.url = document.URL; meta;",
        tag: "some_string_123",
        pingback_url:
          "https://seo-tools-backend.onrender.com/pingscript?id=$id&tag=$tag",
      },
    ];

    const response = await axios({
      method: "post",
      url: "https://api.dataforseo.com/v3/on_page/task_post",
      auth: {
        username: process.env.DATAFORSEO_USERNAME,
        password: process.env.DATAFORSEO_PASSWORD,
      },
      data: post_array,
      headers: { "Content-Type": "application/json" },
    });

    const taskId = response.data.tasks[0]?.id;
    if (taskId) {
      tasks[taskId] = "processing"; // Store initial task status
    }

    res.json({ taskId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ Route to receive ping and mark task as complete
app.get("/pingscript", (req, res) => {
  const { id, tag } = req.query;

  if (!id) {
    return res.status(400).json({ error: "Task ID is required" });
  }

  completedTasks.add(id); // ✅ Mark task as completed
  console.log(`Task ${id} completed with tag: ${tag}`);

  res.json({ message: "Task received", taskId: id, tag });
});

// Route to get broken links
app.post("/broken-links/:taskId", async (req, res) => {
  const { taskId } = req.params;

  if (!completedTasks.has(taskId)) {
    return res
      .status(202)
      .json({
        message: "Task is still processing. Try again later.",
      });
  }

  try {
    const post_array = [
      {
        id: taskId,
      },
    ];

    const response = await axios({
      method: "post",
      url: "https://api.dataforseo.com/v3/on_page/links",
      auth: {
        username: process.env.DATAFORSEO_USERNAME,
        password: process.env.DATAFORSEO_PASSWORD,
      },
      data: post_array,
      headers: {
        "Content-Type": "application/json",
      },
    });

    console.log("Response Data:", response.data);
    res.json(response.data);
  } catch (error) {
    console.error(
      "API Error:",
      error.response?.data || error.message
    );
    res
      .status(500)
      .json({ error: error.response?.data || error.message });
  }
});

// Start the server
app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);
