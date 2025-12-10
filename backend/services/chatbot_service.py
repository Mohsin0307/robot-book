"""Chatbot service for generating answers using RAG."""

from typing import Dict, List
from services.rag_service import retrieve_relevant_chunks, format_context_for_llm
from utils.openai_client import create_chat_completion


SYSTEM_PROMPT = """You are an expert AI tutor specializing in Physical AI and Humanoid Robotics.
Your role is to help students learn about robotics concepts by answering their questions accurately and clearly.

Guidelines:
1. Use the provided context from the textbook to answer questions
2. If the context doesn't contain enough information, say so honestly
3. Cite specific chapters when providing information (e.g., "According to Chapter 2: Sensors...")
4. Explain concepts clearly, adjusting complexity based on the question
5. Provide code examples or mathematical formulas when relevant
6. Encourage further learning by suggesting related topics

Be helpful, accurate, and educational in your responses."""


def generate_answer(question: str, user_context: Dict = None) -> Dict:
    """
    Generate an answer to a user question using RAG.

    Args:
        question: User's question
        user_context: Optional user context (education level, goals, etc.)

    Returns:
        Dictionary containing answer, sources, and metadata
    """
    # Retrieve relevant chunks
    relevant_chunks = retrieve_relevant_chunks(question, top_k=5)

    # Format context for LLM
    context = format_context_for_llm(relevant_chunks)

    # Prepare messages for chat completion
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {
            "role": "user",
            "content": f"""Context from the textbook:
{context}

Student question: {question}

Please provide a clear, educational answer based on the context above. If you cite information, mention which chapter or source it came from."""
        }
    ]

    # Adjust prompt based on user context if provided
    if user_context and user_context.get('education_level'):
        education_level = user_context['education_level']
        if education_level == 'beginner':
            messages[0]['content'] += "\n\nNote: This student is a beginner. Explain concepts in simple terms and avoid overly technical jargon."
        elif education_level == 'advanced':
            messages[0]['content'] += "\n\nNote: This student is advanced. You can use technical terminology and provide deeper explanations."

    # Generate answer
    answer = create_chat_completion(messages, model="gpt-4", temperature=0.7)

    # Format response
    response = {
        'answer': answer,
        'sources': [
            {
                'chapter_id': chunk['chapter_id'],
                'chapter_title': chunk['chapter_title'],
                'relevance_score': chunk['relevance_score']
            }
            for chunk in relevant_chunks[:3]  # Return top 3 sources
        ],
        'chunks_retrieved': len(relevant_chunks),
        'model_used': 'gpt-4'
    }

    return response
