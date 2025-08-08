require('dotenv').config({ path: '.env.local' });
const { translateText } = require('./app/utils/translator');

(async () => {
  try {
    const result = await translateText('Hello world', 'ces_Latn', 'eng_Latn');
  
  } catch (e) {
    console.error(e);
  }
})();