require("dotenv").config();
const express = require("express");
const axios = require("axios");
const cors = require("cors");
const morgan = require("morgan"); // Import Morgan

const app = express();
const PORT = 5000;

// Middleware
app.use(express.json());
app.use(cors());
app.use(morgan("dev")); // Use Morgan for logging requests

// Route to check broken links
app.post("/check-links", async (req, res) => {
    const { target } = req.body;

    if (!target) {
        return res.status(400).json({ error: "Target URL is required" });
    }

    try {
        // Sending request to DataForSEO On-Page API
        const response = await axios.post("https://api.dataforseo.com/v3/on_page/task_post", [
            {
                target,
                max_crawl_pages: 100
            }
        ], {
            auth: {
                username: process.env.DATAFORSEO_USERNAME,
                password: process.env.DATAFORSEO_PASSWORD
            }
        });

        // Extract task ID
        const taskId = response.data.tasks[0].id;
        res.json({ taskId });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Route to get dofollow external links (instead of 404 broken links)
app.get("/broken-links/:taskId", async (req, res) => {
    const { taskId } = req.params;

    try {
        const postArray = [];

        postArray.push({
            "id": taskId,
            "limit": 2 // Limit results to 10 links
        });

        const response = await axios.post(
            "https://api.dataforseo.com/v3/on_page/links",
            postArray,  // ✅ Pass an array, not an object
            {
                auth: {
                    username: process.env.DATAFORSEO_USERNAME,
                    password: process.env.DATAFORSEO_PASSWORD
                },
                headers: {
                    "Content-Type": "application/json"
                }
            }
        );

        console.log("Response Data:", response.data); // Log response
        if(response)res.json(response.data);
    } catch (error) {
        console.error("API Error:", error.response?.data || error.message);
        res.status(500).json({ error: error.response?.data || error.message });
    }
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
