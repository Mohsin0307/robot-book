
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8000';

export const askChatbot = async (question: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/chat/ask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ question }),
    });

    if (!response.ok) {
      throw new Error('Failed to get an answer from the chatbot.');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error asking chatbot:', error);
    throw error;
  }
};
