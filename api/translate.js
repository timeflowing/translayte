import axios from "axios";

const API_URL = "/api/translate";

export const translateText = async (
  text: string,
  toLanguage: string,
  fromLanguage: string = ""
): Promise<string> => {
  try {
    const response = await axios.post(API_URL, {
      text,
      toLanguage,
      fromLanguage,
    });

    if (response.data && response.data.translation) {
      const translation = response.data.translation;

      // Preserve the case of the input text
      if (text === text.toUpperCase()) {
        return translation.toUpperCase(); // Convert translation to uppercase
      } else if (text === text.toLowerCase()) {
        return translation.toLowerCase(); // Convert translation to lowercase
      } else {
        return translation; // Return as-is for mixed case
      }
    }

    throw new Error("Unexpected response structure");
  } catch (error) {
    const err = error as any;
    console.error(
      "Error translating text:",
      err.response ? err.response.data : err.message
    );
    throw error;
  }
};

export const translateIntoMultipleLanguages = async (
  text: string,
  targetLanguages: string[],
  fromLanguage: string = ""
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
    const err = error as any;
    console.error(
      "Error translating into multiple languages:",
      err.response ? err.response.data : err.message
    );
    throw error;
  }
};