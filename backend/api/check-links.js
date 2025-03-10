import axios from "axios";

export default async function handler(req, res) {
  // ✅ Add CORS Headers
  res.setHeader("Access-Control-Allow-Origin", "*"); // Allow all domains
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // ✅ Handle preflight OPTIONS request
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { target } = req.body;
  if (!target) {
    return res.status(400).json({ error: "Target URL is required" });
  }

  try {
    const response = await axios.post(
      "https://api.dataforseo.com/v3/on_page/task_post",
      [{ target, max_crawl_pages: 1 }],
      {
        auth: {
          username: process.env.DATAFORSEO_USERNAME,
          password: process.env.DATAFORSEO_PASSWORD,
        },
      }
    );

    const taskId = response.data.tasks[0].id;
    res.status(200).json({ taskId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
