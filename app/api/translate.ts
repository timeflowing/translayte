import axios, { AxiosResponse } from "axios";

const translateText = async (
  text: string,
  toLanguage: string,
  fromLanguage: string = ""
): Promise<string> => {
  try {
    const response: AxiosResponse<any, any> = await axios.post(
      `${
        process.env.TRANSLATOR_ENDPOINT
      }/translate?api-version=3.0&to=${toLanguage}${
        fromLanguage ? `&from=${fromLanguage}` : ""
      }`,
      [
        {
          text,
        },
      ],
      {
        headers: {
          "Ocp-Apim-Subscription-Key": process.env.TRANSLATOR_SUBSCRIPTION_KEY!,
          "Ocp-Apim-Subscription-Region": process.env.TRANSLATOR_REGION!,
          "Content-Type": "application/json",
        },
      }
    );

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

// Assigning the function to a variable and then exporting it
export default translateText;
