import React, { useState, useRef, useEffect } from 'react';
import { askQuestion, ChatResponse, ApiError } from '@site/src/utils/apiClient';
import styles from './styles.module.css';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  sources?: Array<{
    chapter_id: string;
    chapter_title: string;
    relevance_score: number;
  }>;
  timestamp: Date;
}

export default function ChatbotWidget(): JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      const response: ChatResponse = await askQuestion({ question: input });

      const assistantMessage: Message = {
        role: 'assistant',
        content: response.answer,
        sources: response.sources,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      const errorMessage =
        err instanceof ApiError
          ? err.message
          : 'An unexpected error occurred. Please try again.';

      setError(errorMessage);

      const errorBotMessage: Message = {
        role: 'assistant',
        content: `Sorry, I encountered an error: ${errorMessage}`,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorBotMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setMessages([]);
    setError(null);
  };

  return (
    <>
      {/* Floating Button */}
      <button
        className={styles.floatingButton}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle chatbot"
      >
        {isOpen ? '✕' : '💬'}
      </button>

      {/* Chatbot Widget */}
      {isOpen && (
        <div className={styles.chatWidget}>
          {/* Header */}
          <div className={styles.header}>
            <div className={styles.headerTitle}>
              <span className={styles.headerIcon}>🤖</span>
              <span>AI Tutor</span>
            </div>
            <div className={styles.headerActions}>
              <button
                className={styles.clearButton}
                onClick={handleClear}
                title="Clear conversation"
              >
                🗑️
              </button>
              <button
                className={styles.closeButton}
                onClick={() => setIsOpen(false)}
                title="Close"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className={styles.messages}>
            {messages.length === 0 && (
              <div className={styles.welcomeMessage}>
                <p>👋 Hi! I'm your AI tutor for Physical AI & Humanoid Robotics.</p>
                <p>Ask me anything about the textbook content!</p>
                <div className={styles.exampleQuestions}>
                  <p className={styles.exampleTitle}>Try asking:</p>
                  <button
                    className={styles.exampleButton}
                    onClick={() => setInput('What is Physical AI?')}
                  >
                    What is Physical AI?
                  </button>
                  <button
                    className={styles.exampleButton}
                    onClick={() => setInput('Explain forward kinematics')}
                  >
                    Explain forward kinematics
                  </button>
                  <button
                    className={styles.exampleButton}
                    onClick={() => setInput('How do humanoid robots maintain balance?')}
                  >
                    How do humanoid robots maintain balance?
                  </button>
                </div>
              </div>
            )}

            {messages.map((message, index) => (
              <div
                key={index}
                className={`${styles.message} ${
                  message.role === 'user' ? styles.userMessage : styles.assistantMessage
                }`}
              >
                <div className={styles.messageContent}>
                  <div className={styles.messageText}>{message.content}</div>

                  {message.sources && message.sources.length > 0 && (
                    <div className={styles.sources}>
                      <p className={styles.sourcesTitle}>📚 Sources:</p>
                      {message.sources.map((source, idx) => (
                        <a
                          key={idx}
                          href={`/docs/${source.chapter_id}`}
                          className={styles.sourceLink}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {source.chapter_title}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className={`${styles.message} ${styles.assistantMessage}`}>
                <div className={styles.messageContent}>
                  <div className={styles.typing}>
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Form */}
          <form className={styles.inputForm} onSubmit={handleSubmit}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question..."
              className={styles.input}
              disabled={isLoading}
            />
            <button
              type="submit"
              className={styles.sendButton}
              disabled={!input.trim() || isLoading}
            >
              {isLoading ? '⏳' : '➤'}
            </button>
          </form>
        </div>
      )}
    </>
  );
}
