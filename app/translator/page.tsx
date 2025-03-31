"use client";

import React, { useState } from "react";
import {
  translateIntoMultipleLanguages,
  translateText,
} from "../utils/translator";

const languages = [
  { code: "eng_Latn", name: "English" },
  { code: "ces_Latn", name: "Czech" },
  { code: "ita_Latn", name: "Italian" },
  { code: "ben_Beng", name: "Bengali" },
  { code: "nld_Latn", name: "Dutch" },
  { code: "fra_Latn", name: "French" },
  { code: "deu_Latn", name: "German" },
  { code: "hin_Deva", name: "Hindi" },
  { code: "jpn_Jpan", name: "Japanese" },
  { code: "kor_Hang", name: "Korean" },
  { code: "msa_Latn", name: "Malay" },
  { code: "fas_Arab", name: "Persian" },
  { code: "pol_Latn", name: "Polish" },
  { code: "por_Latn", name: "Portuguese" },
  { code: "spa_Latn", name: "Spanish" },
  { code: "zho_Hans", name: "Chinese (Simplified)" },
  { code: "rus_Cyrl", name: "Russian" },
  { code: "tur_Latn", name: "Turkish" },
  { code: "ara_Arab", name: "Arabic" },
  { code: "vie_Latn", name: "Vietnamese" },
];

const TranslatorPage = () => {
  const [mode, setMode] = useState("text");
  const [text, setText] = useState("");
  const [keyValue, setKeyValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([
    "eng_Latn",
    "ces_Latn",
    "ita_Latn",
  ]);
  const [translations, setTranslations] = useState<
    { language: string; translation: string }[]
  >([]);
  const [copiedMessage, setCopiedMessage] = useState("");
  const [jsonInput, setJsonInput] = useState("");
  const [jsonTranslations, setJsonTranslations] = useState<
    Record<string, Record<string, string>>
  >({});

  const handleCheckboxChange = (languageCode: string) => {
    setSelectedLanguages((prev) =>
      prev.includes(languageCode)
        ? prev.filter((code) => code !== languageCode)
        : [...prev, languageCode]
    );
  };

  const handleTranslate = async () => {
    setLoading(true);
    try {
      const translations = await translateIntoMultipleLanguages(
        text,
        selectedLanguages,
        "eng_Latn"
      );
      setTranslations(translations);
    } catch (error) {
      console.error("Translation error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyJSONForTranslation = (translation: string) => {
    const jsonSnippet = `"${keyValue}": "${translation}",`;
    navigator.clipboard.writeText(jsonSnippet).then(() => {
      setCopiedMessage("Copied to clipboard!");
      setTimeout(() => setCopiedMessage(""), 2000);
    });
  };

  const handleJsonTranslate = async () => {
    setLoading(true);
    try {
      const parsed = JSON.parse(jsonInput);
      const result: Record<string, Record<string, string>> = {};

      for (const lang of selectedLanguages) {
        result[lang] = {};
        for (const [key, value] of Object.entries(parsed)) {
          const translated = await translateText(value, lang, "eng_Latn");
          result[lang][key] = translated;
        }
      }
      setJsonTranslations(result);
    } catch {
      alert("Invalid JSON");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const json = JSON.parse(reader.result as string);
        setJsonInput(JSON.stringify(json, null, 2));
      } catch {
        alert("Invalid JSON file.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="container">
      <h1>🌍 Translator Tool</h1>

      <div className="mode-toggle">
        <button
          className={mode === "text" ? "active" : ""}
          onClick={() => setMode("text")}
        >
          Text Mode
        </button>
        <button
          className={mode === "json" ? "active" : ""}
          onClick={() => setMode("json")}
        >
          JSON Mode
        </button>
      </div>

      <div className="language-grid">
        {languages.map((lang) => (
          <label key={lang.code}>
            <input
              type="checkbox"
              value={lang.code}
              checked={selectedLanguages.includes(lang.code)}
              onChange={() => handleCheckboxChange(lang.code)}
            />
            {lang.name}
          </label>
        ))}
      </div>

      {mode === "text" && (
        <>
          {copiedMessage && (
            <span className="copied-message">{copiedMessage}</span>
          )}
          <input
            type="text"
            value={keyValue}
            onChange={(e) => setKeyValue(e.target.value)}
            placeholder="Enter key (e.g., welcomeMessage)"
            className="input"
          />
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter text to translate..."
            rows={4}
            className="textarea"
          />
          <button
            onClick={handleTranslate}
            disabled={loading}
            className="translate-btn"
          >
            {loading ? "Translating..." : "Translate"}
          </button>

          {translations.length > 0 && (
            <div className="translations">
              <h3>Translations:</h3>
              {translations.map((t, index) => (
                <div key={index} className="translation-card">
                  <strong>{t.language}:</strong>
                  <p>{t.translation}</p>
                  <button
                    onClick={() => handleCopyJSONForTranslation(t.translation)}
                  >
                    Copy JSON
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {mode === "json" && (
        <>
          <div
            className="drop-zone"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (e.dataTransfer.files[0]) {
                handleFileUpload(e.dataTransfer.files[0]);
              }
            }}
          >
            <p>📂 Drag & drop a JSON file here, or click below</p>
            <input
              type="file"
              accept=".json"
              onChange={(e) => {
                if (e.target.files?.[0]) handleFileUpload(e.target.files[0]);
              }}
            />
          </div>
          <textarea
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            placeholder="Paste your JSON here..."
            rows={10}
            className="textarea"
          />
          <button
            onClick={handleJsonTranslate}
            disabled={loading}
            className="translate-btn"
          >
            {loading ? "Translating..." : "Translate JSON"}
          </button>

          {Object.keys(jsonTranslations).length > 0 && (
            <div className="translations">
              <h3>JSON Translations:</h3>
              {Object.entries(jsonTranslations).map(([lang, content]) => (
                <div key={lang} className="translation-card">
                  <strong>{lang}:</strong>
                  <pre>{JSON.stringify(content, null, 2)}</pre>
                  <button
                    onClick={() => {
                      const blob = new Blob(
                        [JSON.stringify(content, null, 2)],
                        { type: "application/json" }
                      );
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `${lang}.json`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                  >
                    Download JSON
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <style jsx>{`
        .container {
          max-width: 800px;
          margin: 40px auto;
          padding: 30px;
          background: #f9f9f9;
          border-radius: 12px;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
          font-family: sans-serif;
        }
        h1 {
          font-size: 28px;
          margin-bottom: 20px;
          text-align: center;
        }
        .input,
        .textarea {
          width: 100%;
          padding: 12px;
          margin-bottom: 15px;
          border: 1px solid #ccc;
          border-radius: 8px;
          font-size: 16px;
        }
        .language-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          gap: 10px;
          margin: 10px 0 20px;
        }
        .translate-btn {
          background-color: #4f46e5;
          color: white;
          padding: 12px 20px;
          font-size: 16px;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: background 0.3s;
        }
        .translate-btn:disabled {
          background-color: #a5b4fc;
          cursor: not-allowed;
        }
        .translate-btn:hover:not(:disabled) {
          background-color: #4338ca;
        }
        .translations {
          margin-top: 30px;
        }
        .translation-card {
          background: white;
          padding: 16px;
          margin-bottom: 16px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        }
        .copied-message {
          display: block;
          color: green;
          margin-bottom: 10px;
        }
        .mode-toggle {
          display: flex;
          justify-content: center;
          margin-bottom: 20px;
        }
        .mode-toggle button {
          background: #e5e7eb;
          border: none;
          padding: 10px 20px;
          margin: 0 8px;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s;
        }
        .mode-toggle button.active {
          background-color: #4f46e5;
          color: white;
        }
        .drop-zone {
          background: #f3f4f6;
          border: 2px dashed #cbd5e1;
          border-radius: 12px;
          padding: 40px;
          text-align: center;
          margin-bottom: 20px;
        }
        .drop-zone:hover {
          border-color: #4f46e5;
        }
      `}</style>
    </div>
  );
};

export default TranslatorPage;
