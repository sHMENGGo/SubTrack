
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/';

export async function custom_fetch(endpoint: string, options: RequestInit = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };
  // Actual Fetch request
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include' // Include cookies in the request
  });

  // Automatically throw an error
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Something went wrong');
  }

  return response.json();
}