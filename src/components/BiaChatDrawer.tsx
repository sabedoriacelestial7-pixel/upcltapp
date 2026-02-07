import { useState, useRef, useEffect, useCallback } from 'react';
import { X, Send, Bot, User, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { supabase } from '@/integrations/supabase/client';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/bia-chat`;

async function streamChat({
  messages,
  onDelta,
  onDone,
  onError,
}: {
  messages: Message[];
  onDelta: (text: string) => void;
  onDone: () => void;
  onError: (error: string) => void;
}) {
  try {
    // Get the current session token for authentication
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      onError('Você precisa estar logado para usar a Bia.');
      return;
    }

    const resp = await fetch(CHAT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ messages }),
    });

    if (!resp.ok) {
      const data = await resp.json().catch(() => ({}));
      onError(data.error || 'Erro ao conectar com a Bia.');
      return;
    }

    if (!resp.body) {
      onError('Erro de conexão.');
      return;
    }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let textBuffer = '';
    let streamDone = false;

    while (!streamDone) {
      const { done, value } = await reader.read();
      if (done) break;
      textBuffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
        let line = textBuffer.slice(0, newlineIndex);
        textBuffer = textBuffer.slice(newlineIndex + 1);

        if (line.endsWith('\r')) line = line.slice(0, -1);
        if (line.startsWith(':') || line.trim() === '') continue;
        if (!line.startsWith('data: ')) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === '[DONE]') {
          streamDone = true;
          break;
        }

        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) onDelta(content);
        } catch {
          textBuffer = line + '\n' + textBuffer;
          break;
        }
      }
    }

    // Final flush
    if (textBuffer.trim()) {
      for (let raw of textBuffer.split('\n')) {
        if (!raw) continue;
        if (raw.endsWith('\r')) raw = raw.slice(0, -1);
        if (raw.startsWith(':') || raw.trim() === '') continue;
        if (!raw.startsWith('data: ')) continue;
        const jsonStr = raw.slice(6).trim();
        if (jsonStr === '[DONE]') continue;
        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) onDelta(content);
        } catch { /* ignore */ }
      }
    }

    onDone();
  } catch (e) {
    console.error('Stream error:', e);
    onError('Erro de conexão. Tente novamente.');
  }
}

interface BiaChatDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function BiaChatDrawer({ open, onClose }: BiaChatDrawerProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [open]);

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userMsg: Message = { role: 'user', content: trimmed };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    let assistantSoFar = '';

    const upsertAssistant = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === 'assistant') {
          return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
        }
        return [...prev, { role: 'assistant', content: assistantSoFar }];
      });
    };

    await streamChat({
      messages: newMessages,
      onDelta: (chunk) => upsertAssistant(chunk),
      onDone: () => setIsLoading(false),
      onError: (error) => {
        setMessages(prev => [...prev, { role: 'assistant', content: `❌ ${error}` }]);
        setIsLoading(false);
      },
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 z-50 flex flex-col bg-background rounded-t-2xl shadow-2xl"
            style={{ height: '85vh', maxHeight: '85vh' }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-2 pb-1">
              <div className="w-10 h-1 bg-muted-foreground/30 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot size={22} className="text-primary" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-foreground">Bia</h2>
                  <p className="text-xs text-muted-foreground">Atendente Virtual • Up CLT</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-muted transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label="Fechar chat"
              >
                <X size={22} className="text-muted-foreground" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center gap-4 py-10">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <Bot size={32} className="text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-1">Olá! Eu sou a Bia 👋</h3>
                    <p className="text-sm text-muted-foreground max-w-[260px]">
                      Atendente virtual da Up CLT. Como posso te ajudar hoje?
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 justify-center max-w-xs">
                    {[
                      'Como funciona o consignado CLT?',
                      'Quais as taxas?',
                      'Como consultar minha margem?',
                    ].map((suggestion) => (
                      <button
                        key={suggestion}
                        onClick={() => {
                          const userMsg: Message = { role: 'user', content: suggestion };
                          setMessages([userMsg]);
                          setIsLoading(true);
                          let assistantSoFar = '';
                          streamChat({
                            messages: [userMsg],
                            onDelta: (chunk) => {
                              assistantSoFar += chunk;
                              setMessages(prev => {
                                const last = prev[prev.length - 1];
                                if (last?.role === 'assistant') {
                                  return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
                                }
                                return [...prev, { role: 'assistant', content: assistantSoFar }];
                              });
                            },
                            onDone: () => setIsLoading(false),
                            onError: (error) => {
                              setMessages(prev => [...prev, { role: 'assistant', content: `❌ ${error}` }]);
                              setIsLoading(false);
                            },
                          });
                        }}
                        className="px-3 py-2 text-xs rounded-full border border-primary/20 text-primary bg-primary/5 hover:bg-primary/10 transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={cn(
                    'flex gap-2',
                    msg.role === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex-shrink-0 flex items-center justify-center mt-1">
                      <Bot size={16} className="text-primary" />
                    </div>
                  )}
                  <div
                    className={cn(
                      'max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground rounded-br-md'
                        : 'bg-muted text-foreground rounded-bl-md'
                    )}
                  >
                    {msg.role === 'assistant' ? (
                      <div className="prose prose-sm prose-emerald max-w-none [&>p]:m-0 [&>ul]:my-1 [&>ol]:my-1">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    ) : (
                      msg.content
                    )}
                  </div>
                  {msg.role === 'user' && (
                    <div className="w-7 h-7 rounded-full bg-primary flex-shrink-0 flex items-center justify-center mt-1">
                      <User size={14} className="text-primary-foreground" />
                    </div>
                  )}
                </div>
              ))}

              {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
                <div className="flex gap-2 items-start">
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex-shrink-0 flex items-center justify-center">
                    <Bot size={16} className="text-primary" />
                  </div>
                  <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
                    <Loader2 size={18} className="animate-spin text-muted-foreground" />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-border px-4 py-3 pb-[calc(env(safe-area-inset-bottom)+12px)]">
              <div className="flex items-center gap-2 bg-muted rounded-full px-4 py-1">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Digite sua mensagem..."
                  className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground py-2.5 outline-none"
                  disabled={isLoading}
                  style={{ fontSize: '16px' }}
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || isLoading}
                  className={cn(
                    'p-2 rounded-full transition-all min-w-[40px] min-h-[40px] flex items-center justify-center',
                    input.trim() && !isLoading
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground'
                  )}
                  aria-label="Enviar mensagem"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
