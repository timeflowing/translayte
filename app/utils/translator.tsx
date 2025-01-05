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
      return response.data.translation;
    }

    throw new Error("Unexpected response structure");
  } catch (error) {
    console.error("Error translating text:", error);
    throw error;
  }
};
