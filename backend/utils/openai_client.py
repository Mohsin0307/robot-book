"""OpenAI API client wrapper."""

import os
import openai
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get OpenAI API key
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

if not OPENAI_API_KEY:
    raise ValueError("OPENAI_API_KEY environment variable is not set")

# Configure OpenAI API key
openai.api_key = OPENAI_API_KEY


def create_embedding(text: str, model: str = "text-embedding-ada-002") -> list[float]:
    """
    Create embedding for given text using OpenAI.

    Args:
        text: Text to embed
        model: Embedding model to use (default: text-embedding-ada-002)

    Returns:
        Embedding vector as list of floats
    """
    response = openai.Embedding.create(input=[text], model=model)
    return response["data"][0]["embedding"]


def create_chat_completion(
    messages: list[dict], model: str = "gpt-3.5-turbo", temperature: float = 0.7
) -> str:
    """
    Create chat completion using OpenAI.

    Args:
        messages: List of message dictionaries
        model: Model to use (default: gpt-3.5-turbo)
        temperature: Sampling temperature (default: 0.7)

    Returns:
        Response content as string
    """
    response = openai.ChatCompletion.create(
        model=model, messages=messages, temperature=temperature
    )
    return response["choices"][0]["message"]["content"]
