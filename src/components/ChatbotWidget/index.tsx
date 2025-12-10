
import React, { useState } from 'react';
import styles from './styles.module.css';
import { askChatbot } from '@site/src/utils/apiClient';

interface Message {
  text: string;
  isUser: boolean;
}

const ChatbotWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleWidget = () => {
    setIsOpen(!isOpen);
  };

  const handleSend = async () => {
    if (input.trim() === '') return;

    const newMessages: Message[] = [...messages, { text: input, isUser: true }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      const response = await askChatbot(input);
      setMessages([...newMessages, { text: response.answer, isUser: false }]);
    } catch (err) {
      setError('Failed to get an answer. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.widgetContainer}>
      <button className={styles.widgetButton} onClick={toggleWidget}>
        Chat
      </button>
      {isOpen && (
        <div className={styles.chatWindow}>
          <div className={styles.chatHeader}>
            <h2>AI Assistant</h2>
            <button onClick={toggleWidget}>Close</button>
          </div>
          <div className={styles.chatBody}>
            {messages.map((msg, index) => (
              <div key={index} className={msg.isUser ? styles.userMessage : styles.botMessage}>
                {msg.text}
              </div>
            ))}
            {loading && <div className={styles.loading}>Thinking...</div>}
            {error && <div className={styles.error}>{error}</div>}
          </div>
          <div className={styles.chatFooter}>
            <input
              type="text"
              placeholder="Ask a question..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            />
            <button onClick={handleSend}>Send</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatbotWidget;
