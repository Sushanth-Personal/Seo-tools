import axios from "axios";

export default async function handler(req, res) {
  // ✅ Add CORS Headers
  res.setHeader("Access-Control-Allow-Origin", "*"); // Allow all domains
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // ✅ Handle preflight OPTIONS request
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { taskId } = req.query;
  if (!taskId) {
    return res.status(400).json({ error: "Task ID is required" });
  }

  try {
    const response = await axios.post(
      "https://api.dataforseo.com/v3/on_page/links",
      [{ id: taskId, filters: [["status_code", "=", 404]], limit: 10 }],
      {
        auth: {
          username: process.env.DATAFORSEO_USERNAME,
          password: process.env.DATAFORSEO_PASSWORD,
        },
      }
    );

    res.status(200).json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.response?.data || error.message });
  }
}
