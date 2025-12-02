const fs = require('fs-extra')
const pdfParse = require('pdf-parse')
const Tesseract = require('tesseract.js')
const path = require('path')
const { fromPath: pdfToPicFromPath } = require('pdf2pic')

/**
 * Extract text from various file types
 * @param {string} filePath - Path to the file
 * @param {string} mimeType - MIME type of the file
 * @returns {Promise<string>} Extracted text
 */
async function extractTextFromFile(filePath, mimeType) {
  const fileExtension = path.extname(filePath).toLowerCase()

  try {
    // Handle PDF files
    if (fileExtension === '.pdf' || mimeType === 'application/pdf') {
      const dataBuffer = await fs.readFile(filePath)
      const data = await pdfParse(dataBuffer)

      if (data.text && data.text.trim().length > 50) {
        // Text-based PDF: use parsed text directly
        return data.text
      }

      // Fallback: scanned PDF -> run OCR on first page image
      console.log('PDF appears to be scanned image, falling back to OCR...')

      const tempDir = path.join(path.dirname(filePath), 'tmp_pdf_images')
      await fs.ensureDir(tempDir)

      const converter = pdfToPicFromPath(filePath, {
        density: 150,
        saveFilename: `page`,
        savePath: tempDir,
        format: 'png',
      })

      // Convert only first page to reduce processing time
      const pageResult = await converter(1)
      const imagePath = pageResult.path

      const {
        data: { text },
      } = await Tesseract.recognize(imagePath, 'eng', {
        logger: () => {},
        tessedit_pageseg_mode: '6',
        tessedit_char_whitelist:
          'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 /-.,:()',
      })

      // Clean up temp image
      await fs.remove(tempDir).catch(() => {})

      const cleanedTextFromPdf = text
        .replace(/[|;]/g, ' ')
        .replace(/\r/g, '')
        .replace(/[ ]{2,}/g, ' ')
        .replace(/\t+/g, ' ')
        .trim()

      return cleanedTextFromPdf
    }

    // Handle text files
    if (fileExtension === '.txt' || mimeType === 'text/plain') {
      const text = await fs.readFile(filePath, 'utf-8')
      return text
    }

    // Handle image files (JPG, PNG) using OCR
    if (
      ['.jpg', '.jpeg', '.png'].includes(fileExtension) ||
      ['image/jpeg', 'image/jpg', 'image/png'].includes(mimeType)
    ) {
      const {
        data: { text },
      } = await Tesseract.recognize(filePath, 'eng', {
        logger: (m) => {
          // Suppress verbose logging
          if (m.status === 'recognizing text') {
            // Only log progress for recognition
          }
        },
        // Improved OCR settings for license cards
        tessedit_pageseg_mode: '6', // Assume uniform block of text
        tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 /-.,:()',
      })
      
      // Clean up OCR output - preserve newlines for block context but normalize spaces
      const cleanedText = text
        .replace(/[|;]/g, ' ')
        .replace(/\r/g, '')
        .replace(/[ ]{2,}/g, ' ')
        .replace(/\t+/g, ' ')
        .trim()
      
      return cleanedText
    }

    throw new Error(`Unsupported file type: ${fileExtension}`)
  } catch (error) {
    console.error('Text extraction error:', error)
    throw new Error(`Failed to extract text: ${error.message}`)
  }
}

module.exports = { extractTextFromFile }

