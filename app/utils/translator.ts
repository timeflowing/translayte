import axios from "axios";

const HUGGINGFACE_API_URL =   "https://api-inference.huggingface.co/models/facebook/mbart-large-50-many-to-many-mmt";
const HUGGINGFACE_API_TOKEN = process.env.NEXT_PUBLIC_HUGGINGFACE_API_TOKEN;

const MOCK_CZ: Record<string, string> = {
        'app.title': 'Translayte',
        'app.description': 'Jednoduchý nástroj pro překlad obsahu vaší aplikace.',
        'app.menu.home': 'Domů',
        'app.menu.about': 'O aplikaci',
        'app.menu.contact': 'Kontaktujte nás',
        'auth.login.title': 'Přihlásit se',
        'auth.login.username': 'Uživatelské jméno',
        'auth.login.password': 'Heslo',
        'auth.login.button': 'Přihlásit se',
        'auth.login.forgot': 'Zapomněli jste heslo?',
        'auth.logout': 'Odhlásit se',
        'dashboard.welcome': 'Vítejte, {{name}}!',
        'dashboard.notifications.zero': 'Nemáte žádná oznámení.',
        'dashboard.notifications.one': 'Máte 1 oznámení.',
        'dashboard.notifications.other': 'Máte {{count}} oznámení.',
        'dashboard.actions.save': 'Uložit změny',
        'dashboard.actions.cancel': 'Zrušit',
        'dashboard.actions.delete': 'Smazat',
        'errors.network': 'Chyba sítě. Zkuste to prosím znovu.',
        'errors.notFound': 'Stránka nenalezena.',
        'errors.forbidden': 'Nemáte oprávnění k přístupu na tuto stránku.',
    };

export const translateText = async (
  text: string,
  toLanguage: string,
  fromLanguage: string = "eng_Latn"
): Promise<string> => {
  // console.log(HUGGINGFACE_API_TOKEN)
  // console.log(text, toLanguage, fromLanguage);
  // try {
  //   const response = await axios.post(
  //     HUGGINGFACE_API_URL,
  //     {
  //       inputs: text,
  //       parameters: {
  //         src_lang: fromLanguage,
  //         tgt_lang: toLanguage,
  //       },
  //     },
  //     {
  //       headers: {
  //         Authorization: `Bearer ${HUGGINGFACE_API_TOKEN}`,
  //         "Content-Type": "application/json",
  //       },
  //     }
  //   );

  //   const translation = response.data[0]?.translation_text;
  //   console.log(translation+'coo')
  //   return translation || "";
  // } catch (error) {
  //   console.error("Translation error:", error);
  //   throw error;
  // }




    // Simulate network delay
  await new Promise(res => setTimeout(res, 100));
  // Only mock Czech (cs_CZ), otherwise return original
  // if (toLanguage === "cs_CZ") {
  //   // Try to find the key by value (reverse lookup)
  //   const found = Object.entries(MOCK_CZ).find(([_, v]) => v === text);
  //   if (found) return found[1];
  //   // Or try to find by key if you pass the key as text
  //   if (MOCK_CZ[text]) return MOCK_CZ[text];
  //   // Fallback: append [cs_CZ]
  //   return `[cs_CZ] ${text}`;
  // }
  // For other languages, just return the original text
  return MOCK_CZ;
};
