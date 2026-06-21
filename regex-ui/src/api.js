const API_URL = import.meta.env.VITE_API_URL;

export async function testRegex(pattern, text, flags = "g") {
  const response = await fetch(`${API_URL}/api/regex`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pattern, text, flags }),
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return response.json();
}