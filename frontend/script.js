const API_BASE_URL =
  window.location.hostname === "localhost"
    ? "http://localhost:5000"
    : "https://seo-tools-backend.onrender.com"; // Replace with your actual deployed URL

async function fetchResults(taskId) {
  try {
    const response = await fetch(`${API_BASE_URL}/broken-links/${taskId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    if (response.status === 202) {
      // Task still processing
      console.log("Task is still processing...");
      return null; // Indicate that results are not ready yet
    }

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();

    if (!data.tasks || data.tasks.length === 0 || !data.tasks[0].result) {
      throw new Error("No results found. Task might not be ready yet.");
    }

    console.log("Crawl completed!", data);
    return data; // ✅ Return the results when done
  } catch (error) {
    console.error("Fetch error:", error);
    throw error; // Propagate error
  }
}

async function pollForResults(taskId, resultsDiv) {
  let attempts = 0;
  const maxAttempts = 20; // Limit to prevent infinite polling

  return new Promise((resolve, reject) => {
    const interval = setInterval(async () => {
      attempts++;

      try {
        const results = await fetchResults(taskId);
        if (results) {
          clearInterval(interval); // Stop polling
          resolve(results); // Resolve with data
        } else if (attempts >= maxAttempts) {
          clearInterval(interval);
          reject(new Error("Timed out waiting for results."));
        }
      } catch (error) {
        clearInterval(interval);
        reject(error);
      }
    }, 5000); // Poll every 5 seconds
  });
}

async function checkLinks() {
  const websiteUrl = document.getElementById("websiteUrl").value.trim();
  const resultsDiv = document.getElementById("results");

  if (!websiteUrl) {
    resultsDiv.innerHTML = "<p style='color:red;'>Please enter a valid URL</p>";
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

    // Poll for results every 5 seconds
    const results = await pollForResults(data.taskId, resultsDiv);

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
