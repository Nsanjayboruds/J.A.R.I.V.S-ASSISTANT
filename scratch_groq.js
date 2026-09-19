const axios = require('axios');
require('dotenv').config({ path: './backend/.env' });

async function getModels() {
  try {
    const response = await axios.get('https://api.groq.com/openai/v1/models', {
      headers: { 'Authorization': `Bearer ${process.env.GROQ_API_KEY}` }
    });
    console.log(response.data.data.map(m => m.id).join('\n'));
  } catch (error) {
    console.error(error);
  }
}
getModels();
