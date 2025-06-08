const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const api = {
  getSession: async (sessionId: string) => {
    const response = await fetch(`${API_URL}/api/session/${sessionId}`);
    return response.json();
  }
};