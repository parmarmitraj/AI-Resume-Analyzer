const pdfParse = require('pdf-parse');

async function extractTextFromPDF(dataBuffer) {
  if (!dataBuffer || dataBuffer.length === 0) {
    throw new Error('PDF buffer is empty or invalid.');
  }

  try {
    const data = await pdfParse(dataBuffer);
    const text = data.text || '';
    
    return text.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  } catch (error) {
    throw new Error(`Failed to parse PDF document: ${error.message}`);
  }
}

module.exports = {
  extractTextFromPDF,
};
