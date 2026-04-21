"use client";

import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const PROVIDERS = [
  { id: "groq", label: "Llama 3.3 70B", subtitle: "Groq" },
  { id: "openai", label: "GPT-4o mini", subtitle: "OpenAI" },
  { id: "gemini", label: "Gemini 1.5 Flash", subtitle: "Google" },
];

const SUGGESTED = [
  "What is CPT and how do I get authorized?",
  "Can I work off-campus on F1 status?",
  "How does the OPT 90-day unemployment rule work?",
  "What happens to my visa if I lose my H1B job?",
];

const mdStyles = "text-white/85 [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-4 [&_ul]:mb-3 [&_ol]:list-decimal [&_ol]:pl-4 [&_ol]:mb-3 [&_li]:mb-1 [&_strong]:font-semibold [&_strong]:text-white [&_h1]:text-lg [&_h1]:font-semibold [&_h2]:font-semibold [&_h3]:font-semibold";

interface Message {
  role: "user" | "assistant";
  content: string;
  provider?: string;
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  timestamp: number;
}

function SkeletonLoader() {
  return (
    <div className="flex gap-3">
      <img src="/logo.png" alt="V" className="w-7 h-7 rounded-full object-cover flex-shrink-0 mt-0.5" />
      <div className="flex flex-col gap-2 pt-1 w-full max-w-md">
        <div className="h-3 bg-white/10 rounded-full w-3/4 animate-pulse" />
        <div className="h-3 bg-white/10 rounded-full w-full animate-pulse" />
        <div className="h-3 bg-white/10 rounded-full w-2/3 animate-pulse" />
      </div>
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={copy}
      className="text-white/30 hover:text-white/70 flex items-center gap-1 text-xs mt-1 ml-1 transition-all"
    >
      {copied ? (
        <>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Copied
        </>
      ) : (
        <>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <rect x="9" y="9" width="13" height="13" rx="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
          Copy
        </>
      )}
    </button>
  );
}

function AboutModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4"
      onClick={onClose}
    >
      <div
        className="bg-[#111] border border-white/10 rounded-2xl p-8 max-w-lg w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="VisAssistance" className="w-9 h-9 rounded-xl object-cover" />
            <div>
              <h2 className="text-base font-semibold">VisAssistance</h2>
              <p className="text-xs text-white/40">AI-powered visa guidance</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white/70 transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className="flex flex-col gap-4 text-sm text-white/60 leading-relaxed">
          <p>VisAssistance is an AI-powered assistant that answers questions about US student and work visas — F1, OPT, CPT, and H1B — using large language models from Groq, OpenAI, and Google.</p>
          <p>Switch between models in real time to compare responses from Llama 3.3 70B, GPT-4o mini, and Gemini 1.5 Flash.</p>
          <div className="border border-white/8 rounded-xl p-4">
            <p className="text-yellow-400/80 text-xs font-medium mb-1">Disclaimer</p>
            <p className="text-xs text-white/40">
              VisAssistance provides general information only and is not legal advice. Always verify with your DSO or a licensed immigration attorney.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            <span className="text-xs text-white/20 border border-white/8 rounded-lg px-3 py-1.5">Powered by Groq</span>
            <span className="text-xs text-white/20 border border-white/8 rounded-lg px-3 py-1.5">OpenAI</span>
            <span className="text-xs text-white/20 border border-white/8 rounded-lg px-3 py-1.5">Google Gemini</span>
            <span className="text-xs text-white/20 border border-white/8 rounded-lg px-3 py-1.5">FastAPI</span>
            <span className="text-xs text-white/20 border border-white/8 rounded-lg px-3 py-1.5">Next.js</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [provider, setProvider] = useState("groq");
  const [loading, setLoading] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem("visassistance_sessions");
    if (saved) setSessions(JSON.parse(saved));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem("visassistance_sessions", JSON.stringify(sessions));
  }, [sessions, hydrated]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 160) + "px";
  };

  const newChat = () => {
    setCurrentId(null);
    setMessages([]);
    setInput("");
  };

  const loadSession = (session: ChatSession) => {
    setCurrentId(session.id);
    setMessages(session.messages);
  };

  const deleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSessions((prev) => prev.filter((s) => s.id !== id));
    if (currentId === id) newChat();
  };

  const clearAllHistory = () => {
    setSessions([]);
    newChat();
  };

  const sendMessage = async (text?: string) => {
    const userText = text ?? input.trim();
    if (!userText || loading) return;
    setInput("");
    if (inputRef.current) inputRef.current.style.height = "auto";

    const userMsg: Message = { role: "user", content: userText };
    const updatedMessages: Message[] = [...messages, userMsg];
    setMessages(updatedMessages);
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/chat/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          provider,
        }),
      });

      if (res.status === 429) {
        setMessages([
          ...updatedMessages,
          {
            role: "assistant",
            content: "You've hit the rate limit for this model. Try switching to a different model using the dropdown above, or wait a moment and try again.",
          },
        ]);
        setLoading(false);
        return;
      }

      const data = await res.json();
      const assistantMsg: Message = {
        role: "assistant",
        content: data.reply ?? "No response received.",
        provider: data.provider,
      };
      const finalMessages = [...updatedMessages, assistantMsg];
      setMessages(finalMessages);

      const sessionTitle = userText.slice(0, 40) + (userText.length > 40 ? "..." : "");
      if (currentId) {
        setSessions((prev) =>
          prev.map((s) =>
            s.id === currentId ? { ...s, messages: finalMessages } : s
          )
        );
      } else {
        const newId = Date.now().toString();
        const newSession: ChatSession = {
          id: newId,
          title: sessionTitle,
          messages: finalMessages,
          timestamp: Date.now(),
        };
        setSessions((prev) => [newSession, ...prev]);
        setCurrentId(newId);
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "";
      const isRateLimit =
        errorMsg.includes("429") ||
        errorMsg.includes("rate") ||
        errorMsg.includes("quota");

      setMessages([
        ...updatedMessages,
        {
          role: "assistant",
          content: isRateLimit
            ? "You've hit the rate limit for this model. Try switching to a different model using the dropdown above, or wait a moment and try again."
            : "Something went wrong. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <div className="flex h-screen bg-[#0a0a0a] text-white overflow-hidden">
      {showAbout && <AboutModal onClose={() => setShowAbout(false)} />}

      {/* Sidebar */}
      <div className="w-64 flex-shrink-0 flex flex-col border-r border-white/5 bg-[#0a0a0a]">
        <div className="flex items-center gap-2.5 px-4 py-4 border-b border-white/5">
          <img src="/logo.png" alt="VisAssistance" className="w-7 h-7 rounded-lg object-cover" />
          <span className="text-sm font-semibold text-white">VisAssistance</span>
        </div>

        <div className="px-3 py-3">
          <button
            onClick={newChat}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-white/50 hover:bg-white/5 hover:text-white/80 transition-all border border-white/8 hover:border-white/15"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            New chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 flex flex-col gap-1">
          {sessions.length === 0 ? (
            <p className="text-xs text-white/20 text-center mt-6">No conversations yet</p>
          ) : (
            sessions.map((s) => (
              <div
                key={s.id}
                onClick={() => loadSession(s)}
                className={`group flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all ${
                  currentId === s.id
                    ? "bg-white/10 text-white"
                    : "text-white/40 hover:bg-white/5 hover:text-white/70"
                }`}
              >
                <div className="flex flex-col min-w-0">
                  <span className="text-xs truncate">{s.title}</span>
                  <span className="text-[10px] text-white/20 mt-0.5">{formatTime(s.timestamp)}</span>
                </div>
                <button
                  onClick={(e) => deleteSession(s.id, e)}
                  className="opacity-0 group-hover:opacity-100 text-white/30 hover:text-white/70 transition-all ml-2 flex-shrink-0"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            ))
          )}
        </div>

        <div className="px-3 py-3 border-t border-white/5 flex flex-col gap-1">
          {sessions.length > 0 && (
            <button
              onClick={clearAllHistory}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-white/30 hover:bg-white/5 hover:text-red-400/70 transition-all"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14H6L5 6" />
                <path d="M10 11v6M14 11v6" />
                <path d="M9 6V4h6v2" />
              </svg>
              Clear all history
            </button>
          )}
          <button
            onClick={() => setShowAbout(true)}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-white/30 hover:bg-white/5 hover:text-white/60 transition-all"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            About VisAssistance
          </button>
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center justify-between px-6 py-3 border-b border-white/5">
          <span className="text-sm text-white/30">
            {messages.length > 0
              ? sessions.find((s) => s.id === currentId)?.title ?? "New chat"
              : "New chat"}
          </span>
          <select
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white/60 outline-none cursor-pointer hover:bg-white/10 transition-colors"
          >
            {PROVIDERS.map((p) => (
              <option key={p.id} value={p.id} className="bg-[#1a1a1a]">
                {p.label} · {p.subtitle}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full px-4 pb-24">
              <img src="/logo.png" alt="VisAssistance" className="w-14 h-14 rounded-2xl object-cover mb-5" />
              <h1 className="text-2xl font-semibold mb-2">How can I help you?</h1>
              <p className="text-white/40 text-sm mb-10">
                Ask me anything about F1, OPT, CPT &amp; H1B visas
              </p>
              <div className="grid grid-cols-2 gap-2 w-full max-w-lg">
                {SUGGESTED.map((s) => (
                  <button
                    key={s}
                    onClick={() => sendMessage(s)}
                    className="text-left text-sm text-white/50 border border-white/8 rounded-xl px-4 py-3 hover:bg-white/5 hover:text-white/80 hover:border-white/15 transition-all duration-150"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto px-6 py-8 flex flex-col gap-6">
              {messages.map((msg, i) => (
                <div key={i} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                  {msg.role === "assistant" && (
                    <img src="/logo.png" alt="V" className="w-7 h-7 rounded-full object-cover flex-shrink-0 mt-0.5" />
                  )}
                  <div className={`flex flex-col gap-1 ${msg.role === "user" ? "items-end" : "items-start"} max-w-[85%]`}>
                    <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-white/10 text-white rounded-br-sm whitespace-pre-wrap"
                        : mdStyles
                    }`}>
                      {msg.role === "user"
                        ? msg.content
                        : <ReactMarkdown>{msg.content}</ReactMarkdown>
                      }
                    </div>
                    {msg.role === "assistant" && (
                      <div className="flex items-center gap-3">
                        {msg.provider && (
                          <span className="text-xs text-white/20 ml-1">
                            {PROVIDERS.find((p) => p.id === msg.provider)?.label} · {PROVIDERS.find((p) => p.id === msg.provider)?.subtitle}
                          </span>
                        )}
                        <CopyButton text={msg.content} />
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {loading && <SkeletonLoader />}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-white/5 bg-[#0a0a0a]">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-end gap-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 focus-within:border-white/20 transition-colors">
              <img src="/logo.png" alt="V" className="w-5 h-5 rounded-full object-cover flex-shrink-0 mb-0.5" />
              <textarea
                ref={inputRef}
                rows={1}
                value={input}
                onChange={handleInput}
                onKeyDown={handleKeyDown}
                placeholder="Ask any visa question..."
                className="flex-1 bg-transparent outline-none text-sm text-white placeholder-white/25 resize-none leading-relaxed"
                style={{ minHeight: "24px", maxHeight: "160px" }}
              />
              <button
                onClick={() => sendMessage()}
                disabled={loading || !input.trim()}
                className="w-8 h-8 rounded-xl bg-white disabled:bg-white/15 hover:bg-white/90 flex items-center justify-center transition-all flex-shrink-0 mb-0.5"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={loading || !input.trim() ? "#666" : "#000"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="19" x2="12" y2="5" />
                  <polyline points="5 12 12 5 19 12" />
                </svg>
              </button>
            </div>
            <p className="text-center text-xs text-white/15 mt-2">
              Not legal advice · Always verify with your DSO or immigration attorney
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}