/**
 * PDF Parser Service
 * Extracts text content from PDF files for AI processing
 */

const fs = require('fs');
const pdfParse = require('pdf-parse');
let mammoth = null;
const logger = require('../utils/logger');

/**
 * Extract text content from PDF file
 * @param {string} filePath - Path to PDF file
 * @returns {Promise<string>} Extracted text content
 */
const extractTextFromPDF = async (filePath) => {
  try {
    if (!fs.existsSync(filePath)) {
      throw new Error('File not found');
    }

    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);

    const text = data.text
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();

    logger.info('PDF text extracted successfully', {
      pages: data.numpages,
      textLength: text.length,
    });

    return text;
  } catch (error) {
    logger.error('PDF extraction error:', error.message);
    throw new Error(`Failed to extract text from PDF: ${error.message}`);
  }
};

/**
 * Extract text content from text file
 * @param {string} filePath - Path to text file
 * @returns {Promise<string>} File content
 */
const extractTextFromFile = async (filePath) => {
  try {
    if (!fs.existsSync(filePath)) {
      throw new Error('File not found');
    }

    const content = fs.readFileSync(filePath, 'utf8');
    return content.trim();
  } catch (error) {
    logger.error('File read error:', error.message);
    throw new Error(`Failed to read file: ${error.message}`);
  }
};

/**
 * Extract text from any supported file type
 * @param {string} filePath - Path to file
 * @returns {Promise<string>} Extracted text
 */
const extractText = async (filePath) => {
  const ext = filePath.toLowerCase().split('.').pop();

  switch (ext) {
    case 'pdf':
      return extractTextFromPDF(filePath);
    case 'txt':
      return extractTextFromFile(filePath);
    case 'doc':
    case 'docx':
      try {
        if (!mammoth) {
          // Lazy-load mammoth so the service still works even
          // if DOC/DOCX is never used.
          // eslint-disable-next-line global-require
          mammoth = require('mammoth');
        }
      } catch (error) {
        logger.error('Mammoth (DOCX) library not installed:', error.message);
        throw new Error('DOC/DOCX support is not available. Please install the "mammoth" package on the backend.');
      }

      try {
        if (!fs.existsSync(filePath)) {
          throw new Error('File not found');
        }

        const result = await mammoth.extractRawText({ path: filePath });
        const text = (result.value || '')
          .replace(/\s+/g, ' ')
          .trim();

        if (!text) {
          throw new Error('No text could be extracted from DOC/DOCX file');
        }

        logger.info('DOC/DOCX text extracted successfully', {
          textLength: text.length,
        });

        return text;
      } catch (error) {
        logger.error('DOC/DOCX extraction error:', error.message);
        throw new Error(`Failed to extract text from DOC/DOCX: ${error.message}`);
      }
    default:
      throw new Error(`Unsupported file type: ${ext}`);
  }
};

/**
 * Get file metadata
 * @param {string} filePath - Path to file
 * @returns {Object} File metadata
 */
const getFileInfo = (filePath) => {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  const stats = fs.statSync(filePath);
  const ext = filePath.split('.').pop();

  return {
    path: filePath,
    size: stats.size,
    extension: ext,
    createdAt: stats.birthtime,
    modifiedAt: stats.mtime,
  };
};

module.exports = {
  extractTextFromPDF,
  extractTextFromFile,
  extractText,
  getFileInfo,
};
