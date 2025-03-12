const API_BASE_URL =
  window.location.hostname === "localhost"
    ? "http://localhost:5000"
    : "https://seo-tools-backend.onrender.com"; // Replace with your actual deployed URL

async function fetchResults(taskId) {
  console.log(taskId);
  let attempts = 0;
  const maxAttempts = 20; // Max retries
  const delay = 10000; // 10 seconds delay between retries

  while (attempts < maxAttempts) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/broken-links/${taskId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();

      // ✅ Check if the task has a result and is fully completed
      if (
        data.tasks &&
        data.tasks.length > 0 &&
        data.tasks[0].result &&
        data.tasks[0].result.length > 0 &&
        data.tasks[0].result[0].crawl_progress === "finished"
      ) {
        console.log("Crawl completed!", data);
        return data; // ✅ Return the results when done
      }

      console.log(
        `Attempt ${
          attempts + 1
        }: Crawl still in progress. Retrying...`
      );
    } catch (error) {
      console.error("Fetch error:", error);
    }

    attempts++;
    await new Promise((resolve) => setTimeout(resolve, delay)); // Wait before retrying
  }

  throw new Error("Failed to fetch results after multiple attempts.");
}

async function checkLinks() {
  const websiteUrl = document
    .getElementById("websiteUrl")
    .value.trim();
  const resultsDiv = document.getElementById("results");

  if (!websiteUrl) {
    resultsDiv.innerHTML =
      "<p style='color:red;'>Please enter a valid URL</p>";
    return;
  }

  resultsDiv.innerHTML = "<p>Checking for broken links...</p>";

  try {
    const response = await fetch(`${API_BASE_URL}/check-links`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target: websiteUrl }),
    });

    const data = await response.json();
    if (data.error) {
      resultsDiv.innerHTML = `<p style='color:red;'>Error: ${data.error}</p>`;
      return;
    }

    resultsDiv.innerHTML = `<p>Task started! Task ID: ${data.taskId}. Fetching results...</p>`;

    // Fetch results only when they're ready
    const results = await fetchResults(data.taskId);
    const brokenLinks = results.tasks[0].result[0].items.filter(item => item.is_broken);

    resultsDiv.innerHTML = `
      <p>Task completed!</p>
      <p>Total links found: ${results.tasks[0].result[0].total_items_count}</p>
      <p>Total links checked: ${results.tasks[0].result[0].items_count}</p>
      <p>Broken links found: ${brokenLinks.length}</p>
    `;
  } catch (error) {
    resultsDiv.innerHTML = `<p style='color:red;'>Failed to connect to server</p>`;
    console.error("Error:", error);
  }
}
