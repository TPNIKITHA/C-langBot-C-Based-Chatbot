
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, Chat } from "@google/genai";
import { Role, type Message } from './types';
import { ChatMessage } from './components/ChatMessage';

const Spinner = () => (
    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

const SendIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
    </svg>
);


export default function App() {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 'init-1',
            role: Role.BOT,
            content: 'Hello! I am **ClangBot**, your personal C language expert. How can I help you today?'
        }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const chatInstance = useRef<Chat | null>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        try {
            if (!process.env.API_KEY) {
                setError("API_KEY environment variable not set.");
                return;
            }
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            chatInstance.current = ai.chats.create({
                model: 'gemini-2.5-flash',
                config: {
                    systemInstruction: 'You are ClangBot, a friendly and helpful expert on the C programming language. Your name is ClangBot. Provide clear explanations and accurate C code examples when requested. Format all C code inside markdown code blocks starting with ```c.'
                },
            });
        } catch (e: any) {
            console.error(e);
            setError("Failed to initialize the AI model. Please check the API key.");
        }
    }, []);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSendMessage = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading || !chatInstance.current) return;
        
        const userMessage: Message = { id: Date.now().toString(), role: Role.USER, content: input };
        setMessages(prev => [...prev, userMessage]);
        const currentInput = input;
        setInput('');
        setIsLoading(true);
        setError(null);
        
        const botMessageId = (Date.now() + 1).toString();
        // Add a placeholder for the bot's response, which will show the loading indicator
        setMessages(prev => [...prev, { id: botMessageId, role: Role.BOT, content: '' }]);

        try {
            const stream = await chatInstance.current.sendMessageStream({ message: currentInput });
            
            let accumulatedContent = '';
            for await (const chunk of stream) {
                accumulatedContent += chunk.text;
                setMessages(prev =>
                    prev.map(msg =>
                        msg.id === botMessageId ? { ...msg, content: accumulatedContent } : msg
                    )
                );
            }

        } catch (e: any) {
            console.error(e);
            const errorMessage = "Sorry, I encountered an error. Please try again.";
            setError(errorMessage);
            setMessages(prev =>
                prev.map(msg =>
                    msg.id === botMessageId ? { ...msg, content: errorMessage } : msg
                )
            );
        } finally {
            setIsLoading(false);
        }
    }, [input, isLoading]);


    return (
        <div className="flex flex-col h-screen bg-gray-900">
            <header className="bg-gray-800 p-4 shadow-md z-10">
                <h1 className="text-xl font-bold text-center text-white">C Language Chatbot</h1>
            </header>

            <main ref={chatContainerRef} className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map((msg) => (
                    <ChatMessage key={msg.id} message={msg} />
                ))}
            </main>

            <footer className="bg-gray-800/50 backdrop-blur-sm p-4 border-t border-gray-700">
                {error && <p className="text-red-400 text-sm text-center mb-2">{error}</p>}
                <form onSubmit={handleSendMessage} className="max-w-3xl mx-auto flex items-center gap-3">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask about C programming..."
                        className="flex-1 bg-gray-700 border border-gray-600 rounded-full py-3 px-5 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                        disabled={isLoading}
                    />
                    <button
                        type="submit"
                        disabled={isLoading || !input.trim()}
                        className="bg-blue-600 text-white rounded-full p-3 disabled:bg-gray-600 disabled:cursor-not-allowed hover:bg-blue-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 flex items-center justify-center"
                        style={{width: '48px', height: '48px'}}
                    >
                        {isLoading ? <Spinner/> : <SendIcon />}
                    </button>
                </form>
            </footer>
             <style>{`
                .dot-flashing {
                    position: relative;
                    width: 10px;
                    height: 10px;
                    border-radius: 5px;
                    background-color: #9880ff;
                    color: #9880ff;
                    animation: dotFlashing 1s infinite linear alternate;
                    animation-delay: .5s;
                }
                .dot-flashing::before, .dot-flashing::after {
                    content: '';
                    display: inline-block;
                    position: absolute;
                    top: 0;
                }
                .dot-flashing::before {
                    left: -15px;
                    width: 10px;
                    height: 10px;
                    border-radius: 5px;
                    background-color: #9880ff;
                    color: #9880ff;
                    animation: dotFlashing 1s infinite alternate;
                    animation-delay: 0s;
                }
                .dot-flashing::after {
                    left: 15px;
                    width: 10px;
                    height: 10px;
                    border-radius: 5px;
                    background-color: #9880ff;
                    color: #9880ff;
                    animation: dotFlashing 1s infinite alternate;
                    animation-delay: 1s;
                }
                @keyframes dotFlashing {
                    0% { background-color: #60a5fa; } /* blue-400 */
                    50%, 100% { background-color: rgba(31, 41, 55, 0.5); } /* gray-800 with opacity */
                }
             `}</style>
        </div>
    );
}
