import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import "./App.css";

const TABS = [
  { id: "history", label: "History" },
  { id: "groups", label: "Groups" },
  { id: "presets", label: "Presets" },
];

const PRESETS = [
  {
    name: "Email address",
    pattern: "[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}",
    flags: "gi",
    description: "Find email addresses across the input.",
    example: "Send mail to support@example.com to request access.",
  },
  {
    name: "URL",
    pattern: "https?:\\/\\/[\w.-]+(?:\\.[\w\.-]+)+(?:[\\w\\-._~:/?#[\]@!$&'()*+,;=.]+)?",
    flags: "gi",
    description: "Match HTTP and HTTPS links.",
    example: "Visit https://example.com/page for documentation.",
  },
  {
    name: "Date (YYYY-MM-DD)",
    pattern: "\\d{4}-\\d{2}-\\d{2}",
    flags: "g",
    description: "Capture ISO formatted dates.",
    example: "The deadline is 2026-10-01 and the report is due.",
  },
];

const DEFAULT_EXPLANATION = "";
const MAX_HISTORY = 12;

function App() {
  const [executionTime, setExecutionTime] = useState(0);
  const [highlightedText, setHighlightedText] = useState("");
  const [pattern, setPattern] = useState("");
  const [text, setText] = useState("");
  const [flags, setFlags] = useState("g");
  const [matches, setMatches] = useState([]);
  const [error, setError] = useState("");
  const [history, setHistory] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("regexHistory") || "[]");
    } catch {
      return [];
    }
  });
  const [selectedPreset, setSelectedPreset] = useState(null);
  const [activeTab, setActiveTab] = useState("history");
  const [explanation, setExplanation] = useState(DEFAULT_EXPLANATION);

  useEffect(() => {
    localStorage.setItem("regexHistory", JSON.stringify(history));
  }, [history]);

  const buildHighlightedText = useCallback((sourceText, foundMatches) => {
    if (!foundMatches.length) {
      return sourceText.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }

    let result = "";
    let lastIndex = 0;

    foundMatches.forEach((match) => {
      result += sourceText.slice(lastIndex, match.index);
      const safeValue = match.value.replace(/</g, "&lt;").replace(/>/g, "&gt;");
      result += `<mark>${safeValue}</mark>`;
      lastIndex = match.index + match.value.length;
    });

    result += sourceText.slice(lastIndex);
    return result;
  }, []);

  const runRegex = useCallback(async () => {
    try {
      const response = await axios.post("http://localhost:3000/api/regex", {
        pattern,
        text,
        flags,
      });

      const regexMatches = response.data.matches || [];
      setMatches(regexMatches);
      setExecutionTime(response.data.executionTime || 0);
      setHighlightedText(buildHighlightedText(text, regexMatches));
      setError("");

      const entry = {
        pattern,
        flags,
        note: selectedPreset?.name || "Custom",
        textSnippet: text.slice(0, 80),
        createdAt: new Date().toISOString(),
      };

      setHistory((current) => {
        const next = [entry, ...current.filter((item) => item.pattern !== pattern || item.flags !== flags)];
        return next.slice(0, MAX_HISTORY);
      });
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    }
  }, [pattern, text, flags, selectedPreset, buildHighlightedText]);

  useEffect(() => {
    if (!pattern || !text) {
      setMatches([]);
      setHighlightedText("");
      return;
    }

    const timer = setTimeout(() => {
      runRegex();
    }, 150);

    return () => clearTimeout(timer);
  }, [pattern, text, flags, runRegex]);

  useEffect(() => {
    setExplanation(
      selectedPreset?.description || DEFAULT_EXPLANATION
    );
  }, [selectedPreset]);

  const selectPreset = (preset) => {
    setPattern(preset.pattern);
    setFlags(preset.flags);
    setText(preset.example);
    setSelectedPreset(preset);
  };

  const loadHistory = (entry) => {
    setPattern(entry.pattern);
    setFlags(entry.flags);
    setText(entry.textSnippet);
    setSelectedPreset(null);
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem("regexHistory");
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span>regular expressions</span>
        </div>
        <nav className="tab-list">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={activeTab === tab.id ? "tab-button active" : "tab-button"}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </nav>
        <div className="sidebar-panel">
          {activeTab === "history" && (
            <div>
              <div className="sidebar-panel-header">
                <h3>History</h3>
                <button type="button" className="ghost-button" onClick={clearHistory}>
                  Clear
                </button>
              </div>
              {history.length ? (
                <div className="sidebar-list">
                  {history.map((entry, index) => (
                    <button
                      key={`${entry.pattern}-${entry.flags}-${index}`}
                      type="button"
                      className="sidebar-item"
                      onClick={() => loadHistory(entry)}
                    >
                      <strong>{entry.note}</strong>
                      <span>{entry.pattern} /{entry.flags}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="panel-empty">Run the regex to populate history.</p>
              )}
            </div>
          )}

          {activeTab === "groups" && (
            <div>
              <div className="sidebar-panel-header">
                <h3>Groups</h3>
              </div>
              {matches.length ? (
                <div className="sidebar-list">
                  {matches.map((match, index) => (
                    <div key={`${match.index}-${index}`} className="sidebar-item group-item">
                      <strong>Match {index + 1}</strong>
                      <span>{match.value}</span>
                      <div className="group-badges">
                        {(match.groups || []).map((group, groupIndex) => (
                          <span key={`${group.name}-${groupIndex}`} className="badge">
                            {group.name}: {group.value ?? "(empty)"}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="panel-empty">No matches yet.</p>
              )}
            </div>
          )}

          {activeTab === "presets" && (
            <div>
              <div className="sidebar-panel-header">
                <h3>Presets</h3>
              </div>
              <div className="sidebar-list">
                {PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    className="sidebar-item"
                    onClick={() => selectPreset(preset)}
                  >
                    <strong>{preset.name}</strong>
                    <span>{preset.description}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </aside>

      <main className="content-area">
        <div className="center-column">
          <section className="card panel-card">
            <div className="panel-header">
              <div>
                <h2>Regular Expression</h2>
                <p>Insert your regex pattern and flags here.</p>
              </div>
            </div>
            <label className="field-label">Pattern</label>
            <input
              type="text"
              placeholder="Insert your regular expression here"
              value={pattern}
              onChange={(e) => {
                setPattern(e.target.value);
                setSelectedPreset(null);
              }}
            />
            <label className="field-label">Flags</label>
            <input
              type="text"
              placeholder="gimsuy"
              value={flags}
              onChange={(e) => {
                setFlags(e.target.value);
                setSelectedPreset(null);
              }}
            />
          </section>

          <section className="card panel-card">
            <div className="panel-header">
              <div>
                <h2>Test String</h2>
                <p>Enter your input text to match against.</p>
              </div>
            </div>
            <textarea
              placeholder="Insert your test string here"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </section>
        </div>
      </main>

      <aside className="right-panel card explanation-panel">
        <div className="panel-header">
          <div>
            <h2>Statistics</h2>
            <p>Statistics for the given string</p>
          </div>
        </div>
        <div className="explanation-body">
          <div className="details-grid">
            <div>
              <span className="detail-label">Matches</span>
              <strong>{matches.length}</strong>
            </div>
            <div>
              <span className="detail-label">Text size</span>
              <strong>{text.length}</strong>
            </div>
            <div>
              <span className="detail-label">Exec time</span>
              <strong>{executionTime.toFixed(2)} ms</strong>
            </div>
          </div>
          {error && <div className="error-box">{error}</div>}
          {matches.length > 0 && (
            <div className="match-info">
              <div className="match-info-header">
                <strong>Match Information</strong>
              </div>
              <div className="match-list">
                {matches.map((m, idx) => {
                  const end = m.index + (m.value ? m.value.length : 0) - 1;
                  return (
                    <div key={idx} className="match-item">
                      <span className="match-label">{`Match ${idx + 1} ${m.index}-${end} | `}</span>
                      <span className="match-value">{m.value}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}

export default App;
