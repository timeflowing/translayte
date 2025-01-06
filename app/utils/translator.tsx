import axios from "axios";

export const translateText = async (
  text: string,
  toLanguage: string,
  fromLanguage: string = ""
): Promise<string> => {
  try {
    const response = await axios.post("/api/translate", {
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
    console.error("Error translating text:", error);
    throw error;
  }
};

// Translate into multiple languages
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
    console.error("Error translating into multiple languages:", error);
    throw error;
  }
};

// Example usage
(async () => {
  const text = "Hello, how are you?";
  const targetLanguages = ["ar", "fr", "es", "hi"]; // Arabic, French, Spanish, Hindi

  try {
    const translations = await translateIntoMultipleLanguages(
      text,
      targetLanguages
    );
    console.log("Translations:", translations);
  } catch (error) {
    console.error("Translation error:", error);
  }
})();
