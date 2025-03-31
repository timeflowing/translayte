import axios from "axios";

// Replace this with your actual token from Hugging Face
const HUGGINGFACE_API_TOKEN = process.env.NEXT_PUBLIC_HUGGINGFACE_API_TOKEN;

const HUGGINGFACE_API_URL =
  "https://api-inference.huggingface.co/models/facebook/nllb-200-distilled-600M";

// Example: eng_Latn → ces_Latn
export const translateText = async (
  text: string,
  toLanguage: string,
  fromLanguage: string = "eng_Latn"
): Promise<string> => {
  try {
    const response = await axios.post(
      HUGGINGFACE_API_URL,
      {
        inputs: text,
        parameters: {
          src_lang: fromLanguage,
          tgt_lang: toLanguage,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${HUGGINGFACE_API_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    const translation = response.data[0]?.translation_text;

    if (!translation) throw new Error("No translation received");

    // Preserve the case of the input text
    if (text === text.toUpperCase()) {
      return translation.toUpperCase();
    } else if (text === text.toLowerCase()) {
      return translation.toLowerCase();
    } else {
      return translation;
    }
  } catch (error) {
    console.error(
      "Error translating text:",
      (error as import("axios").AxiosError).response?.data || error
    );
    throw error;
  }
};

// Translate into multiple languages
export const translateIntoMultipleLanguages = async (
  text: string,
  targetLanguages: string[],
  fromLanguage: string = "eng_Latn"
): Promise<{ language: string; translation: string }[]> => {
  try {
    const translations = await Promise.all(
      targetLanguages.map(async (lang) => {
        const translation = await translateText(text, lang, fromLanguage);
        return { language: lang, translation };
      })
    );
    return translations;
  } catch (error) {
    console.error("Error translating into multiple languages:", error);
    throw error;
  }
};
