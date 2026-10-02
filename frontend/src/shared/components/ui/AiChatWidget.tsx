"use client";

import React, { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Bot, User } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { apiClient } from "@/services/api/client";

type Message = {
  role: "user" | "bot";
  content: string;
};

export const AiChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "bot", content: "Bonjour ! Je suis votre assistant virtuel. Comment puis-je vous aider aujourd'hui avec votre maintenance ?" }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMsg = inputValue.trim();
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setInputValue("");
    setIsLoading(true);

    try {
      const response = await apiClient.post("/api/v1/maintenance/ai-chat/", { message: userMsg });
      if (response.data && response.data.reply) {
        setMessages(prev => [...prev, { role: "bot", content: response.data.reply }]);
      } else {
        setMessages(prev => [...prev, { role: "bot", content: "Désolé, je n'ai pas pu générer une réponse." }]);
      }
    } catch (error) {
      console.error("Erreur de chat:", error);
      setMessages(prev => [...prev, { role: "bot", content: "Erreur de connexion au serveur d'IA." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="h-14 w-14 rounded-full bg-brand-green hover:bg-brand-green-hover shadow-xl flex items-center justify-center transition-transform hover:scale-105"
        >
          <MessageCircle className="h-6 w-6 text-white" />
        </Button>
      )}

      {isOpen && (
        <Card className="w-[350px] sm:w-[400px] h-[500px] flex flex-col shadow-2xl border-slate-200">
          <CardHeader className="bg-brand-green text-white rounded-t-xl px-4 py-3 flex flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              <CardTitle className="text-base font-medium">Assistant Maintenance</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20 h-8 w-8 rounded-full"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex items-start gap-2 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
              >
                <div className={`shrink-0 rounded-full h-8 w-8 flex items-center justify-center ${
                  msg.role === "user" ? "bg-slate-200" : "bg-brand-green-light text-brand-green"
                }`}>
                  {msg.role === "user" ? <User className="h-4 w-4 text-slate-600" /> : <Bot className="h-4 w-4" />}
                </div>
                <div
                  className={`px-3 py-2 rounded-2xl max-w-[75%] text-sm ${
                    msg.role === "user"
                      ? "bg-brand-green text-white rounded-tr-none"
                      : "bg-white border border-slate-200 text-slate-800 rounded-tl-none shadow-sm"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex items-start gap-2">
                <div className="shrink-0 rounded-full h-8 w-8 bg-brand-green-light flex items-center justify-center">
                  <Bot className="h-4 w-4 text-brand-green" />
                </div>
                <div className="px-4 py-3 rounded-2xl bg-white border border-slate-200 rounded-tl-none shadow-sm flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </CardContent>
          
          <CardFooter className="p-3 bg-white border-t border-slate-100 rounded-b-xl">
            <div className="flex w-full items-center gap-2">
              <Input
                placeholder="Posez votre question..."
                className="flex-1 rounded-full bg-slate-50 border-slate-200 focus-visible:ring-brand-green"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
              />
              <Button
                size="icon"
                className="rounded-full shrink-0 bg-brand-green hover:bg-brand-green-hover h-10 w-10"
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isLoading}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardFooter>
        </Card>
      )}
    </div>
  );
};
