import { useCallback, useEffect, useState, useRef } from "react";
import axios from "axios";
import "./App.css";

const escape = (s) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const TABS = [
  { id: "history", label: "History", icon: "clock" },
  { id: "groups", label: "Groups", icon: "brackets" },
  { id: "presets", label: "Presets", icon: "bookmark" },
];

function Icon({ name, size = 14 }) {
  const props = {
    viewBox: "0 0 24 24", width: size, height: size, fill: "none",
    stroke: "currentColor", strokeWidth: "1.6", strokeLinecap: "round",
    strokeLinejoin: "round", "aria-hidden": true
  };
  switch (name) {
    case "clock": return <svg {...props}><circle cx="12" cy="12" r="10" /><path d="M12 6v6l3.5 2" /></svg>;
    case "brackets": return <svg {...props}><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></svg>;
    case "bookmark": return <svg {...props}><path d="M6 2h12v18l-6-4-6 4V2z" /></svg>;
    case "regex": return <svg {...props}><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></svg>;
    case "info": return <svg {...props}><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>;
    case "zap": return <svg {...props}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>;
    default: return null;
  }
}

const PRESETS = [
  {
    name: "Email address",
    pattern: "[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}",
    flags: "gi",
    description: "Match email addresses in the input",
    example: "Send mail to support@example.com to request access.",
  },
  {
    name: "URL",
    pattern: "https?:\\/\\/[\\w.-]+(?:\\.[\\w\\.-]+)+(?:[\\w\\-._~:/?#[\\]@!$&'()*+,;=.]+)?",
    flags: "gi",
    description: "Match HTTP and HTTPS links",
    example: "Visit https://example.com/page for documentation.",
  },
  {
    name: "Date (YYYY-MM-DD)",
    pattern: "\\d{4}-\\d{2}-\\d{2}",
    flags: "g",
    description: "Capture ISO-formatted dates",
    example: "The deadline is 2026-10-01 and the report is due.",
  },
];

const QUICK_REF = [
  { code: "\\d", desc: "Any digit 0–9" },
  { code: "\\w", desc: "Word character" },
  { code: "\\s", desc: "Whitespace" },
  { code: "^", desc: "Start of string" },
  { code: "$", desc: "End of string" },
  { code: "[a-z]", desc: "Character range" },
  { code: "+", desc: "One or more" },
  { code: "*", desc: "Zero or more" },
  { code: "?", desc: "Zero or one" },
  { code: ".", desc: "Any character" },
  { code: "(abc)", desc: "Capture group" },
  { code: "(?:abc)", desc: "Non-capture group" },
  { code: "a|b", desc: "Alternation" },
  { code: "{n,m}", desc: "Quantifier range" },
  { code: "\\b", desc: "Word boundary" },
];

const MAX_HISTORY = 12;

function relativeTime(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function App() {
  const [pattern, setPattern] = useState("");
  const [text, setText] = useState("");
  const [flags, setFlags] = useState("g");
  const [matches, setMatches] = useState([]);
  const [highlightedText, setHighlightedText] = useState("");
  const [executionTime, setExecutionTime] = useState(0);
  const [error, setError] = useState("");
  const [patternError, setPatternError] = useState("");
  const [history, setHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem("regexHistory") || "[]"); }
    catch { return []; }
  });
  const [selectedPreset, setSelectedPreset] = useState(null);
  const [activeTab, setActiveTab] = useState("history");

  const textareaRef = useRef(null);
  const highlightRef = useRef(null);

  useEffect(() => {
    localStorage.setItem("regexHistory", JSON.stringify(history));
  }, [history]);

  const buildHighlightedText = useCallback((src, found) => {
    if (!found.length) return escape(src);
    let out = "", last = 0;
    found.forEach((m) => {
      out += escape(src.slice(last, m.index));
      out += `<mark>${escape(m.value)}</mark>`;
      last = m.index + m.value.length;
    });
    out += escape(src.slice(last));
    return out;
  }, []);

  const findMatchesLocal = useCallback((p, f, src) => {
    if (!p) return [];
    try {
      const hasG = (f || "").includes("g");
      const re = new RegExp(p, hasG ? f : `${f || ""}g`);
      const out = [];
      let m;
      while ((m = re.exec(src)) !== null) {
        out.push({ index: m.index, value: m[0], groups: m.groups || [] });
        if (m.index === re.lastIndex) re.lastIndex++;
      }
      return out;
    } catch { return []; }
  }, []);

  const validateRegex = (p, f) => {
    if (!p) return "";
    try { new RegExp(p, f || undefined); return ""; }
    catch { return "Invalid regular expression"; }
  };

  const runRegex = useCallback(async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
      const res = await axios.post(`${apiUrl}/api/regex`, { pattern, text, flags });
      const got = res.data.matches || [];
      setMatches(got);
      setExecutionTime(res.data.executionTime || 0);
      setHighlightedText(buildHighlightedText(text, got));
      setError("");
      const entry = {
        pattern, flags,
        note: selectedPreset?.name || "Custom",
        textSnippet: text.slice(0, 80),
        createdAt: new Date().toISOString(),
      };
      setHistory((cur) => {
        const next = [entry, ...cur.filter((i) => i.pattern !== pattern || i.flags !== flags)];
        return next.slice(0, MAX_HISTORY);
      });
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    }
  }, [pattern, text, flags, selectedPreset, buildHighlightedText]);

  useEffect(() => {
    const err = validateRegex(pattern, flags);
    setPatternError(err);

    if (!pattern || err) {
      setMatches([]);
      setHighlightedText(escape(text));
      return;
    }
    if (!text) {
      setMatches([]);
      setHighlightedText("");
      return;
    }
    const local = findMatchesLocal(pattern, flags, text);
    setMatches(local);
    setHighlightedText(buildHighlightedText(text, local));
    const t = setTimeout(runRegex, 150);
    return () => clearTimeout(t);
  }, [pattern, text, flags, runRegex]);

  const syncScroll = useCallback(() => {
    if (highlightRef.current && textareaRef.current) {
      highlightRef.current.scrollTop = textareaRef.current.scrollTop;
      highlightRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  }, []);

  const toggleFlag = (ch) => {
    if (ch === "g") return;
    let f = flags.includes(ch) ? flags.replace(ch, "") : flags + ch;
    if (!f.includes("g")) f = "g" + f;
    setFlags(f); setSelectedPreset(null); setPatternError(validateRegex(pattern, f));
  };

  const selectPreset = (p) => { setPattern(p.pattern); setFlags(p.flags); setText(p.example); setSelectedPreset(p); };
  const loadHistory = (e) => { setPattern(e.pattern); setFlags(e.flags); setText(e.textSnippet); setSelectedPreset(null); };
  const clearHistory = () => { setHistory([]); localStorage.removeItem("regexHistory"); };

  return (
    <div className="app-root">
      <div className="app-shell">

        <aside className="sidebar">
          <div className="sidebar-brand">
            <div className="brand-icon" aria-hidden>
              <Icon name="regex" size={13} />
            </div>
            <span className="brand-name">Regex Studio</span>
          </div>

          <p className="sidebar-section-label">Tools</p>

          <nav className="tab-list" role="tablist">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id}
                className={`tab-btn${activeTab === tab.id ? " active" : ""}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <span className="tab-btn__icon"><Icon name={tab.icon} size={14} /></span>
                <span className="tab-btn__label">{tab.label}</span>
                {activeTab === tab.id && <span className="tab-btn__pip" aria-hidden />}
              </button>
            ))}
          </nav>

          <div className="sidebar-content">
            {activeTab === "history" && (
              <div className="panel-section">
                <div className="panel-section__head">
                  <span className="panel-section__title">Recent</span>
                  {history.length > 0 && (
                    <button type="button" className="text-btn" onClick={clearHistory}>Clear</button>
                  )}
                </div>
                {history.length ? (
                  <ul className="history-list">
                    {history.map((entry, i) => (
                      <li key={`${entry.pattern}-${i}`}>
                        <button
                          type="button"
                          className="history-card"
                          onClick={() => loadHistory(entry)}
                        >
                          <div className="history-card__top">
                            <span className="history-card__tag">{entry.note}</span>
                            {entry.createdAt && (
                              <time className="history-card__time" dateTime={entry.createdAt}>
                                {relativeTime(entry.createdAt)}
                              </time>
                            )}
                          </div>
                          <div className="history-card__pattern">
                            <code>{entry.pattern}</code>
                            <span className="history-card__flags">/{entry.flags}</span>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="empty-state">Run a regex to see history.</p>
                )}
              </div>
            )}

            {activeTab === "groups" && (
              <div className="panel-section">
                <div className="panel-section__head">
                  <span className="panel-section__title">Capture Groups</span>
                </div>
                {matches.length ? (
                  <ul className="groups-list">
                    {matches.map((match, i) => (
                      <li key={`${match.index}-${i}`} className="group-card">
                        <div className="group-card__header">
                          <span className="group-card__index">#{i + 1}</span>
                          <code className="group-card__value">{match.value}</code>
                        </div>
                        {(match.groups || []).length > 0 && (
                          <div className="group-card__badges">
                            {(match.groups || []).map((g, gi) => (
                              <span key={`${g.name}-${gi}`} className="badge">
                                {g.name}: {g.value ?? "(empty)"}
                              </span>
                            ))}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="empty-state">No matches yet.</p>
                )}
              </div>
            )}

            {activeTab === "presets" && (
              <div className="panel-section">
                <div className="panel-section__head">
                  <span className="panel-section__title">Common Patterns</span>
                </div>
                <ul className="preset-list">
                  {PRESETS.map((p) => (
                    <li key={p.name}>
                      <button
                        type="button"
                        className={`preset-card${selectedPreset?.name === p.name ? " active" : ""}`}
                        onClick={() => selectPreset(p)}
                      >
                        <strong className="preset-card__name">{p.name}</strong>
                        <span className="preset-card__desc">{p.description}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </aside>

        <main className="content-area">
          <div className="center-column">
            <section className="card">
              <header className="card__header">
                <div className="card__title-group">
                  <h2 className="card__title">Pattern</h2>
                  <p className="card__subtitle">Write your regular expression</p>
                </div>
              </header>

              <div className="field">
                <label className="field__label" htmlFor="pattern-input">Expression</label>
                <div className={`pattern-wrap${patternError ? " pattern-wrap--invalid" : ""}`}>
                  <span className="pattern-wrap__delim" aria-hidden>/</span>
                  <input
                    id="pattern-input"
                    type="text"
                    placeholder="\d{3}-\d{4}"
                    className="pattern-input"
                    value={pattern}
                    spellCheck={false}
                    autoComplete="off"
                    onChange={(e) => {
                      const v = e.target.value;
                      setPattern(v); setSelectedPreset(null); setPatternError(validateRegex(v, flags));
                    }}
                  />
                  <span className="pattern-wrap__flags" aria-hidden>/{flags}</span>
                </div>
                {patternError && <p className="field__error" role="alert">{patternError}</p>}
              </div>

              <div className="field field--row">
                <label className="field__label" htmlFor="flags-input">Flags</label>
                <div className="flags-row">
                  <input
                    id="flags-input"
                    type="text"
                    placeholder="g"
                    className="flags-text-input"
                    value={flags}
                    spellCheck={false}
                    autoComplete="off"
                    onChange={(e) => {
                      const v = e.target.value;
                      setFlags(v); setSelectedPreset(null); setPatternError(validateRegex(pattern, v));
                    }}
                  />
                  <div className="flag-pills">
                    {["g", "i", "m", "s"].map((ch) => (
                      <button
                        key={ch}
                        type="button"
                        title={{ g: "Global", i: "Case insensitive", m: "Multiline", s: "Dot-all" }[ch]}
                        className={`flag-pill${flags.includes(ch) ? " flag-pill--on" : ""}${ch === "g" ? " flag-pill--locked" : ""}`}
                        onClick={() => toggleFlag(ch)}
                        disabled={ch === "g"}
                      >
                        {ch}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <section className="card">
              <header className="card__header">
                <div className="card__title-group">
                  <h2 className="card__title">Test String</h2>
                  <p className="card__subtitle">Paste your input text to match against</p>
                </div>
                {matches.length > 0 && (
                  <span className="match-pill">
                    {matches.length} match{matches.length !== 1 ? "es" : ""}
                  </span>
                )}
              </header>

              <div className="editor-wrapper">
                <div
                  ref={highlightRef}
                  className="highlight-layer"
                  aria-hidden="true"
                  dangerouslySetInnerHTML={{ __html: highlightedText }}
                />
                <textarea
                  ref={textareaRef}
                  className="test-input overlay"
                  placeholder="Insert your test string here…"
                  spellCheck={false}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="none"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onScroll={syncScroll}
                />
              </div>
            </section>
          </div>
        </main>

        <aside className="right-panel">
          <div className="right-section">
            <header className="right-section__header">
              <span className="right-section__label">Statistics</span>
            </header>
            <div className="stat-grid">
              <div className="stat-card">
                <span className="stat-card__value matches-count">{matches.length}</span>
                <span className="stat-card__label">Matches</span>
              </div>
              <div className="stat-card">
                <span className="stat-card__value">{text.length}</span>
                <span className="stat-card__label">Chars</span>
              </div>
              <div className="stat-card">
                <span className="stat-card__value">{executionTime.toFixed(2)}</span>
                <span className="stat-card__label">ms</span>
              </div>
            </div>
          </div>

          {error && <div className="alert alert--error" role="alert">{error}</div>}
          {patternError && <div className="alert alert--warn" role="alert">{patternError}</div>}

          <div className="right-section">
            {!pattern ? (
              <p className="empty-state">Enter a pattern to start matching.</p>
            ) : patternError ? null : matches.length === 0 ? (
              <p className="empty-state">No matches found.</p>
            ) : (
              <>
                <header className="right-section__header">
                  <span className="right-section__label">Matches</span>
                  <span className="right-section__count">{matches.length}</span>
                </header>
                <div className="match-list">
                  {matches.map((m, idx) => {
                    const end = m.index + (m.value?.length ?? 0) - 1;
                    return (
                      <div key={idx} className="match-row">
                        <span className="match-row__index">{idx + 1}</span>
                        <code className="match-row__value">{m.value}</code>
                        <span className="match-row__range">{m.index}–{end}</span>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          <div className="right-section right-section--ref">
            <header className="right-section__header">
              <span className="right-section__label">Quick Reference</span>
            </header>
            <div className="qref-list">
              {QUICK_REF.map(({ code, desc }) => (
                <div key={code} className="qref-row">
                  <code className="qref-row__code">{code}</code>
                  <span className="qref-row__desc">{desc}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>

      </div>

      <footer className="site-footer">
        <div className="footer-main">
          <div className="footer-brand-block">
            <span className="footer-brand-name">
              <Icon name="regex" size={14} />
              Regex Studio
            </span>
            <p className="footer-tagline">
              Built for developers. Test, debug, and learn regular expressions with
              real-time matching, groups, and pattern analysis.
            </p>
          </div>
          <div className="footer-meta">
            <span className="footer-version">Version 1.0.0</span>
            <span className="footer-sep" aria-hidden>•</span>
            <p className="footer-copy">© 2026 Regex Studio. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
