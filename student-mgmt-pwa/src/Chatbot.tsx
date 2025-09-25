import React, { useState, useEffect, useRef } from 'react';
import './Chatbot.css';

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ text: string; sender: string }[]>([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages]);

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  const getBotResponse = (userInput: string) => {
    const lowerInput = userInput.toLowerCase().trim();

    if (lowerInput.includes('add student')) {
      return "To add a new student, go to the 'New Admission' section from the dashboard or sidebar.";
    }
    if (lowerInput.includes('find student') || lowerInput.includes('search student')) {
      return "You can search for students in the 'Show Student' section.";
    }
    if (lowerInput.includes('fee')) {
      return "Manage fees and payments in the 'Fee Management' section.";
    }
    if (lowerInput.includes('settings')) {
      return "You can configure academic settings, fees, and more in the 'Settings' section.";
    }

    const prompts = [
      "How can I help you with managing the school?",
      "What task would you like to perform?",
      "Is there anything I can assist you with?",
    ];
    return prompts[Math.floor(Math.random() * prompts.length)];
  };

  const handleSend = (text: string = input) => {
    if (text.trim() === '') return;

    const userMessage = { text, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
    setInput('');

    setTimeout(() => {
      const botMessage = { text: getBotResponse(text), sender: 'bot' };
      setMessages(prev => [...prev, botMessage]);
    }, 500);
  };

  const defaultPrompts = [
    "How to add a new student?",
    "How to find a student?",
    "Where can I manage fees?",
    "Go to settings",
  ];

  return (
    <div className="chatbot-container">
      <div className={`chatbot-icon ${isOpen ? 'open' : ''}`} onClick={toggleChat}>
        🤖
      </div>
      {isOpen && (
        <div className="chatbot-window">
          <div className="chatbot-header">
            <h2>AI Assistant</h2>
            <button onClick={toggleChat}>&times;</button>
          </div>
          <div className="chatbot-messages">
            {messages.length === 0 && (
              <div className="default-prompts">
                {defaultPrompts.map((prompt, i) => (
                  <button key={i} className="prompt-button" onClick={() => handleSend(prompt)}>
                    {prompt}
                  </button>
                ))}
              </div>
            )}
            {messages.map((msg, index) => (
              <div key={index} className={`message ${msg.sender}`}>
                {msg.text}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          <div className="chatbot-input">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask something..."
            />
            <button onClick={() => handleSend()}>&#x27A4;</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chatbot;