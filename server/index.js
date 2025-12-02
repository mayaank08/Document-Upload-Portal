const { serve } = require('@hono/node-server')
const { Hono } = require('hono')
const { cors } = require('hono/cors')
const fs = require('fs-extra')
const path = require('path')
const { extractTextFromFile } = require('./textExtraction')
const { parseLicenseData } = require('./licenseParser')
const { saveSubmission } = require('./dataStorage')

const app = new Hono()

// Enable CORS
app.use('/*', cors())

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads')
fs.ensureDirSync(uploadsDir)

// File upload endpoint
app.post('/api/upload', async (c) => {
  try {
    const body = await c.req.parseBody()
    const file = body.file

    if (!file) {
      return c.json({ error: 'No file provided' }, 400)
    }

    // Handle both File object and file data
    let fileData, fileName, mimeType

    if (file instanceof File) {
      fileData = await file.arrayBuffer()
      fileName = file.name
      mimeType = file.type
    } else if (file.filepath && file.originalFilename) {
      // Handle formidable file object
      fileData = await fs.readFile(file.filepath)
      fileName = file.originalFilename
      mimeType = file.mimetype || ''
    } else {
      return c.json({ error: 'Invalid file format' }, 400)
    }

    // Save file temporarily
    const buffer = Buffer.from(fileData)
    const fileExtension = path.extname(fileName).toLowerCase()
    const tempFileName = `upload_${Date.now()}${fileExtension}`
    const tempFilePath = path.join(uploadsDir, tempFileName)

    await fs.writeFile(tempFilePath, buffer)

    try {
      // Extract text from file
      const extractedText = await extractTextFromFile(tempFilePath, mimeType)
      
      // Log extracted text for debugging (first 500 chars)
      console.log('Extracted text (first 500 chars):', extractedText.substring(0, 500))

      // Parse license data from extracted text
      const extractedData = parseLicenseData(extractedText)
      
      // Log parsed data for debugging
      console.log('Parsed data:', extractedData)

      // Clean up temp file
      await fs.remove(tempFilePath)

      return c.json({
        success: true,
        extractedData,
        message: 'File processed successfully',
      })
    } catch (error) {
      // Clean up temp file on error
      await fs.remove(tempFilePath).catch(() => {})
      throw error
    }
  } catch (error) {
    console.error('Upload error:', error)
    return c.json(
      { error: error.message || 'Failed to process file' },
      500
    )
  }
})

// Submit form data endpoint
app.post('/api/submit', async (c) => {
  try {
    const data = await c.req.json()

    // Validate required fields
    const requiredFields = [
      'firstName',
      'lastName',
      'licenseNo',
      'expiryDate',
      'address',
      'dob',
    ]
    const missingFields = requiredFields.filter((field) => !data[field])

    if (missingFields.length > 0) {
      return c.json(
        { error: `Missing fields: ${missingFields.join(', ')}` },
        400
      )
    }

    // Save submission
    await saveSubmission(data)

    return c.json({ success: true, message: 'Data saved successfully' })
  } catch (error) {
    console.error('Submit error:', error)
    return c.json(
      { error: error.message || 'Failed to save data' },
      500
    )
  }
})

// Health check endpoint
app.get('/api/health', (c) => {
  return c.json({ status: 'ok' })
})

const port = 3001
console.log(`Server is running on port ${port}`)

serve({
  fetch: app.fetch,
  port,
})

