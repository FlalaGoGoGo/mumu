import { useState, useRef, useEffect } from 'react';
import { Send, MessageCircle, Sparkles, X, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { CitationChip } from './CitationChip';
import { useIsMobile } from '@/hooks/use-mobile';
import type { AskMuMuMessage } from '@/types/museumDetail';
import { findAnswer } from '@/lib/askMuMuKnowledge';
import ReactMarkdown from 'react-markdown';

const QUICK_STARTERS = [
  'What should I do with my bags?',
  'Best route for 2 hours?',
  'Is it good for kids today?',
  'Which famous works are on view?',
];

interface AskMuMuFabProps {
  museumId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialQuestion?: string | null;
  onInitialQuestionHandled?: () => void;
}

export function AskMuMuFab({ museumId, open, onOpenChange, initialQuestion, onInitialQuestionHandled }: AskMuMuFabProps) {
  const [messages, setMessages] = useState<AskMuMuMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  // Handle initial question from external trigger
  useEffect(() => {
    if (initialQuestion && open) {
      sendMessage(initialQuestion);
      onInitialQuestionHandled?.();
    }
  }, [initialQuestion, open]);

  // Focus input when panel opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [open]);

  const sendMessage = async (question: string) => {
    if (!question.trim()) return;
    const userMsg: AskMuMuMessage = { role: 'user', content: question };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);
    await new Promise(r => setTimeout(r, 400 + Math.random() * 400));
    const answer = findAnswer(question);
    setMessages(prev => [...prev, answer]);
    setIsTyping(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  // FAB button (always visible when panel is closed)
  if (!open) {
    return (
      <button
        onClick={() => onOpenChange(true)}
        className={cn(
          'fixed z-[2000] flex items-center gap-2 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 active:scale-95',
          isMobile
            ? 'bottom-20 right-4 h-12 w-12 justify-center'
            : 'bottom-6 right-6 h-12 px-5'
        )}
      >
        <MessageCircle className="w-5 h-5" />
        {!isMobile && <span className="text-sm font-medium">Ask MuMu</span>}
      </button>
    );
  }

  // Chat panel
  return (
    <div className={cn(
      'fixed z-[2000] flex flex-col bg-card border border-border shadow-2xl',
      isMobile
        ? 'inset-0 rounded-none'
        : 'bottom-6 right-6 w-[420px] h-[560px] rounded-2xl overflow-hidden'
    )}>
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-background/80 backdrop-blur flex-shrink-0">
        <MessageCircle className="w-4 h-4 text-primary" />
        <h3 className="font-display text-sm font-semibold flex-1">Ask MuMu</h3>
        <span className="text-[0.6rem] text-muted-foreground bg-secondary/60 px-2 py-0.5 rounded-full mr-2">
          AIC knowledge
        </span>
        {isMobile ? (
          <button onClick={() => onOpenChange(false)} className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-secondary transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        ) : (
          <button onClick={() => onOpenChange(false)} className="h-7 w-7 flex items-center justify-center rounded-full hover:bg-secondary transition-colors">
            <Minimize2 className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Sparkles className="w-8 h-8 text-accent/40 mb-3" />
            <p className="text-sm text-muted-foreground mb-1">Ask about visiting the Art Institute</p>
            <p className="text-xs text-muted-foreground mb-4">Bags, routes, family tips, famous works & more</p>
            <div className="flex flex-wrap gap-2 justify-center max-w-sm">
              {QUICK_STARTERS.map(q => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  className="px-3 py-1.5 text-xs rounded-full border border-border bg-background hover:bg-secondary transition-colors text-foreground"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div key={idx} className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
            <div className={cn(
              'max-w-[90%] rounded-xl px-4 py-2.5',
              msg.role === 'user'
                ? 'bg-primary text-primary-foreground rounded-br-sm'
                : 'bg-secondary/60 text-foreground rounded-bl-sm'
            )}>
              {msg.role === 'assistant' ? (
                <div className="prose prose-sm dark:prose-invert max-w-none text-sm [&>p]:mb-1.5 [&>p:last-child]:mb-0 [&>ul]:mb-1.5 [&>h2]:text-base [&>h3]:text-sm">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              ) : (
                <p className="text-sm">{msg.content}</p>
              )}

              {msg.citations && msg.citations.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {msg.citations.map(c => (
                    <CitationChip key={c.id} citation={c} compact />
                  ))}
                </div>
              )}

              {msg.quickFollowUps && msg.quickFollowUps.length > 0 && (
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {msg.quickFollowUps.map((f, i) => (
                    <button
                      key={i}
                      onClick={() => sendMessage(f.question)}
                      className="px-2.5 py-1 text-[0.65rem] rounded-full border border-border bg-background/80 hover:bg-background transition-colors text-foreground"
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-secondary/60 rounded-xl rounded-bl-sm px-4 py-3">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="border-t border-border p-3 flex gap-2 flex-shrink-0 bg-background/50">
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask about bags, routes, artworks..."
          className="flex-1 bg-background border border-input rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
        />
        <Button type="submit" size="icon" disabled={!input.trim() || isTyping} className="h-10 w-10">
          <Send className="w-4 h-4" />
        </Button>
      </form>
    </div>
  );
}
