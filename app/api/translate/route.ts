import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { text, toLanguage, fromLanguage = "" } = await req.json();

    if (!text || !toLanguage) {
      return NextResponse.json(
        { error: "Invalid input. Text and target language are required." },
        { status: 400 }
      );
    }

    const subscriptionKey = process.env.TRANSLATOR_SUBSCRIPTION_KEY;
    const endpoint = process.env.TRANSLATOR_ENDPOINT;
    const region = process.env.TRANSLATOR_REGION;

    if (!subscriptionKey || !endpoint || !region) {
      return NextResponse.json(
        { error: "Server configuration error. Missing Azure credentials." },
        { status: 500 }
      );
    }

    const response = await fetch(
      `${endpoint}/translate?api-version=3.0&to=${toLanguage}${
        fromLanguage ? `&from=${fromLanguage}` : ""
      }`,
      {
        method: "POST",
        headers: {
          "Ocp-Apim-Subscription-Key": subscriptionKey,
          "Ocp-Apim-Subscription-Region": region,
          "Content-Type": "application/json",
        },
        body: JSON.stringify([{ text }]),
      }
    );

    if (!response.ok) {
      throw new Error(`Translation failed: ${response.statusText}`);
    }

    const data = await response.json();

    if (Array.isArray(data) && data[0]?.translations?.[0]?.text) {
      return NextResponse.json({ translation: data[0].translations[0].text });
    }

    throw new Error("Unexpected response structure");
  } catch (error) {
    if (error instanceof Error) {
      console.error("Translation API error:", error.message);
    } else {
      console.error("Unknown error occurred during translation:", error);
    }
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
