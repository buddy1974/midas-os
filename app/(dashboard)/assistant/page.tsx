"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ArrowUp } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  streaming?: boolean;
}

interface HistoryMessage {
  id: string;
  role: string;
  content: string;
  createdAt: string;
}

const QUICK_ACTIONS = [
  "📊 Summarise my pipeline today",
  "📧 Draft a new lot alert email",
  "💰 What's my best ROI deal?",
  "👥 Who are my hottest leads?",
  "🔨 Prepare me for auction day",
  "📈 UK market update",
  "✍️ Write a LinkedIn post for my latest lot",
  "🤝 Explain creative finance simply",
  "🏠 Find me a private lender for a £150k deal",
  "📋 Summarise this week's viewings",
];

const EXAMPLE_PROMPTS = [
  "What deals should I prioritise?",
  "Draft an email to a new investor",
  "How do I structure a vendor finance deal?",
];

const DEMO_RESPONSE =
  "I'm ARIA, running in demo mode. Add your OPENAI_API_KEY to .env.local to enable live intelligence. I can see your pipeline is active with lots across London and Essex, and your CRM has contacts ready to engage. Once your API key is set, I can summarise deals, draft emails, analyse properties, and give you real-time market intelligence.";

let msgCounter = 0;
function newId() {
  return `msg-${++msgCounter}-${Date.now()}`;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }, []);

  useEffect(() => {
    fetch("/api/assistant/history")
      .then((r) => r.json())
      .then((data: HistoryMessage[]) => {
        if (Array.isArray(data) && data.length > 0) {
          setMessages(
            data.map((m) => ({
              id: m.id,
              role: m.role as "user" | "assistant",
              content: m.content,
              timestamp: new Date(m.createdAt),
            }))
          );
          scrollToBottom();
        }
      })
      .catch(() => {});
  }, [scrollToBottom]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  async function sendMessage(text: string) {
    if (!text.trim() || isStreaming) return;

    const userMsg: Message = {
      id: newId(),
      role: "user",
      content: text.trim(),
      timestamp: new Date(),
    };

    const ariaMsg: Message = {
      id: newId(),
      role: "assistant",
      content: "",
      timestamp: new Date(),
      streaming: true,
    };

    setMessages((prev) => [...prev, userMsg, ariaMsg]);
    setInput("");
    setIsStreaming(true);
    scrollToBottom();

    const allMessages = [...messages, userMsg].map((m) => ({
      role: m.role,
      content: m.content,
    }));

    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: allMessages }),
      });

      if (res.status === 503) {
        setApiOnline(false);
        let i = 0;
        const interval = setInterval(() => {
          if (i >= DEMO_RESPONSE.length) {
            clearInterval(interval);
            setIsStreaming(false);
            setMessages((prev) =>
              prev.map((m) => (m.id === ariaMsg.id ? { ...m, streaming: false } : m))
            );
            return;
          }
          const chunk = DEMO_RESPONSE.slice(i, i + 3);
          i += 3;
          setMessages((prev) =>
            prev.map((m) => (m.id === ariaMsg.id ? { ...m, content: m.content + chunk } : m))
          );
          scrollToBottom();
        }, 25);
        return;
      }

      if (!res.ok || !res.body) throw new Error("Network error");

      setApiOnline(true);
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6);
          if (data === "[DONE]") {
            setIsStreaming(false);
            setMessages((prev) =>
              prev.map((m) => (m.id === ariaMsg.id ? { ...m, streaming: false } : m))
            );
            fetch("/api/assistant/save", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ userMessage: userMsg.content, assistantMessage: fullContent }),
            }).catch(() => {});
            break;
          }
          fullContent += data;
          setMessages((prev) =>
            prev.map((m) => (m.id === ariaMsg.id ? { ...m, content: m.content + data } : m))
          );
          scrollToBottom();
        }
      }
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === ariaMsg.id
            ? { ...m, content: "ARIA is unavailable. Check your API key.", streaming: false }
            : m
        )
      );
      setIsStreaming(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void sendMessage(input);
    }
  }

  const gold = "#c9a84c";

  return (
    <div className="flex" style={{ backgroundColor: "var(--background)", height: "100vh", overflow: "hidden" }}>
      {/* LEFT PANEL */}
      <aside
        className="hidden md:flex flex-col shrink-0"
        style={{
          width: "260px",
          backgroundColor: "var(--color-surface)",
          borderRight: "1px solid var(--color-border)",
          height: "100vh",
        }}
      >
        <div className="px-5 py-6 shrink-0" style={{ borderBottom: "1px solid var(--color-border)" }}>
          <h1
            style={{
              color: gold,
              fontSize: "30px",
              letterSpacing: "8px",
              textTransform: "uppercase",
              fontFamily: "Georgia, serif",
              margin: 0,
              lineHeight: 1,
            }}
          >
            ARIA
          </h1>
          <div className="flex items-center gap-2 mt-2">
            {apiOnline === false ? (
              <>
                <span className="rounded-full" style={{ width: 7, height: 7, backgroundColor: "#f59e0b", display: "inline-block" }} />
                <span style={{ color: "#f59e0b", fontSize: "11px", letterSpacing: "1px" }}>Demo mode</span>
              </>
            ) : (
              <>
                <span className="rounded-full animate-pulse" style={{ width: 7, height: 7, backgroundColor: "#22c55e", display: "inline-block" }} />
                <span style={{ color: "#22c55e", fontSize: "11px", letterSpacing: "1px" }}>Online</span>
              </>
            )}
          </div>
          <p style={{ color: "var(--color-text-dim)", fontSize: "11px", marginTop: "6px" }}>
            Property Intelligence Assistant
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-4">
          <p className="px-2 mb-2" style={{ color: "var(--color-text-dim)", fontSize: "10px", letterSpacing: "2px", textTransform: "uppercase" }}>
            Quick Actions
          </p>
          <div className="space-y-1">
            {QUICK_ACTIONS.map((action) => (
              <button
                key={action}
                onClick={() => void sendMessage(action)}
                disabled={isStreaming}
                className="w-full text-left px-3 py-2 rounded text-sm transition-all disabled:opacity-40 hover:bg-[rgba(201,168,76,0.06)]"
                style={{
                  color: "var(--color-text-dim)",
                  borderLeft: `2px solid ${gold}`,
                  backgroundColor: "transparent",
                  fontSize: "12px",
                  lineHeight: "1.4",
                }}
              >
                {action}
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* RIGHT PANEL */}
      <div className="flex flex-col flex-1" style={{ height: "100vh", overflow: "hidden" }}>
        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-6 md:px-8">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <p
                style={{
                  fontSize: "100px",
                  fontFamily: "Georgia, serif",
                  color: gold,
                  opacity: 0.06,
                  lineHeight: 1,
                  userSelect: "none",
                  letterSpacing: "16px",
                }}
              >
                ARIA
              </p>
              <h2 className="text-xl font-semibold mt-4" style={{ color: "var(--color-text)" }}>
                Your property intelligence assistant
              </h2>
              <p className="mt-2 mb-8" style={{ color: "var(--color-text-dim)", fontSize: "14px" }}>
                Ask me anything about your business
              </p>
              <div className="flex flex-wrap gap-3 justify-center">
                {EXAMPLE_PROMPTS.map((p) => (
                  <button
                    key={p}
                    onClick={() => void sendMessage(p)}
                    className="px-4 py-2 rounded-full text-sm transition-colors hover:bg-[rgba(201,168,76,0.1)]"
                    style={{ border: `1px solid ${gold}`, color: gold, backgroundColor: "rgba(201,168,76,0.06)", fontSize: "13px" }}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6 max-w-3xl mx-auto">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div style={{ maxWidth: msg.role === "user" ? "75%" : "85%" }}>
                    {msg.role === "assistant" && (
                      <p className="mb-1" style={{ color: gold, fontSize: "10px", letterSpacing: "2px", textTransform: "uppercase" }}>
                        ARIA
                      </p>
                    )}
                    <div
                      className="px-4 py-3"
                      style={{
                        backgroundColor: msg.role === "user" ? gold : "var(--color-surface)",
                        color: msg.role === "user" ? "#080809" : "var(--color-text)",
                        borderRadius: msg.role === "user" ? "18px 4px 18px 18px" : "4px 18px 18px 18px",
                        borderLeft: msg.role === "assistant" ? `2px solid ${gold}` : undefined,
                        whiteSpace: "pre-wrap",
                        fontSize: "14px",
                        lineHeight: "1.7",
                      }}
                    >
                      {msg.content || (msg.streaming ? "" : "…")}
                      {msg.streaming && (
                        <span
                          style={{
                            display: "inline-block",
                            width: "2px",
                            height: "14px",
                            backgroundColor: gold,
                            marginLeft: "2px",
                            verticalAlign: "middle",
                            animation: "blink 1s step-end infinite",
                          }}
                        />
                      )}
                    </div>
                    <p
                      className="mt-1"
                      style={{ color: "var(--color-text-dim)", fontSize: "10px", textAlign: msg.role === "user" ? "right" : "left" }}
                    >
                      {formatTime(msg.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <div
          className="shrink-0 px-4 py-4 md:px-8"
          style={{ borderTop: "1px solid var(--color-border)", backgroundColor: "var(--color-surface)" }}
        >
          <div className="max-w-3xl mx-auto">
            <div
              className="flex items-end gap-3 rounded-xl px-4 py-3"
              style={{ backgroundColor: "var(--background)", border: "1px solid var(--color-border)" }}
            >
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask ARIA anything..."
                disabled={isStreaming}
                rows={1}
                className="flex-1 bg-transparent resize-none outline-none disabled:opacity-50"
                style={{ color: "var(--color-text)", fontSize: "14px", lineHeight: "1.5", maxHeight: "120px", fontFamily: "inherit" }}
              />
              <button
                onClick={() => void sendMessage(input)}
                disabled={isStreaming || !input.trim()}
                className="shrink-0 rounded-lg p-2 transition-colors disabled:opacity-40"
                style={{ backgroundColor: gold, color: "#080809" }}
              >
                <ArrowUp size={18} />
              </button>
            </div>
            <p className="mt-2 text-center" style={{ color: "var(--color-text-dim)", fontSize: "11px" }}>
              ARIA has live access to your lots, contacts, pipeline and events
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
