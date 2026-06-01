const fs       = require('fs');
const path     = require('path');
const pdfParse = require('pdf-parse');
const mammoth  = require('mammoth');

/**
 * Extract plain text from a resume file.
 * Supports .pdf, .doc, .docx
 *
 * @param {string} filePath  Absolute path to the file
 * @param {string} mimeType  MIME type from multer
 * @returns {Promise<string>} Extracted text
 */
async function extractText(filePath, mimeType) {
  const ext = path.extname(filePath).toLowerCase();

  try {
    if (ext === '.pdf' || mimeType === 'application/pdf') {
      return await parsePDF(filePath);
    }

    if (['.doc', '.docx'].includes(ext) ||
        mimeType === 'application/msword' ||
        mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      return await parseDOCX(filePath);
    }

    if (ext === '.txt' || mimeType === 'text/plain') {
      return fs.readFileSync(filePath, 'utf8');
    }

    throw new Error(`Unsupported file type: ${ext}`);
  } catch (err) {
    console.error(`[parser] Failed to parse ${filePath}:`, err.message);
    return '';   // Return empty string; AI will handle gracefully
  }
}

async function parsePDF(filePath) {
  const buffer = fs.readFileSync(filePath);
  const data   = await pdfParse(buffer, {
    // Normalise whitespace; remove excessive blank lines
    pagerender: (pageData) => {
      return pageData.getTextContent().then((textContent) => {
        return textContent.items.map((item) => item.str).join(' ');
      });
    },
  });
  return cleanText(data.text);
}

async function parseDOCX(filePath) {
  const result = await mammoth.extractRawText({ path: filePath });
  if (result.messages.length) {
    console.warn('[parser] mammoth warnings:', result.messages);
  }
  return cleanText(result.value);
}

function cleanText(raw) {
  return raw
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[ \t]+/g, ' ')           // collapse horizontal whitespace
    .replace(/\n{3,}/g, '\n\n')        // max 2 consecutive newlines
    .trim();
}

module.exports = { extractText };
