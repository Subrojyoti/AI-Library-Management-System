import React from 'react';
import AIAssistant from '../components/AIAssistant';
import ResponsiveContainer from '../components/ResponsiveContainer';

const AIAssistantPage = () => {
    return (
        <div className="min-h-screen bg-cream/30 py-8">
            <ResponsiveContainer>
                {/* Header with decorative elements */}
                <div className="relative mb-10 text-center">
                    <div className="flex flex-col items-center">
                        <h1 className="text-3xl font-playfair font-bold text-navy mb-2">Library AI Assistant</h1>
                        <div className="h-1 w-32 bg-gold mb-4"></div>
                        <p className="mt-2 font-source-serif text-brown max-w-2xl">
                            Your personal guide to the library's vast collection. Inquire about books, students, and issue matters with the AI.
                        </p>
                    </div>
                    
                    {/* Decorative corner elements */}
                    <div className="absolute top-0 right-0 w-20 h-20 border-t-2 border-r-2 border-gold/20 -mt-2 -mr-2"></div>
                    <div className="absolute bottom-0 left-0 w-20 h-20 border-b-2 border-l-2 border-gold/20 -mb-2 -ml-2"></div>
                </div>
                
                <AIAssistant />
                
                {/* Decorative flourish */}
                <div className="mt-16 flex justify-center">
                    <div className="w-32 h-1 bg-gradient-to-r from-transparent via-gold/30 to-transparent"></div>
                </div>
            </ResponsiveContainer>
        </div>
    );
};

export default AIAssistantPage;