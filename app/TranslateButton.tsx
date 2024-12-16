"use client"; // required if you’re using Next.js App Router to ensure this component is rendered on the client

import React, { useState } from "react";

export default function TranslateButton() {
  const [result, setResult] = useState(null);

  const handleTranslate = () => {
    fetch("/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: "Hello",
        languages: ["fr", "es", "de", "it"],
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        console.log(data);
        setResult(data);
      })
      .catch((err) => console.error(err));
  };

  return (
    <div>
      <button onClick={handleTranslate}>Translate</button>
      {result && <pre>{JSON.stringify(result, null, 2)}</pre>}
    </div>
  );
}
