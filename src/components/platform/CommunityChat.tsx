"use client";
import React, { useState, useEffect, useRef } from "react";
import { usePlatformStore } from "@/lib/platform/store";
import { TRANSLATIONS } from "@/lib/platform/translations";
import { Send, MessageSquare, Hash, Users, MoreVertical, Smile } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type Message = {
  id: string;
  sender: string;
  avatar: string;
  text: string;
  timestamp: number;
  channel: string;
};

const CHANNELS = [
  { id: "general", name: "General", arName: "عام" },
  { id: "baloot", name: "Baloot", arName: "بلوت" },
  { id: "ludo", name: "Ludo", arName: "لودو" },
  { id: "strategy", name: "Strategy", arName: "استراتيجيات" },
];

export default function CommunityChat() {
  const { user, language } = usePlatformStore();
  const t = TRANSLATIONS[language];
  
  const [activeChannel, setActiveChannel] = useState("general");
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    // eslint-disable-next-line
    setMessages([
      { id: "1", sender: "System", avatar: "🤖", text: "Welcome to Yalla Nelab Community!", timestamp: Date.now(), channel: "general" },
      { id: "2", sender: "Ahmed", avatar: "🦁", text: "Who wants to play Baloot?", timestamp: Date.now() - 10000, channel: "baloot" },
      { id: "3", sender: "Sarah", avatar: "👸", text: "I'm in!", timestamp: Date.now() - 5000, channel: "baloot" }
    ]);
  }, []);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, activeChannel]);

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || !user) return;
    
    const msg: Message = {
      id: Date.now().toString(),
      sender: user.name,
      avatar: user.avatar,
      text: input,
      timestamp: Date.now(),
      channel: activeChannel
    };
    
    setMessages(prev => [...prev, msg]);
    setInput("");
  };

  const filteredMessages = messages.filter(m => m.channel === activeChannel);

  return (
    <div className="bg-slate-900/50 backdrop-blur-xl text-white rounded-3xl h-full flex overflow-hidden border border-slate-800 shadow-2xl">
      
      {/* Channels Sidebar */}
      <div className="w-64 bg-slate-900/80 border-r border-slate-800 flex flex-col p-4">
        <div className="flex items-center gap-2 mb-6 px-2">
          <MessageSquare className="text-indigo-500" />
          <h2 className="font-black text-lg">{t.chat}</h2>
        </div>
        
        <div className="space-y-1">
          {CHANNELS.map(channel => (
              <button 
                key={channel.id}
                onClick={() => setActiveChannel(channel.id)}
                className={`
                  w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all
                  ${activeChannel === channel.id 
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20" 
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"}
                `}
              >
                <Hash size={18} className="opacity-50" />
                {language === 'ar' ? channel.arName : channel.name}
                {activeChannel === channel.id && (
                  <span className="w-2 h-2 rounded-full bg-white ml-auto" />
                )}
              </button>
            ))}
        </div>

        <div className="mt-auto pt-4 border-t border-slate-800">
          <div className="flex items-center gap-2 text-xs text-slate-500 px-2">
            <Users size={14} />
            <span>1,234 {language === 'ar' ? "متصل" : "Online"}</span>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-slate-900/30">
        {/* Header */}
        <div className="h-16 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-900/50">
          <div className="flex items-center gap-2">
            <Hash className="text-slate-400" size={20} />
            <span className="font-bold">
              {language === 'ar' 
                ? CHANNELS.find(c => c.id === activeChannel)?.arName 
                : CHANNELS.find(c => c.id === activeChannel)?.name}
            </span>
          </div>
          <button className="text-slate-400 hover:text-white">
            <MoreVertical size={20} />
          </button>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
          <AnimatePresence initial={false}>
            {filteredMessages.map((msg) => {
              const isMe = msg.sender === user?.name;
              return (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={msg.id} 
                  className={`flex gap-3 ${isMe ? "flex-row-reverse" : ""}`}
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-lg border-2 border-slate-800 flex-shrink-0 shadow-lg">
                    {msg.avatar}
                  </div>
                  <div className={`flex flex-col ${isMe ? "items-end" : "items-start"} max-w-[70%]`}>
                    {!isMe && (
                      <span className="text-xs text-slate-400 mb-1 ml-1 font-bold">{msg.sender}</span>
                    )}
                    <div className={`
                      p-3 rounded-2xl text-sm leading-relaxed shadow-md
                      ${isMe 
                        ? "bg-indigo-600 text-white rounded-tr-none" 
                        : "bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700"}
                    `}>
                      {msg.text}
                    </div>
                    <span className="text-[10px] text-slate-600 mt-1 px-1">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Input */}
        <div className="p-4 bg-slate-900/50 border-t border-slate-800">
          <form onSubmit={handleSend} className="flex gap-2 items-center bg-slate-800 p-2 rounded-xl border border-slate-700 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 transition-all shadow-inner">
            <button type="button" className="p-2 text-slate-400 hover:text-yellow-400 transition-colors">
              <Smile size={20} />
            </button>
            <input 
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={language === 'ar' ? `اكتب رسالة في #${CHANNELS.find(c => c.id === activeChannel)?.arName}...` : `Message #${activeChannel}...`}
              className="flex-1 bg-transparent px-2 text-sm focus:outline-none text-white placeholder-slate-500"
            />
            <button 
              type="submit" 
              disabled={!input.trim()}
              className="p-2 bg-indigo-600 rounded-lg hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-white shadow-lg"
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
