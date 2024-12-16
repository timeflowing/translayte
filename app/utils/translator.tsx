import axios from "axios";

const subscriptionKey = process.env.NEXT_PUBLIC_TRANSLATOR_SUBSCRIPTION_KEY;
const endpoint = process.env.NEXT_PUBLIC_TRANSLATOR_ENDPOINT;
const region = process.env.NEXT_PUBLIC_TRANSLATOR_REGION;

// type TranslateTextParams = {
//   text: string; // The text to translate
//   toLanguage: string; // The target language
//   fromLanguage?: string; // The source language (optional)
// };

// Function to translate text
export const translateText = async (
  text: string,
  toLanguage: string,
  fromLanguage: string = ""
): Promise<string> => {
  try {
    const response = await axios.post(
      `${endpoint}/translate?api-version=3.0&to=${toLanguage}${
        fromLanguage ? `&from=${fromLanguage}` : ""
      }`,
      [
        {
          text,
        },
      ],
      {
        headers: {
          "Ocp-Apim-Subscription-Key": subscriptionKey,
          "Ocp-Apim-Subscription-Region": region, // Include if required
          "Content-Type": "application/json",
        },
      }
    );

    // Ensure the response structure is valid
    if (
      response.data &&
      Array.isArray(response.data) &&
      response.data[0]?.translations?.[0]?.text
    ) {
      return response.data[0].translations[0].text;
    }

    throw new Error("Unexpected response structure");
  } catch (error) {
    console.error("Error translating text:", error);
    throw error;
  }
};
