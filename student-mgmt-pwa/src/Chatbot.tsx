import React, { useState } from 'react';
import './Chatbot.css';

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ text: string; sender: string }[]>([]);
  const [input, setInput] = useState('');

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  // ELIZA-style response function
  const getBotResponse = (userInput: string) => {
    const lowerInput = userInput.toLowerCase().trim();

    // Greetings
    const greetings = ['hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening'];
    if (greetings.some(greet => lowerInput.includes(greet))) {
      const responses = [
        'Hello! How can I help you with school today?',
        'Hi there! Ready to answer your school questions.',
        'Hey! What would you like to know about our school?'
      ];
      return responses[Math.floor(Math.random() * responses.length)];
    }

    // Small talk
    if (lowerInput.includes('how are you')) {
      const responses = [
        "I'm doing well! How about you?",
        "I'm good! Ready to assist with any school queries.",
        "Doing great! What school-related questions do you have?"
      ];
      return responses[Math.floor(Math.random() * responses.length)];
    }

    // School-related ELIZA-style responses
    if (lowerInput.includes('admission')) {
      return "Admissions are important. What specific information about admissions would you like to know?";
    }
    if (lowerInput.includes('curriculum')) {
      return "You mentioned curriculum. Which part of our curriculum interests you most?";
    }
    if (lowerInput.includes('faculty')) {
      return "Our faculty is committed to students. Are you curious about a particular department or teacher?";
    }
    if (lowerInput.includes('fee')) {
      return "Fees can vary. Are you asking about tuition, activities, or other costs?";
    }
    if (lowerInput.includes('timings') || lowerInput.includes('hours')) {
      return "School timings are scheduled to balance learning and rest. Do you want the exact hours?";
    }

    // Default reflective ELIZA-style prompts
    const prompts = [
      "Can you tell me more about that?",
      "Why do you say that?",
      "How does that affect your question?",
      "What makes you ask that?",
      "Interesting. Could you elaborate?"
    ];
    return prompts[Math.floor(Math.random() * prompts.length)];
  };

  const handleSend = () => {
    if (input.trim() === '') return;

    const userMessage = { text: input, sender: 'user' };
    setMessages(prevMessages => [...prevMessages, userMessage]);
    const currentInput = input;
    setInput('');

    // Show thinking message
    const botMessage = { text: 'Thinking...', sender: 'bot' };
    setMessages(prevMessages => [...prevMessages, botMessage]);

    // Simulate async response like API
    setTimeout(() => {
      const aiResponse = getBotResponse(currentInput);
      setMessages(prevMessages => {
        const newMessages = [...prevMessages];
        newMessages[newMessages.length - 1] = { text: aiResponse, sender: 'bot' };
        return newMessages;
      });
    }, 500); // 0.5s delay to mimic thinking
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
