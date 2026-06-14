/**
 * Text Extraction Utility
 * Handles extraction of text from PDF and DOCX files on the client side
 */

import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

/**
 * Extract text from a PDF file
 * @param file - PDF File object
 * @returns Extracted text content
 */
const extractTextFromPDF = async (file: File): Promise<string> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    let extractedText = '';
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      extractedText += pageText + '\n';
    }
    
    return extractedText.trim();
  } catch (error) {
    throw new Error(`Failed to extract text from PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Extract text from a DOCX file
 * @param file - DOCX File object
 * @returns Extracted text content
 */
const extractTextFromDOCX = async (file: File): Promise<string> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value.trim();
  } catch (error) {
    throw new Error(`Failed to extract text from DOCX: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Extract text from an uploaded file (PDF or DOCX)
 * @param file - File object (PDF, DOC, or DOCX)
 * @returns Extracted text content
 */
export const extractTextFromFile = async (file: File): Promise<string> => {
  const fileName = file.name.toLowerCase();
  
  if (fileName.endsWith('.pdf')) {
    return extractTextFromPDF(file);
  } else if (fileName.endsWith('.docx')) {
    return extractTextFromDOCX(file);
  } else if (fileName.endsWith('.doc')) {
    // Old DOC format - try DOCX extraction first
    try {
      return await extractTextFromDOCX(file);
    } catch {
      throw new Error('DOC format is not fully supported. Please use DOCX instead.');
    }
  } else {
    throw new Error('Unsupported file format. Please upload PDF or DOCX files only.');
  }
};

/**
 * Validate file before extraction
 * @param file - File object
 * @returns True if file is valid
 */
export const isValidFileFormat = (file: File): boolean => {
  const validExtensions = ['.pdf', '.doc', '.docx'];
  const fileName = file.name.toLowerCase();
  return validExtensions.some(ext => fileName.endsWith(ext));
};

/**
 * Get file size in MB
 * @param file - File object
 * @returns Size in MB
 */
export const getFileSizeInMB = (file: File): number => {
  return file.size / (1024 * 1024);
};

/**
 * Check if file size is within limit (50 MB)
 * @param file - File object
 * @returns True if file is within size limit
 */
export const isFileSizeValid = (file: File, maxSizeMB = 50): boolean => {
  return getFileSizeInMB(file) <= maxSizeMB;
};
