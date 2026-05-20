import { useState, useRef, useEffect } from "react";
import "./Chatbot.css";

const API_URL = "http://localhost:8000/simplify";

const EXAMPLE_TEXTS = [
  "يجب إرفاق شهادة رسمية من البنك تتضمن تفاصيل الحساب الكاملة في حال الدفع إلى خارج البلاد.",
  "التفاصيل الطبية: من قدّم العلاج الأول، نوع الإصابة (كسر، جرح...)، العضو المصاب، اسم المستشفى، القسم، تاريخ وساعة تلقي العلاج الأول.",
  "يمكن لمقدم الطلب الموافقة على تلقي رسائل نصية SMS بدلاً من البريد العادي.",
];

function Message({ msg }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(msg.simplified || msg.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (msg.role === "user") {
    return (
      <div className="message message--user">
        <div className="bubble bubble--user">
          <p>{msg.text}</p>
        </div>
        <div className="avatar avatar--user">أنت</div>
      </div>
    );
  }

  if (msg.role === "loading") {
    return (
      <div className="message message--bot">
        <div className="avatar avatar--bot">
          <span className="avatar-icon">ط</span>
        </div>
        <div className="bubble bubble--bot bubble--loading">
          <div className="loading-indicator">
            <div className="spinner" />
            <span>جاري التبسيط باستخدام AraT5 + GPT-4o...</span>
          </div>
        </div>
      </div>
    );
  }

  if (msg.role === "error") {
    return (
      <div className="message message--bot">
        <div className="avatar avatar--bot">
          <span className="avatar-icon">ط</span>
        </div>
        <div className="bubble bubble--bot bubble--error">
          <p>{msg.text}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="message message--bot">
      <div className="avatar avatar--bot">
        <span className="avatar-icon">ط</span>
      </div>
      <div className="bubble bubble--bot">
        {msg.arat5 && msg.arat5 !== msg.simplified && (
          <div className="intermediate-box">
            <div className="intermediate-label">
              <span className="dot dot--arat5" />
              مرحلة AraT5
            </div>
            <p className="intermediate-text">{msg.arat5}</p>
          </div>
        )}
        <div className="result-box">
          <div className="result-label">
            <span className="dot dot--gpt" />
            النص المبسّط النهائي
          </div>
          <p className="result-text">{msg.simplified}</p>
          <button
            className={`copy-btn ${copied ? "copy-btn--done" : ""}`}
            onClick={handleCopy}
          >
            {copied ? "✓ تم النسخ" : "نسخ"}
          </button>
        </div>
        <div className="model-tag">
          ✦ Tabsit · AraT5v2 + GPT-4o · SAMER Level 3
        </div>
      </div>
    </div>
  );
}

export default function Chatbot() {
  const [messages, setMessages]       = useState([]);
  const [inputText, setInputText]     = useState("");
  const [isLoading, setIsLoading]     = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);

  const messagesEndRef = useRef(null);
  const textareaRef    = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleTextareaChange = (e) => {
    setInputText(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 180) + "px";
  };

  const applyExample = (text) => {
    setInputText(text);
    textareaRef.current?.focus();
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 180) + "px";
    }
  };

  const handleSubmit = async () => {
    const text = inputText.trim();
    if (!text || isLoading) return;

    setShowWelcome(false);
    setIsLoading(true);
    setInputText("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    setMessages((prev) => [
      ...prev,
      { id: Date.now(),     role: "user",    text },
      { id: Date.now() + 1, role: "loading" },
    ]);

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "خطأ في الخادم");
      }

      const data = await res.json();

      setMessages((prev) => [
        ...prev.filter((m) => m.role !== "loading"),
        {
          id: Date.now() + 2,
          role: "bot",
          simplified: data.simplified_text,
          arat5: data.arat5_intermediate,
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev.filter((m) => m.role !== "loading"),
        {
          id: Date.now() + 2,
          role: "error",
          text: `⚠️ ${err.message || "تعذّر الاتصال بالخادم."}`,
        },
      ]);
    } finally {
      setIsLoading(false);
      textareaRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const clearChat = () => {
    setMessages([]);
    setShowWelcome(true);
  };

  return (
    <div className="chatbot-root">
      <header className="chatbot-header">
        <div className="header-brand">
          <div className="header-logo">ط</div>
          <div className="header-titles">
            <h1 className="header-name">Tabsit</h1>
            <p className="header-sub">تبسيط النصوص الحكومية والتأمينية</p>
          </div>
        </div>
        <div className="header-actions">
          <div className="model-badges">
            <span className="badge badge--arat5">AraT5v2</span>
            <span className="badge badge--plus">+</span>
            <span className="badge badge--gpt">GPT-4o</span>
          </div>
          {messages.length > 0 && (
            <button className="clear-btn" onClick={clearChat}>↺</button>
          )}
        </div>
      </header>

      <main className="chatbot-messages">
        {showWelcome && (
          <div className="welcome-screen">
            <div className="welcome-logo">ط</div>
            <h2 className="welcome-title">مرحباً في Tabsit</h2>
            <p className="welcome-desc">
              نظام هجين يجمع بين نموذج AraT5v2 المدرَّب على بيانات الوثائق
              الحكومية ونموذج GPT-4o لتقديم تبسيط دقيق وسلس بمستوى SAMER Level 3.
            </p>
            <div className="examples-section">
              <p className="examples-label">جرّب أحد هذه الأمثلة:</p>
              <div className="examples-list">
                {EXAMPLE_TEXTS.map((ex, i) => (
                  <button
                    key={i}
                    className="example-card"
                    onClick={() => applyExample(ex)}
                  >
                    {ex}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
        {messages.map((msg) => (
          <Message key={msg.id} msg={msg} />
        ))}
        <div ref={messagesEndRef} />
      </main>

      <footer className="chatbot-footer">
        <div className={`input-container ${isLoading ? "input-container--disabled" : ""}`}>
          <textarea
            ref={textareaRef}
            className="input-textarea"
            value={inputText}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder="الصق النص الحكومي أو التأميني الذي تريد تبسيطه هنا..."
            disabled={isLoading}
            rows={1}
            dir="rtl"
          />
          <button
            className={`send-btn ${isLoading ? "send-btn--loading" : ""}`}
            onClick={handleSubmit}
            disabled={isLoading || !inputText.trim()}
          >
            {isLoading ? <span className="send-spinner" /> : <span className="send-icon">↑</span>}
          </button>
        </div>
        <p className="input-hint">Enter للإرسال · Shift+Enter لسطر جديد</p>
      </footer>
    </div>
  );
}