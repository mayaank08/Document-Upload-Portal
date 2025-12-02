const fs = require('fs-extra')
const path = require('path')

const dataDir = path.join(__dirname, 'data')
const submissionsFile = path.join(dataDir, 'submissions.json')

// Ensure data directory exists
fs.ensureDirSync(dataDir)

/**
 * Save form submission data
 * @param {Object} data - Form data to save
 */
async function saveSubmission(data) {
  try {
    // Read existing submissions
    let submissions = []
    if (await fs.pathExists(submissionsFile)) {
      const content = await fs.readFile(submissionsFile, 'utf-8')
      submissions = JSON.parse(content)
    }

    // Add new submission with timestamp
    submissions.push({
      ...data,
      submittedAt: new Date().toISOString(),
    })

    // Write back to file
    await fs.writeFile(submissionsFile, JSON.stringify(submissions, null, 2))

    return { success: true }
  } catch (error) {
    console.error('Error saving submission:', error)
    throw new Error('Failed to save submission')
  }
}

/**
 * Get all submissions (for debugging/admin purposes)
 */
async function getSubmissions() {
  try {
    if (await fs.pathExists(submissionsFile)) {
      const content = await fs.readFile(submissionsFile, 'utf-8')
      return JSON.parse(content)
    }
    return []
  } catch (error) {
    console.error('Error reading submissions:', error)
    return []
  }
}

module.exports = { saveSubmission, getSubmissions }

