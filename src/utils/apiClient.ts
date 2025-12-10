/**
 * API client for backend communication
 */

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export interface ChatRequest {
  question: string;
  user_id?: string;
  user_context?: {
    education_level?: 'beginner' | 'intermediate' | 'advanced';
    goals?: string;
    prior_knowledge?: string;
  };
}

export interface ChatSource {
  chapter_id: string;
  chapter_title: string;
  relevance_score: number;
}

export interface ChatResponse {
  answer: string;
  sources: ChatSource[];
  chunks_retrieved: number;
  model_used: string;
  timestamp: string;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Ask a question to the chatbot
 */
export async function askQuestion(request: ChatRequest): Promise<ChatResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/chat/ask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        response.status,
        errorData.detail || `HTTP error ${response.status}`,
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(0, 'Network error: Unable to connect to the server');
  }
}

/**
 * Legacy function for backward compatibility
 */
export const askChatbot = async (question: string) => {
  return askQuestion({ question });
};

/**
 * Check backend health
 */
export async function checkHealth(): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);

    if (!response.ok) {
      throw new ApiError(response.status, 'Health check failed');
    }

    return await response.json();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(0, 'Network error: Unable to connect to the server');
  }
}
