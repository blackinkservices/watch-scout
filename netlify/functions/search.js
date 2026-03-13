// netlify/functions/search.js
// This runs on Netlify's servers — the API key never touches the browser.

const ANTHROPIC_API = "https://api.anthropic.com/v1/messages";

exports.handler = async function (event) {
  // Only allow POST
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "ANTHROPIC_API_KEY is not set in environment variables" })
    };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid JSON body" }) };
  }

  try {
    const response = await fetch(ANTHROPIC_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(body),
    });

    const text = await response.text();

    // If the response isn't JSON (e.g. Cloudflare HTML error), wrap it
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      return {
        statusCode: response.status || 502,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: `Anthropic API returned non-JSON (HTTP ${response.status}). This is usually a temporary rate limit or outage — try again in 30 seconds.` }),
      };
    }

    return {
      statusCode: response.status,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    };
  } catch (err) {
    return {
      statusCode: 502,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Failed to reach Anthropic API", detail: err.message }),
    };
  }
};
