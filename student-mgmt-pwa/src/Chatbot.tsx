import React, { useState } from 'react';
import './Chatbot.css';

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ text: string; sender: string }[]>([]);
  const [input, setInput] = useState('');

  const PERPLEXITY_API_KEY = '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';

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  const handleSend = async () => {
    if (input.trim() === '') return;

    const userMessage = { text: input, sender: 'user' };
    setMessages(prevMessages => [...prevMessages, userMessage]);
    const currentInput = input;
    setInput('');

    // Show thinking message
    const botMessage = { text: 'Thinking...', sender: 'bot' };
    setMessages(prevMessages => [...prevMessages, botMessage]);

    try {
      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${PERPLEXITY_API_KEY}`
        },
        body: JSON.stringify({
          model: 'llama-3.1-sonar-small-128k-online',
          messages: [
            {
              role: 'system',
              content: 'You are a professional school AI assistant. Help with queries about admissions, curriculum, faculty, and general school-related questions.'
            },
            {
              role: 'user',
              content: currentInput
            }
          ],
          max_tokens: 500,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const aiResponse = data.choices[0].message.content;

      setMessages(prevMessages => {
        const newMessages = [...prevMessages];
        newMessages[newMessages.length - 1] = { text: aiResponse, sender: 'bot' };
        return newMessages;
      });

    } catch (error) {
      console.error('Error calling Perplexity API:', error);
      setMessages(prevMessages => {
        const newMessages = [...prevMessages];
        newMessages[newMessages.length - 1] = { 
          text: 'Sorry, I encountered an error. Please try again later.', 
          sender: 'bot' 
        };
        return newMessages;
      });
    }
  };

  return (
    <div className="chatbot-container">
      <div className={`chatbot-icon ${isOpen ? 'open' : ''}`} onClick={toggleChat}>
        AI
      </div>
      {isOpen && (
        <div className="chatbot-window">
          <div className="chatbot-header">
            <h2>School AI Assistant</h2>
            <button onClick={toggleChat}>X</button>
          </div>
          <div className="chatbot-messages">
            {messages.map((msg, index) => (
              <div key={index} className={`message ${msg.sender}`}>
                {msg.text}
              </div>
            ))}
          </div>
          <div className="chatbot-input">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask a question..."
            />
            <button onClick={handleSend}>Send</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chatbot;