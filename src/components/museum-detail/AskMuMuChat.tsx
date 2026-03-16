import { useState, useRef, useEffect } from 'react';
import { Send, MessageCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { CitationChip } from './CitationChip';
import type { AskMuMuMessage, Citation } from '@/types/museumDetail';
import ReactMarkdown from 'react-markdown';

const QUICK_STARTERS = [
  'What should I do with my bags?',
  'Best route for 2 hours?',
  'Is it good for kids today?',
  'Which famous works are on view?',
];

interface AskMuMuChatProps {
  museumId: string;
  sampleResponses?: Array<{
    request: { userQuestion: string };
    response: {
      answerMarkdown: string;
      citations: Citation[];
      quickFollowUps?: Array<{ label: string; question: string }>;
    };
  }>;
}

export function AskMuMuChat({ museumId, sampleResponses }: AskMuMuChatProps) {
  const [messages, setMessages] = useState<AskMuMuMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (question: string) => {
    if (!question.trim()) return;

    const userMsg: AskMuMuMessage = { role: 'user', content: question };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Check if we have a sample response for this question
    const sampleMatch = sampleResponses?.find(
      s => s.request.userQuestion.toLowerCase().includes(question.toLowerCase().slice(0, 20))
    );

    // Simulate response delay
    await new Promise(r => setTimeout(r, 800 + Math.random() * 700));

    if (sampleMatch) {
      const assistantMsg: AskMuMuMessage = {
        role: 'assistant',
        content: sampleMatch.response.answerMarkdown,
        citations: sampleMatch.response.citations,
        quickFollowUps: sampleMatch.response.quickFollowUps,
      };
      setMessages(prev => [...prev, assistantMsg]);
    } else {
      // Prototype fallback
      const fallbackMsg: AskMuMuMessage = {
        role: 'assistant',
        content: "I'm still learning about this museum! In the full version, I'll be able to answer questions about logistics, routes, artworks, and more using official museum sources. Try asking about bags, routes, or accessibility.",
        citations: [],
        quickFollowUps: [
          { label: 'What about bags?', question: 'What should I do with my bags?' },
          { label: 'Best 2-hour route', question: 'I only have about two hours and I want iconic paintings. What should I prioritize?' },
        ],
      };
      setMessages(prev => [...prev, fallbackMsg]);
    }

    setIsTyping(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <section className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center gap-2">
        <MessageCircle className="w-4 h-4 text-accent" />
        <h2 className="font-display text-lg font-semibold">Ask MuMu</h2>
        <span className="text-xs text-muted-foreground ml-auto">Prototype</span>
      </div>

      {/* Messages area */}
      <div ref={scrollRef} className="h-[320px] overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Sparkles className="w-8 h-8 text-accent/40 mb-3" />
            <p className="text-sm text-muted-foreground mb-4">
              Ask anything about visiting this museum
            </p>
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
              'max-w-[85%] rounded-xl px-4 py-2.5',
              msg.role === 'user'
                ? 'bg-primary text-primary-foreground rounded-br-sm'
                : 'bg-secondary/60 text-foreground rounded-bl-sm'
            )}>
              {msg.role === 'assistant' ? (
                <div className="prose prose-sm dark:prose-invert max-w-none text-sm [&>p]:mb-1.5 [&>p:last-child]:mb-0">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              ) : (
                <p className="text-sm">{msg.content}</p>
              )}

              {/* Citations */}
              {msg.citations && msg.citations.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {msg.citations.map(c => (
                    <CitationChip key={c.id} citation={c} compact />
                  ))}
                </div>
              )}

              {/* Quick follow-ups */}
              {msg.quickFollowUps && msg.quickFollowUps.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
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
      <form onSubmit={handleSubmit} className="border-t border-border p-3 flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask about this museum..."
          className="flex-1 bg-background border border-input rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
        />
        <Button type="submit" size="icon" disabled={!input.trim() || isTyping}>
          <Send className="w-4 h-4" />
        </Button>
      </form>
    </section>
  );
}
