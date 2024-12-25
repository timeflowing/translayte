"use client";

import React, { useState } from "react";
import { translateText } from "./utils/translator";

const languages = [
  { code: "ar", name: "Arabic" },
  { code: "bn", name: "Bengali" },
  { code: "zh", name: "Chinese (Simplified)" },
  { code: "cs", name: "Czech" },
  { code: "nl", name: "Dutch" },
  { code: "en", name: "English" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "hi", name: "Hindi" },
  { code: "it", name: "Italian" },
  { code: "ja", name: "Japanese" },
  { code: "ko", name: "Korean" },
  { code: "ms", name: "Malay" },
  { code: "fa", name: "Persian" },
  { code: "pl", name: "Polish" },
  { code: "pt", name: "Portuguese" },
  { code: "ru", name: "Russian" },
  { code: "es", name: "Spanish" },
  { code: "tr", name: "Turkish" },
  { code: "vi", name: "Vietnamese" },
];

const TranslatorPage = () => {
  const [text, setText] = useState("");
  const [keyValue, setKeyValue] = useState("");
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [translations, setTranslations] = useState<
    { language: string; translation: string }[]
  >([]);

  const handleCheckboxChange = (languageCode: string) => {
    setSelectedLanguages((prev) =>
      prev.includes(languageCode)
        ? prev.filter((code) => code !== languageCode)
        : [...prev, languageCode]
    );
  };

  const handleTranslate = async () => {
    const results: { language: string; translation: string }[] = [];
    for (const lang of selectedLanguages) {
      const translation = await translateText(text, lang);
      const languageName = languages.find((l) => l.code === lang)?.name || lang;
      results.push({ language: languageName, translation });
    }
    setTranslations(results);
  };

  const handleCopyJSON = () => {
    const jsonOutput = translations
      .map((t) => `"${keyValue}": "${t.translation}"`)
      .join(",\n");
    navigator.clipboard.writeText(`{\n${jsonOutput}\n}`);
    alert("Copied JSON to clipboard!");
  };

  return (
    <div
      style={{
        maxWidth: "800px",
        margin: "40px auto",
        padding: "20px",
        fontFamily: "'Inter', sans-serif",
        backgroundColor: "#ffffff",
        borderRadius: "12px",
        border: "1px solid #e0e0e0",
      }}
    >
      <h1
        style={{
          textAlign: "center",
          fontSize: "28px",
          fontWeight: "600",
          color: "#333",
          marginBottom: "20px",
        }}
      >
        Translator Tool
      </h1>
      <div style={{ marginBottom: "20px" }}>
        <input
          type="text"
          value={keyValue}
          onChange={(e) => setKeyValue(e.target.value)}
          placeholder="Enter key (e.g., welcomeMessage)"
          style={{
            width: "100%",
            padding: "10px",
            fontSize: "16px",
            borderRadius: "8px",
            border: "1px solid #ccc",
            marginBottom: "10px",
            color: "black",
          }}
        />
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Enter text to translate..."
          style={{
            width: "100%",
            padding: "15px",
            fontSize: "16px",
            borderRadius: "8px",
            border: "1px solid #ccc",
            color: "black",
            resize: "none",
          }}
          rows={4}
        />
      </div>
      <div style={{ marginBottom: "20px" }}>
        <h3 style={{ fontSize: "18px", color: "#333", marginBottom: "10px" }}>
          Select Languages:
        </h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
            gap: "10px",
          }}
        >
          {languages.map((lang) => (
            <label
              key={lang.code}
              style={{
                display: "flex",
                alignItems: "center",
                fontSize: "16px",
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                value={lang.code}
                checked={selectedLanguages.includes(lang.code)}
                onChange={() => handleCheckboxChange(lang.code)}
                style={{
                  marginRight: "8px",
                  accentColor: "#4CAF50",
                  cursor: "pointer",
                }}
              />
              {lang.name}
            </label>
          ))}
        </div>
      </div>
      <button
        onClick={handleTranslate}
        style={{
          width: "100%",
          padding: "12px",
          fontSize: "16px",
          fontWeight: "bold",
          backgroundColor: "#4CAF50",
          color: "white",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer",
        }}
      >
        Translate
      </button>
      {translations.length > 0 && (
        <div
          style={{
            marginTop: "30px",
            padding: "20px",
            backgroundColor: "#f9f9f9",
            borderRadius: "12px",
            border: "1px solid #e0e0e0",
          }}
        >
          <h3
            style={{
              fontSize: "20px",
              fontWeight: "500",
              color: "#333",
              marginBottom: "10px",
            }}
          >
            Translations:
          </h3>
          <div style={{ marginBottom: "10px" }}>
            {translations.map((t, index) => (
              <div key={index} style={{ marginBottom: "10px" }}>
                <p
                  style={{
                    fontSize: "16px",
                    fontWeight: "bold",
                    marginBottom: "5px",
                    color: "#333",
                  }}
                >
                  {t.language}:
                </p>
                <pre
                  style={{
                    backgroundColor: "#fff",
                    padding: "10px",
                    borderRadius: "8px",
                    border: "1px solid #ddd",
                    fontSize: "14px",
                    whiteSpace: "pre-wrap",
                    color: "black",
                  }}
                >
                  {`"${keyValue}": "${t.translation}"`}
                </pre>
              </div>
            ))}
          </div>
          <button
            onClick={handleCopyJSON}
            style={{
              marginTop: "10px",
              padding: "10px 20px",
              fontSize: "14px",
              fontWeight: "bold",
              backgroundColor: "#007bff",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
            }}
          >
            Copy JSON
          </button>
        </div>
      )}
    </div>
  );
};

// Assign component to variable and then export
export default TranslatorPage;
