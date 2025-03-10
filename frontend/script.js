async function fetchResults(taskId) {
  let attempts = 0;
  const maxAttempts = 10; // Max retries
  const delay = 5000; // 5 seconds delay between retries

  while (attempts < maxAttempts) {
    const response = await fetch(
      `http://localhost:5000/broken-links/${taskId}`
    );
    const data = await response.json();

    // Check if the task is completed and has results
    if (data.tasks && data.tasks[0].result !== null) {
      console.log(data);
      return data; // ✅ Return the results
    }

    console.log(
      `Attempt ${attempts + 1}: Task still in queue. Retrying...`
    );
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
    const response = await fetch(
      "http://localhost:5000/check-links",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target: websiteUrl }),
      }
    );

    const data = await response.json();
    if (data.error) {
      resultsDiv.innerHTML = `<p style='color:red;'>Error: ${data.error}</p>`;
      return;
    }

    resultsDiv.innerHTML = `<p>Task started! Task ID: ${data.taskId}. Fetching results...</p>`;

    // Fetch results only when they're ready
    const results = await fetchResults(data.taskId);
    const brokenLinks = results.tasks[0].result.filter(
      (link) => link.is_broken
    );

    resultsDiv.innerHTML = `
            <p>Task completed!</p>
            <p>Total links checked: ${results.tasks[0].result.length}</p>
            <p>Broken links found: ${brokenLinks.length}</p>
        `;
  } catch (error) {
    resultsDiv.innerHTML = `<p style='color:red;'>Failed to connect to server</p>`;
    console.error("Error:", error);
  }
}
