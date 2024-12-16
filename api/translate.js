// pages/api/translate.js

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).send({ message: "Only POST requests allowed" });
  }

  const { text, languages } = req.body;

  // Validate input
  if (
    !text ||
    typeof text !== "string" ||
    !Array.isArray(languages) ||
    languages.length === 0
  ) {
    return res.status(400).json({ message: "Invalid input data" });
  }

  // Retrieve Azure Translator credentials from environment variables
  const apiKey = process.env.AZURE_TRANSLATOR_KEY;
  const endpoint = process.env.AZURE_TRANSLATOR_ENDPOINT;
  const region = process.env.AZURE_TRANSLATOR_REGION; // may be required depending on your endpoint
  if (!apiKey || !endpoint) {
    return res.status(500).json({ message: "Server configuration error." });
  }

  const translations = {};

  // For each language, call Azure Translator
  // API docs: https://learn.microsoft.com/azure/cognitive-services/translator/reference/v3-0-translate
  for (const lang of languages) {
    const translateUrl = `${endpoint}/translate?api-version=3.0&to=${encodeURIComponent(
      lang
    )}`;

    const body = [
      {
        text: text,
      },
    ];

    try {
      const response = await fetch(translateUrl, {
        method: "POST",
        headers: {
          "Ocp-Apim-Subscription-Key": apiKey,
          "Content-Type": "application/json; charset=UTF-8",
          ...(region ? { "Ocp-Apim-Subscription-Region": region } : {}),
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        console.error(`Error translating to ${lang}: ${response.statusText}`);
        translations[lang] = "Error occurred during translation";
        continue;
      }

      const result = await response.json();
      // result should look like:
      // [
      //   {
      //     translations: [
      //       {
      //         text: "translated text",
      //         to: "fr"
      //       }
      //     ]
      //   }
      // ]

      if (
        Array.isArray(result) &&
        result[0] &&
        Array.isArray(result[0].translations) &&
        result[0].translations[0] &&
        result[0].translations[0].text
      ) {
        translations[lang] = result[0].translations[0].text;
      } else {
        translations[lang] = "No translation available";
      }
    } catch (error) {
      console.error(`Error translating to ${lang}:`, error.message);
      translations[lang] = "Error occurred during translation";
    }
  }

  res.status(200).json({ translations });
}
