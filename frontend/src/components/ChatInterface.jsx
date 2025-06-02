import React, { useState, useEffect, useRef } from 'react';
import apiClient from '../services/apiClient'; // Assuming backend API base URL is configured here

function ChatInterface() {
  const [messages, setMessages] = useState([
    { sender: 'ai', text: 'Hello! How can I assist you with the library today?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleInputChange = (e) => {
    setInput(e.target.value);
  };

  const formatAIResponse = (responseData) => {
    // Check if there's an error
    if (responseData.error) {
      return responseData.error;
    }

    // Check if intent is UNKNOWN
    if (responseData.intent === "UNKNOWN") {
      return responseData.explanation || "I don't understand that query. Could you try asking in a different way?";
    }

    // Format data based on intent and explanation
    if (responseData.explanation) {
      return responseData.explanation;
    }

    // Handle numeric responses (like count of new books)
    if (typeof responseData.data === 'number') {
      return `The result is: ${responseData.data}`;
    }

    // Format data based on intent
    if (responseData.data) {
      if (Array.isArray(responseData.data)) {
        if (responseData.data.length === 0) {
          return "No results found for your query.";
        }
        
        // If data contains an error message
        if (responseData.data[0]?.error) {
          return responseData.data[0].error;
        }

        // Format array data
        return `Here's what I found:\n\n${responseData.data.map((item, index) => {
          // Format based on what fields are available
          if (item.title) {
            return `${index + 1}. "${item.title}" by ${item.author || 'Unknown'} (${item.available_copies || 0} copies available)`;
          } else if (item.book_title) {
            return `${index + 1}. "${item.book_title}" - Due: ${item.due_date || 'Not set'}${item.is_overdue ? ' (OVERDUE)' : ''}`;
          } else {
            return `${index + 1}. ${JSON.stringify(item)}`;
          }
        }).join('\n')}`;
      } else if (typeof responseData.data === 'object') {
        // If data contains an error message
        if (responseData.data.error) {
          return responseData.data.error;
        }

        // Format object data based on common fields
        if (responseData.data.title) {
          return `Book: "${responseData.data.title}" by ${responseData.data.author || 'Unknown'}\nAvailable: ${responseData.data.available_copies || 0} of ${responseData.data.total_quantity || 0} copies`;
        } else if (responseData.data.name) {
          return `Student: ${responseData.data.name}\nEmail: ${responseData.data.email || 'N/A'}\nPhone: ${responseData.data.phone_number || 'N/A'}`;
        } else {
          // Generic object formatting
          return Object.entries(responseData.data)
            .map(([key, value]) => `${key}: ${value}`)
            .join('\n');
        }
      }
    }

    // Default response if we can't format the data
    return responseData.explanation || "I processed your query, but I'm not sure how to display the results.";
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { sender: 'user', text: input };
    setMessages(prevMessages => [...prevMessages, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Adjust API endpoint as per your backend (add trailing slash)
      const response = await apiClient.post('/ai-assistant/webhook/', { question: input });
      
      // Format the AI response based on the data structure
      const aiResponseText = formatAIResponse(response.data);
      const aiMessage = { sender: 'ai', text: aiResponseText };
      setMessages(prevMessages => [...prevMessages, aiMessage]);

    } catch (error) {
      console.error("Error sending message to AI:", error);
      const errorMessage = { sender: 'ai', text: error.response?.data?.detail || 'Sorry, an error occurred while contacting the AI.' };
      setMessages(prevMessages => [...prevMessages, errorMessage]);
    } finally {
      setIsLoading(false); // Ensure this is called for non-streaming too
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-150px)] max-w-2xl mx-auto bg-white shadow-xl rounded-lg">
      <div className="p-4 border-b">
        <h2 className="text-xl font-semibold">AI Library Assistant</h2>
      </div>
      <div className="flex-grow p-4 space-y-4 overflow-y-auto bg-gray-50">
        {messages.map((msg, index) => (
          <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div 
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg shadow ${ 
                msg.sender === 'user' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 text-gray-800'
              }`}
            >
              {msg.text.split('\n').map((line, i) => (
                <React.Fragment key={i}>
                  {line}
                  {i < msg.text.split('\n').length - 1 && <br />}
                </React.Fragment>
              ))}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="max-w-xs lg:max-w-md px-4 py-2 rounded-lg shadow bg-gray-200 text-gray-800 italic">
              AI is thinking...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSendMessage} className="p-4 border-t flex">
        <input 
          type="text" 
          value={input} 
          onChange={handleInputChange} 
          placeholder="Ask about books, authors, or library stats..." 
          className="flex-grow px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          disabled={isLoading}
        />
        <button 
          type="submit" 
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-r-md focus:outline-none focus:shadow-outline disabled:bg-gray-400"
          disabled={isLoading || !input.trim()}
        >
          Send
        </button>
      </form>
    </div>
  );
}

export default ChatInterface; 