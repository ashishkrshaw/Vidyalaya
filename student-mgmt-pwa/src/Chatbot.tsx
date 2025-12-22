import { useState, useEffect, useRef } from 'react';
import { getAdmissions, loadFeeMap } from './db';
import './Chatbot.css';

// ========================================
// 🔧 CONFIGURE YOUR AWS LAMBDA URL HERE
// ========================================
// After deploying your Lambda function with API Gateway,
// replace this URL with your actual API Gateway invoke URL
// Example: 'https://abc123.execute-api.us-east-1.amazonaws.com/chat'
const LAMBDA_API_URL = import.meta.env.VITE_API_BOT || ''; // Set VITE_API_BOT in .env

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ text: string; sender: string }[]>([]);
  const [input, setInput] = useState('');
  const [context, setContext] = useState({ lastTopic: '', userPreferences: [] as string[] });
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages]);

  useEffect(() => {
    // Listen for navigation events from parent App component
    const handleNavigationEvent = (event: CustomEvent) => {
      const section = event.detail;
      // Trigger navigation in parent component
      window.dispatchEvent(new CustomEvent('chatbot-navigate', { detail: section }));
    };

    window.addEventListener('navigate-to-section', handleNavigationEvent as EventListener);
    return () => {
      window.removeEventListener('navigate-to-section', handleNavigationEvent as EventListener);
    };
  }, []);

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  // Fetch school context for Lambda
  const getSchoolContext = async () => {
    try {
      const students = await getAdmissions();
      const feeMap = await loadFeeMap();

      let totalFee = 0;
      let totalDues = 0;

      // Build student details with fee info
      const studentDetails = students.map((student: any) => {
        const classFee = Number(feeMap[student.class]) || 0;
        const paidTotal = (student.feeHistory || []).reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0);
        const annualFee = classFee * 12;
        const dues = Math.max(0, annualFee - paidTotal);

        totalFee += paidTotal;
        totalDues += dues;

        return {
          studentId: student.studentId,
          name: student.name,
          class: student.class,
          section: student.section,
          rollNo: student.rollNo,
          dob: student.dob,
          fatherName: student.fatherName,
          motherName: student.motherName,
          fatherMobile: student.fatherMobile || student.parentMobile,
          address: student.address,
          paidTotal,
          dues,
        };
      });

      return {
        schoolId: localStorage.getItem('schoolId') || 'default',
        schoolName: localStorage.getItem('schoolName') || 'My School',
        totalStudents: students.length,
        totalFeeCollected: totalFee,
        pendingDues: totalDues,
        classesAvailable: ['Nursery', 'KG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
        sections: ['A', 'B', 'C'],
        students: studentDetails  // All student details for queries
      };
    } catch (e) {
      return {
        schoolId: localStorage.getItem('schoolId') || 'default',
        schoolName: localStorage.getItem('schoolName') || 'My School',
        totalStudents: 0,
        totalFeeCollected: 0,
        pendingDues: 0,
        students: []
      };
    }
  };

  // Call AWS Lambda API
  const callLambdaAPI = async (userInput: string) => {
    if (!LAMBDA_API_URL) return null;

    try {
      const schoolContext = await getSchoolContext();

      const response = await fetch(LAMBDA_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: userInput, schoolContext })
      });

      if (!response.ok) throw new Error('Lambda API error');

      const data = await response.json();
      return data.response || null;
    } catch (error) {
      console.error('Lambda API error:', error);
      return null;
    }
  };

  // Enhanced bot response logic with context understanding
  const getBotResponse = async (userInput: string): Promise<string> => {
    const input = userInput.toLowerCase().trim();

    // Try Lambda API first if configured
    if (LAMBDA_API_URL) {
      setIsLoading(true);
      const lambdaResponse = await callLambdaAPI(userInput);
      setIsLoading(false);

      if (lambdaResponse) {
        return lambdaResponse;
      } else {
        return "⚠️ Error: Could not reach the AI server. Please check your connection or API configuration.";
      }
    }

    // Update context based on user input
    let newContext = { ...context };

    // Greetings with contextual responses
    if (/^(hi|hello|hey|good morning|good afternoon|good evening)/i.test(input)) {
      const greetings = [
        "👋 Hello! Welcome to the School Management System. How can I assist you today?",
        "🤖 Hi there! I'm here to help you manage students, fees, and more. What would you like to do?",
        "😊 Good to see you! I can help you navigate through student records, fee management, and settings.",
        "👍 Hello! Ready to help with any school management tasks. Just ask!"
      ];
      newContext.lastTopic = 'greeting';
      setContext(newContext);
      return greetings[Math.floor(Math.random() * greetings.length)];
    }

    // Contextual follow-ups
    if (/^(yes|yeah|ok|okay|sure|continue)/i.test(input) && context.lastTopic) {
      switch (context.lastTopic) {
        case 'add-student':
          document.getElementById('menu-add-student')?.click();
          return '📝 Perfect! Opening the Add Student form. You can enter student details, upload photo, and assign class.';
        case 'find-student':
          document.getElementById('menu-show-student')?.click();
          return '🔍 Great! Opening student search. You can search by ID, name, or filter by class.';
        case 'fee-management':
          document.getElementById('menu-fee-management')?.click();
          return '💰 Excellent! Opening Fee Management. You can collect fees, view payment history, and generate receipts.';
      }
    }

    // Student Management with proper navigation
    if (/add.*student|new.*student|register.*student|enroll|admission|admit/i.test(input)) {
      window.dispatchEvent(new CustomEvent('chatbot-navigate', { detail: 'student' }));
      newContext.lastTopic = 'add-student';
      setContext(newContext);
      return '📝 Opening New Admission section...\n\n✨ Here you can:\n• Fill student admission form\n• Upload student photo\n• Assign class and section\n• Set student ID\n• Add parent/guardian details\n\nThe form will guide you through each step!';
    }

    if (/find.*student|search.*student|show.*student|view.*student|locate.*student|display.*student/i.test(input)) {
      window.dispatchEvent(new CustomEvent('chatbot-navigate', { detail: 'show' }));
      newContext.lastTopic = 'find-student';
      setContext(newContext);
      return '🔍 Opening Show Student section...\n\n🎯 Search options:\n• Student ID lookup\n• Name-based search\n• Class/section filter\n• Advanced filters\n• Export student data\n\nTry different search methods to find exactly what you need!';
    }

    // Fee Management
    if (/fee|payment|money|collect|receipt|due|pending|pay|charge|bill/i.test(input)) {
      window.dispatchEvent(new CustomEvent('chatbot-navigate', { detail: 'fee' }));
      newContext.lastTopic = 'fee-management';
      setContext(newContext);
      return '💰 Opening Fee Management section...\n\n💡 Available features:\n• Collect student fees\n• View payment history\n• Generate receipts\n• Track pending payments\n• Fee reports\n• Payment reminders\n\nSelect a student to start fee collection!';
    }

    // ID Card Management
    if (/id.*card|card|generate.*id|print.*card|student.*card/i.test(input)) {
      window.dispatchEvent(new CustomEvent('chatbot-navigate', { detail: 'idcard' }));
      newContext.lastTopic = 'id-card';
      setContext(newContext);
      return '🆔 Opening Student ID Card section...\n\n📋 Card features:\n• Professional student ID design\n• QR code with student data\n• Printable format\n• Bulk generation\n• Custom school branding\n\nSelect students to generate their ID cards!';
    }

    // Statistics and Reports
    if (/stats|statistics|report|data|analytics|numbers|dashboard/i.test(input)) {
      window.dispatchEvent(new CustomEvent('chatbot-navigate', { detail: 'stats' }));
      newContext.lastTopic = 'statistics';
      setContext(newContext);
      return '📊 Opening Statistics section...\n\n📈 Available reports:\n• Total student count\n• Class-wise breakdown\n• Fee collection summary\n• Monthly enrollment trends\n• Payment analytics\n\nReal-time data from your database!';
    }

    // Settings and Configuration
    if (/settings|config|setup|academic.*settings|promote|configuration/i.test(input)) {
      window.dispatchEvent(new CustomEvent('chatbot-navigate', { detail: 'settings' }));
      newContext.lastTopic = 'settings';
      setContext(newContext);
      return '⚙️ Opening Settings section...\n\n🔧 Configuration options:\n• Class management\n• Promotion dates\n• Academic year setup\n• Fee structure\n• School details\n• System preferences\n\nCustomize your school management system!';
    }

    // History and Updates
    if (/history|update.*student|edit.*student|modify|delete|remove|change/i.test(input)) {
      window.dispatchEvent(new CustomEvent('chatbot-navigate', { detail: 'history' }));
      newContext.lastTopic = 'history';
      setContext(newContext);
      return '📋 Opening History section...\n\n✏️ Available actions:\n• Update student information\n• Edit academic records\n• Delete student records\n• View modification history\n• Bulk operations\n• Data backup\n\nBe careful with edit operations!';
    }

    // Update/Delete specific section
    if (/update.*delete|modify.*remove|edit.*remove|change.*delete/i.test(input)) {
      window.dispatchEvent(new CustomEvent('chatbot-navigate', { detail: 'updateDelete' }));
      newContext.lastTopic = 'update-delete';
      setContext(newContext);
      return '✏️ Opening Update/Delete Student section...\n\n🔧 Available operations:\n• Update student details\n• Delete student records\n• Batch operations\n• Data validation\n• Backup before changes\n\nAlways backup before making changes!';
    }

    // Enhanced conversational understanding
    // Question patterns
    if (/^(what|how|where|when|why|can|could|would|should|do you|will you|is it|are there)/i.test(input)) {
      if (/what.*this|what.*app|what.*system|what.*do/i.test(input)) {
        return '🎓 This is a **School Management System** that helps you:\n\n📚 **Manage Students:**\n• Register new admissions\n• Search and view student records\n• Update student information\n\n💰 **Handle Finances:**\n• Collect fees and payments\n• Generate receipts\n• Track payment history\n\n📊 **Generate Reports:**\n• View school statistics\n• Export student data\n• Monitor academic performance\n\n🆔 **Create ID Cards:**\n• Professional student ID cards\n• QR codes for verification\n\nTry saying "add student" or "show statistics" to get started!';
      }

      if (/how.*add|how.*register|how.*enroll/i.test(input)) {
        window.dispatchEvent(new CustomEvent('chatbot-navigate', { detail: 'student' }));
        return '📝 **To add a new student:**\n\n1️⃣ Fill out the admission form\n2️⃣ Upload student photo (optional)\n3️⃣ Select class and section\n4️⃣ Add parent/guardian details\n5️⃣ Review and confirm\n\n✨ The system automatically generates:\n• Student ID number\n• Roll number\n• Admission date\n\nOpening the admission form for you now!';
      }

      if (/how.*search|how.*find|where.*student/i.test(input)) {
        window.dispatchEvent(new CustomEvent('chatbot-navigate', { detail: 'show' }));
        return '� **To find students:**\n\n🎯 **Search Methods:**\n• Student ID (exact match)\n• Name (partial search works)\n• Class/section filter\n• Roll number lookup\n\n📋 **Search Tips:**\n• Use partial names for broad results\n• Filter by class for specific groups\n• Export results for offline use\n\nOpening student search now!';
      }

      if (/how.*pay|how.*fee|where.*payment/i.test(input)) {
        window.dispatchEvent(new CustomEvent('chatbot-navigate', { detail: 'fee' }));
        return '💰 **To collect fees:**\n\n💳 **Payment Process:**\n1️⃣ Search for student\n2️⃣ Select fee type\n3️⃣ Enter amount\n4️⃣ Choose payment method\n5️⃣ Generate receipt\n\n📊 **Features:**\n• Track pending payments\n• View payment history\n• Print receipts\n• Send payment reminders\n\nOpening fee management now!';
      }

      if (/can.*help|will you help|what.*can.*do/i.test(input)) {
        return '🤖 **Absolutely! I can help you with:**\n\n📝 **Student Management:**\n• "Add new student" - Register admissions\n• "Find student records" - Search database\n• "Update student info" - Modify records\n\n💰 **Financial Operations:**\n• "Collect fees" - Process payments\n• "View payment history" - Check records\n• "Generate receipts" - Print documents\n\n📊 **Reports & Analytics:**\n• "Show statistics" - View school data\n• "Generate ID cards" - Create student cards\n• "Export data" - Download records\n\n**Just tell me what you want to do in plain English!**';
      }
    }

    // Natural conversation starters
    if (/^(i want|i need|i would like|let me|show me|take me|go to)/i.test(input)) {
      if (/want.*add|want.*register|need.*add/i.test(input)) {
        window.dispatchEvent(new CustomEvent('chatbot-navigate', { detail: 'student' }));
        return '📝 Perfect! Taking you to add a new student. Fill out the form with student details and I\'ll help you through the process!';
      }

      if (/want.*find|want.*search|need.*find|show me.*student/i.test(input)) {
        window.dispatchEvent(new CustomEvent('chatbot-navigate', { detail: 'show' }));
        return '🔍 Great! Opening student search. You can look up students by name, ID, or class. What are you looking for?';
      }

      if (/want.*fee|need.*payment|want.*collect/i.test(input)) {
        window.dispatchEvent(new CustomEvent('chatbot-navigate', { detail: 'fee' }));
        return '💰 Excellent! Opening fee management. You can collect payments, view history, and generate receipts here.';
      }

      if (/show me.*stats|want.*report|need.*data/i.test(input)) {
        window.dispatchEvent(new CustomEvent('chatbot-navigate', { detail: 'stats' }));
        return '📊 Coming right up! Here are your school statistics with real-time data from your database.';
      }
    }

    // Problems and troubleshooting
    if (/problem|issue|error|not working|broken|trouble|help me/i.test(input)) {
      return '🔧 **Having trouble? I can help!**\n\n❓ **Common Issues:**\n• **Can\'t find student?** Try partial name search\n• **Payment not recording?** Check internet connection\n• **ID card not generating?** Ensure photo is uploaded\n• **Data not saving?** Refresh and try again\n\n💡 **Quick Solutions:**\n• Use the search filters for better results\n• Check all required fields are filled\n• Try refreshing the page\n• Export data regularly for backup\n\n**Tell me specifically what\'s not working and I\'ll guide you through it!**';
    }

    // Help and Instructions
    if (/help|how.*work|what.*do|guide|tutorial|instructions|explain/i.test(input)) {
      newContext.lastTopic = 'help';
      setContext(newContext);
      return '📚 **School Management System Guide**\n\n🎯 **Quick Start:**\n• Click icons in the top menu to navigate\n• Start with "New Admission" for enrollments\n• Use "Show Student" to search records\n• "Fee Management" for payments\n• "Statistics" for reports\n\n💡 **Pro Tips:**\n• Export data regularly for backup\n• Generate ID cards in bulk to save time\n• Use filters to find students quickly\n• Set up academic calendar in settings\n\n**Need specific help? Just ask! For example:**\n"How do I add a student?" or "Where do I collect fees?"';
    }

    // Appreciation responses
    if (/thank|thanks|appreciate|good.*job|well.*done/i.test(input)) {
      const thanks = [
        "😊 You're very welcome! Happy to help manage your school efficiently!",
        "🙏 My pleasure! Feel free to ask if you need anything else.",
        "✨ Glad I could assist! I'm here whenever you need help with school management.",
        "👍 Always happy to help! Let me know if you have more questions."
      ];
      return thanks[Math.floor(Math.random() * thanks.length)];
    }

    // Goodbye responses
    if (/bye|goodbye|see.*you|talk.*later|exit/i.test(input)) {
      const goodbyes = [
        "👋 Goodbye! Have a great day managing your school!",
        "🌟 See you later! I'll be here when you need assistance.",
        "✨ Take care! Come back anytime for school management help.",
        "👍 Bye for now! Keep up the great work with your students!"
      ];
      return goodbyes[Math.floor(Math.random() * goodbyes.length)];
    }

    // Context-aware suggestions based on current topic
    if (context.lastTopic) {
      const suggestions = {
        'add-student': '📝 Still working on adding students? You can also search existing students or manage fees.',
        'find-student': '🔍 Need to do something with the student you found? Try fee collection or ID card generation.',
        'fee-management': '💰 After collecting fees, you might want to generate receipts or view statistics.',
        'statistics': '📊 Want to dive deeper? Check individual student records or update academic settings.'
      };

      if (suggestions[context.lastTopic as keyof typeof suggestions]) {
        return suggestions[context.lastTopic as keyof typeof suggestions];
      }
    }

    // Handle incomplete or unclear requests
    if (/student|pupils|kids|children/i.test(input) && !/add|find|search|show|update|delete/.test(input)) {
      return '👥 **Student-related task?** I can help you:\n\n📝 **Add Students:** "Add new student" or "Register admission"\n🔍 **Find Students:** "Show student records" or "Search by name"\n✏️ **Update Students:** "Update student info" or "Edit records"\n🆔 **ID Cards:** "Generate ID cards" or "Print student cards"\n\n**What would you like to do with students?**';
    }

    if (/fee|money|payment|cash/i.test(input) && !/collect|pay|manage|show/.test(input)) {
      return '💰 **Fee-related task?** I can help you:\n\n💳 **Collect Fees:** "Collect student fees" or "Process payments"\n📊 **View History:** "Show payment history" or "Fee reports"\n� **Receipts:** "Generate receipts" or "Print payment slips"\n📈 **Analytics:** "Fee statistics" or "Payment trends"\n\n**What do you need to do with fees?**';
    }

    // Casual conversation responses
    const casualResponses = [
      '🤖 I\'m here to help with your school management! Try asking about students, fees, or reports.',
      '😊 Not sure what you need? You can say things like "add student", "collect fees", or "show statistics".',
      '👍 I understand school management tasks best. Try: "find a student" or "generate ID cards".',
      '🎓 I\'m your school assistant! Ask me about admissions, payments, or student records.',
    ];

    // Default comprehensive response with better English understanding
    return casualResponses[Math.floor(Math.random() * casualResponses.length)] + '\n\n📚 **I can help you with:**\n\n📝 **Student Management:**\n• "Add new student" - Register admissions\n• "Find student records" - Search database\n• "Update student info" - Modify records\n\n💰 **Fee Management:**\n• "Collect fees" - Process payments\n• "Show payment history" - View records\n• "Generate receipts" - Print documents\n\n📊 **Reports & Analytics:**\n• "Show statistics" - School data overview\n• "Generate ID cards" - Create student cards\n• "Export data" - Download records\n\n⚙️ **System Settings:**\n• "Open settings" - Configure system\n• "Academic settings" - Manage classes\n\n**Just tell me what you want to do in plain English!**';
  };

  const handleSend = async (text: string = input) => {
    if (text.trim() === '') return;

    const userMessage = { text, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
    setInput('');

    const botReply = await getBotResponse(text);
    setMessages(prev => [...prev, { text: botReply, sender: 'bot' }]);
  };

  // Enhanced default prompts with better context
  const defaultPrompts = [
    "📝 Add a new student",
    "🔍 Search student records",
    "💰 Collect student fees",
    "🆔 Generate ID cards",
    "📊 View school statistics",
    "⚙️ Open system settings",
    "📋 Update student info",
    "❓ How does this work?",
  ];

  return (
    <div className="chatbot-container">
      <div className={`chatbot-icon ${isOpen ? 'open' : ''}`} onClick={toggleChat}>
        {isOpen ? '✕' : '💬'}
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
                <div className="welcome-message">
                  <h4>🎓 School Management Assistant</h4>
                  <p>Choose a quick action or type your question:</p>
                </div>
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