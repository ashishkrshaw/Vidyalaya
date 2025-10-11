import { useState, useEffect, useRef } from 'react';
// @ts-ignore
// Removed Perplexity API key
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

  // Default xchat bot response logic
  const getBotResponse = async (userInput: string) => {
    // Eliza-like responses for greetings
    if (/^(hi|hello|hey|how are you|how areyou|hoaw)/i.test(userInput.trim())) {
      const responses = [
        "Hello! How can I help you today?",
        "I'm just a bot, but I'm here to assist you!",
        "Hi there! Need help with students or fees?",
        "I'm doing well, thank you! How can I help you?"
      ];
      return responses[Math.floor(Math.random() * responses.length)];
    }
    // Section-based navigation
    if (/add.*student/i.test(userInput)) {
      document.getElementById('menu-add-student')?.click();
      return 'Navigating to Add Student section... You can add a new student by filling the form.';
    }
    if (/find.*student/i.test(userInput)) {
      document.getElementById('menu-show-student')?.click();
      return 'Navigating to Find Student section...';
    }
    if (/fee/i.test(userInput)) {
      document.getElementById('menu-fee-management')?.click();
      return 'Navigating to Fee Management section...';
    }
    if (/settings/i.test(userInput)) {
      document.getElementById('menu-settings')?.click();
      return 'Navigating to Settings section...';
    }
    // Eliza-like fallback
    if (/student/i.test(userInput)) {
      return "You can add or find students using the menu. What would you like to do?";
    }
    return 'Hello! I am your school assistant bot. You can ask me about adding students, finding students, managing fees, or navigating to settings.';
  };

  const handleSend = async (text: string = input) => {
    if (text.trim() === '') return;

    const userMessage = { text, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
    setInput('');

    const botReply = await getBotResponse(text);
    setMessages(prev => [...prev, { text: botReply, sender: 'bot' }]);
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