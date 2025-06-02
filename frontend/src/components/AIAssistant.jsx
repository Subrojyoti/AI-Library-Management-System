import React, { useState } from 'react';
import apiClient from '../services/apiClient';

const AIAssistant = () => {
    const [question, setQuestion] = useState('');
    const [chatHistory, setChatHistory] = useState([]); // [{question, response, sql_query}]
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const result = await apiClient.post('/ai-assistant/webhook/', {
                question,
                original_question: question
            });
            setChatHistory(prev => [
                ...prev,
                {
                    question,
                    response: result.data.response,
                    sql_query: result.data.sql_query
                }
            ]);
            setQuestion('');
        } catch (err) {
            setError(err.response?.data?.detail || 'An error occurred while processing your request');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="card-classic relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gold/30 to-transparent"></div>
                <div className="p-8">
                    {/* Chat history */}
                    <div className="mb-8 max-h-[28rem] overflow-y-auto space-y-6 pr-2 custom-scrollbar">
                        {chatHistory.length === 0 && (
                            <div className="text-center py-12">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gold/40 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                </svg>
                                <p className="font-cormorant text-xl text-navy mb-2">Begin Your Inquiry</p>
                                <p className="font-source-serif text-brown-light">Pose your first question to the library's AI assistant.</p>
                            </div>
                        )}
                        
                        {chatHistory.map((item, idx) => (
                            <div key={idx} className="">
                                {/* User question with premium styling */}
                                <div className="mb-3 flex items-start">
                                    <div className="w-8 h-8 rounded-full bg-navy flex items-center justify-center text-gold font-cormorant font-bold mr-3 flex-shrink-0">
                                        Y
                                    </div>
                                    <div className="bg-cream/50 rounded-lg p-4 rounded-tl-none">
                                        <p className="font-source-serif text-brown">{item.question}</p>
                                    </div>
                                </div>
                                
                                {/* AI response with premium styling */}
                                <div className="ml-6 flex items-start">
                                    <div className="w-8 h-8 rounded-full bg-burgundy flex items-center justify-center text-gold font-cormorant font-bold mr-3 flex-shrink-0">
                                        A
                                    </div>
                                    <div className="bg-navy/5 rounded-lg p-4 rounded-tl-none">
                                        <p className="font-source-serif text-navy">{item.response}</p>
                                        {item.sql_query && (
                                            <div className="mt-3 border border-gold/20 rounded bg-cream/30 overflow-hidden">
                                                <div className="bg-navy/10 px-3 py-1 border-b border-gold/20">
                                                    <p className="text-xs font-cormorant font-semibold text-navy">SQL Query</p>
                                                </div>
                                                <pre className="p-3 text-xs font-mono text-brown overflow-x-auto">
                                                    {item.sql_query}
                                                </pre>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Input form with premium styling */}
                    <form onSubmit={handleSubmit} className="mb-6">
                        <div className="flex gap-3">
                            <input
                                type="text"
                                value={question}
                                onChange={(e) => setQuestion(e.target.value)}
                                placeholder="What would you like to know about the library?"
                                className="flex-1 px-4 py-3 bg-cream border border-gold/30 rounded-md focus:outline-none focus:ring-1 focus:ring-gold focus:border-gold transition-all duration-300 font-source-serif text-brown"
                                disabled={loading}
                            />
                            <button
                                type="submit"
                                disabled={loading || !question.trim()}
                                className="btn-secondary flex items-center disabled:opacity-50 disabled:cursor-not-allowed min-w-[100px] justify-center"
                            >
                                {loading ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Thinking
                                    </>
                                ) : (
                                    <>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                        </svg>
                                        Inquire
                                    </>
                                )}
                            </button>
                        </div>
                    </form>

                    {/* Error message with premium styling */}
                    {error && (
                        <div className="mb-6 bg-cream/50 border-l-4 border-burgundy p-4 rounded-r">
                            <div className="flex items-start">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-burgundy mr-3 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                <div>
                                    <h3 className="font-cormorant font-semibold text-lg text-navy mb-1">Query Error</h3>
                                    <p className="font-source-serif text-brown">{error}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Help section with premium styling */}
                    <div className="mt-8 pt-6 border-t border-gold/20">
                        <h3 className="font-playfair text-lg text-navy mb-4 flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-burgundy" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Suggested Inquiries
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <p className="font-cormorant font-semibold text-navy">Collection Inquiries:</p>
                                <ul className="space-y-1">
                                    <li className="flex items-start">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gold mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                                        </svg>
                                        <span className="font-source-serif text-sm text-brown">Most popular books in the library</span>
                                    </li>
                                    <li className="flex items-start">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gold mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                                        </svg>
                                        <span className="font-source-serif text-sm text-brown">Books by specific authors or categories</span>
                                    </li>
                                </ul>
                            </div>
                            <div className="space-y-2">
                                <p className="font-cormorant font-semibold text-navy">Issue Inquiries:</p>
                                <ul className="space-y-1">
                                    <li className="flex items-start">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gold mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                                        </svg>
                                        <span className="font-source-serif text-sm text-brown">Currently overdue books</span>
                                    </li>
                                    <li className="flex items-start">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gold mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                                        </svg>
                                        <span className="font-source-serif text-sm text-brown">Student borrowing patterns</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AIAssistant;