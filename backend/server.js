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

// Route to check broken links (Creates a task)
// Route to check broken links (Creates a task)
app.post("/check-links", async (req, res) => {
  const { target } = req.body;

  if (!target) {
    return res.status(400).json({ error: "Target URL is required" });
  }

  try {
    const post_array = [];
    post_array.push({
      target,
      max_crawl_pages: 10,
      force_sitewide_checks: true,
      load_resources: true,
      enable_javascript: true,
      custom_js: "meta = {}; meta.url = document.URL; meta;",
      tag: "some_string_123",
      pingback_url:
        "https://seo-tools-backend.onrender.com/pingscript?id=$id&tag=$tag",
    });

    const response = await axios({
      method: "post",
      url: "https://api.dataforseo.com/v3/on_page/task_post",
      auth: {
        username: process.env.DATAFORSEO_USERNAME,
        password: process.env.DATAFORSEO_PASSWORD,
      },
      data: post_array, // ✅ Updated with additional parameters
      headers: {
        "Content-Type": "application/json",
      },
    });

    const taskId = response.data.tasks[0]?.id;
    res.json({ taskId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route to get broken links
app.post("/broken-links/:taskId", async (req, res) => {
  const { taskId } = req.params;

  try {
    const post_array = [];
    post_array.push({
      id: taskId,
      filters: [
        ["dofollow", "=", true],
        "and",
        ["direction", "=", "external"],
      ],
      limit: 100, // ✅ Matches DataForSEO example
    });

    const response = await axios({
      method: "post",
      url: "https://api.dataforseo.com/v3/on_page/links",
      auth: {
        username: process.env.DATAFORSEO_USERNAME,
        password: process.env.DATAFORSEO_PASSWORD,
      },
      data: post_array, // ✅ Exactly like their example
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

app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);
