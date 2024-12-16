import { NextResponse } from "next/server";

/**
 * Expected request body JSON structure:
 * {
 *   "text": "Hello",
 *   "languages": ["fr", "es", "de", "it"]
 * }
 */

export async function POST(req: Request) {
  try {
    const { text, languages } = await req.json();

    // Validate input
    if (
      !text ||
      !languages ||
      !Array.isArray(languages) ||
      languages.length === 0
    ) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const apiKey = process.env.AZURE_TRANSLATOR_KEY;
    const endpoint = process.env.AZURE_TRANSLATOR_ENDPOINT;
    const region = process.env.AZURE_TRANSLATOR_REGION;

    // Ensure we have all required environment variables
    if (!apiKey || !endpoint) {
      return NextResponse.json(
        { error: "Server configuration error. Missing Azure credentials." },
        { status: 500 }
      );
    }

    const translations: Record<string, string> = {};

    // Loop through each language code and attempt translation
    for (const lang of languages) {
      const translateUrl = `${endpoint}/translate?api-version=3.0&to=${encodeURIComponent(
        lang
      )}`;

      try {
        // Make the POST request to Azure Translator
        const response = await fetch(translateUrl, {
          method: "POST",
          headers: new Headers({
            "Ocp-Apim-Subscription-Key": apiKey,
            "Ocp-Apim-Subscription-Region": region || "",
            "Content-Type": "application/json; charset=UTF-8",
          }),
          body: JSON.stringify([{ text }]),
        });

        if (!response.ok) {
          console.error(`Error translating to ${lang}: ${response.statusText}`);
          translations[lang] = "Error occurred during translation";
          continue;
        }

        const result = await response.json();

        // The expected result format:
        // [
        //   {
        //     "translations": [
        //       { "text": "Bonjour", "to": "fr" }
        //     ]
        //   }
        // ]
        if (Array.isArray(result) && result[0]?.translations?.[0]?.text) {
          translations[lang] = result[0].translations[0].text;
        } else {
          translations[lang] = "No translation available";
        }
      } catch (error: unknown) {
        if (error instanceof Error) {
          console.error(`Error translating to ${lang}:`, error.message);
          translations[lang] = "Error occurred during translation";
        }
      }
    }

    return NextResponse.json({ translations });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("Error:", error.message);
      return NextResponse.json(
        { error: "Internal Server Error" },
        { status: 500 }
      );
    }
  }
}

export async function GET() {
  // If someone tries to GET this endpoint, let's just return Method Not Allowed
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
}
