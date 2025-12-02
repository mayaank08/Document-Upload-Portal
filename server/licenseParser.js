/**
 * parseLicenseData.js
 * Improved parser for driver's license text with robust address extraction
 */

function normalizeDate(dateStr) {
  if (!dateStr) {
    console.log('normalizeDate: Empty date string')
    return ''
  }

  // Handle month name format: "Jan 15, 2025" or "January 15, 2025"
  const monthNames = {
    'JAN': '01', 'FEB': '02', 'MAR': '03', 'APR': '04',
    'MAY': '05', 'JUN': '06', 'JUL': '07', 'AUG': '08',
    'SEP': '09', 'OCT': '10', 'NOV': '11', 'DEC': '12',
    'JANUARY': '01', 'FEBRUARY': '02', 'MARCH': '03', 'APRIL': '04',
    'JUNE': '06', 'JULY': '07', 'AUGUST': '08', 'SEPTEMBER': '09',
    'OCTOBER': '10', 'NOVEMBER': '11', 'DECEMBER': '12'
  }

  // Month name formats
  let m = dateStr.match(/([A-Z]{3,9})\s+(\d{1,2}),?\s+(\d{4})/i)
  if (m) {
    const month = monthNames[m[1].toUpperCase()]
    if (month) {
      const day = m[2].padStart(2, '0')
      const year = m[3]
      return `${year}-${month}-${day}`
    }
  }

  m = dateStr.match(/(\d{1,2})\s+([A-Z]{3,9})\s+(\d{4})/i)
  if (m) {
    const month = monthNames[m[2].toUpperCase()]
    if (month) {
      const day = m[1].padStart(2, '0')
      const year = m[3]
      return `${year}-${month}-${day}`
    }
  }

  // Normalize separators to '/'
  const cleaned = dateStr.replace(/[\/\-\.]/g, '/').trim()
  const parts = cleaned.split('/').filter(p => p.length > 0)

  if (parts.length !== 3) {
    return ''
  }

  let year, month, day
  const firstPart = parseInt(parts[0], 10)
  const secondPart = parseInt(parts[1], 10)

  if (parts[0].length === 4) {
    // YYYY/MM/DD
    year = parts[0]
    month = parts[1].padStart(2, '0')
    day = parts[2].padStart(2, '0')
  } else if (firstPart > 12 && firstPart <= 31) {
    // DD/MM/YYYY
    day = parts[0].padStart(2, '0')
    month = parts[1].padStart(2, '0')
    year = parts[2].length === 2 ? `20${parts[2]}` : parts[2]
  } else if (secondPart > 12 && secondPart <= 31) {
    // MM/DD/YYYY
    month = parts[0].padStart(2, '0')
    day = parts[1].padStart(2, '0')
    year = parts[2].length === 2 ? `20${parts[2]}` : parts[2]
  } else {
    // Ambiguous: prefer DD/MM/YYYY for likely Indian format if year is far future,
    // otherwise default to MM/DD/YYYY
    const yearValue = parseInt(parts[2].length === 2 ? `20${parts[2]}` : parts[2], 10)
    const currentYear = new Date().getFullYear()
    if (!Number.isNaN(yearValue) && yearValue > currentYear + 5) {
      day = parts[0].padStart(2, '0')
      month = parts[1].padStart(2, '0')
      year = parts[2].length === 2 ? `20${parts[2]}` : parts[2]
    } else {
      month = parts[0].padStart(2, '0')
      day = parts[1].padStart(2, '0')
      year = parts[2].length === 2 ? `20${parts[2]}` : parts[2]
    }
  }

  // Validate
  const monthNum = parseInt(month, 10)
  const dayNum = parseInt(day, 10)
  if (monthNum < 1 || monthNum > 12) return ''
  if (dayNum < 1 || dayNum > 31) return ''
  if (year.length !== 4) return ''

  return `${year}-${month}-${day}`
}

/**
 * Clean address block to a single-line, normalized string
 */
function cleanAddressBlock(blk) {
  if (!blk) return ''
  return blk
    .replace(/[|;]/g, ', ')
    .replace(/\r?\n|\r/g, ', ')
    .replace(/\s*,\s*/g, ', ')
    .replace(/\s+/g, ' ')
    .replace(/,+/g, ',')
    .trim()
    .replace(/^,|,$/g, '')
}

/**
 * Try to capture an ADDRESS label block (multiline, non-greedy)
 * Returns the raw captured address block or null
 */
function tryAddressFromLabelStrict(txt) {
  if (!txt) return null
  // Strict label pattern: anchor to Address: and stop before known next labels/keywords.
  // Non-greedy capture of up to ~200 chars after the label.
  const labelPattern = /(?:\bADDRESS\b|\bADDR\b|\bRESIDENCE\b|\bRES\b)\s*[:\-]?\s*([\s\S]{5,200}?)(?=(?:\n\S{1,20}\s*[:\-]|DATE\s+OF\s+BIRTH|DATE|DOB|BLOOD|ORGAN|SON|DAUGHTER|WIFE|HOLDER|SIGNATURE|VALIDITY|ISSUE|EXP|$))/i
  const m = txt.match(labelPattern)
  if (m && m[1]) return m[1].trim()
  return null
}

/**
 * Main parser
 */
function parseLicenseData(text) {
  if (!text || typeof text !== 'string') {
    console.log('parseLicenseData: Empty or invalid text')
    return {}
  }

  const normalizedText = text.toUpperCase()
  const originalText = text
  const result = {}

  // Basic detection for Indian license (heuristic)
  const isIndianLicense = /INDIAN\s*UNION|RAJASTHAN|GOVERNMENT\s*OF\s*(RAJASTHAN|INDIA)|\bRJ\d{2}\b/i.test(text)

  // --- Name extraction (kept largely as before with slight cleanup) ---
  const fullNamePatterns = [
    /(?:^|\n)\s*NAME\s*[:\-]?\s*([A-Z]{3,20})\s+([A-Z]{3,20})/i,
    /NAME\s*[:\-]?\s*([A-Z]{3,20})\s+([A-Z]{3,20})/i,
  ]

  let fullNameMatch = null
  for (const pattern of fullNamePatterns) {
    fullNameMatch = normalizedText.match(pattern) || originalText.match(pattern)
    if (fullNameMatch && fullNameMatch[1] && fullNameMatch[2]) {
      break
    }
  }

  if (fullNameMatch && fullNameMatch[1] && fullNameMatch[2]) {
    result.firstName = fullNameMatch[1].trim()
    result.lastName = fullNameMatch[2].trim()
  } else {
    // Fallback name patterns
    const firstNamePatterns = [
      /(?:FIRST\s*NAME|FN|GIVEN\s*NAME|FNAME|1\.2\s*NAME)[\s:]*([A-Z][A-Z\s]{1,30}?)(?:\s*\n|LAST|DOB|EXP|DLN|LICENSE|ADDRESS|$)/i,
      /(?:NAME|NOM)[\s:]*([A-Z][A-Z\s]{2,30}?)(?:\s*\n|DOB|EXP|ADDRESS|SON|DAUGHTER|WIFE|$)/i,
      /(?:NAME|NOM)[\s:]*([A-Z]+)\s+([A-Z]+)/i,
      /^([A-Z][a-z]+)\s+[A-Z][a-z]+/
    ]
    for (const pattern of firstNamePatterns) {
      const match = originalText.match(pattern) || normalizedText.match(pattern)
      if (match && match[1]) {
        let name = match[1].trim().replace(/\s+/g, ' ')
        const nameParts = name.split(/\s+/)
        if (nameParts.length > 1 && !result.lastName) {
          const first = nameParts[0]
          const last = nameParts.slice(1).join(' ')
          result.firstName = first.charAt(0).toUpperCase() + first.slice(1).toLowerCase()
          result.lastName = last.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
        } else {
          result.firstName = name.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')
        }
        break
      }
    }
  }

  // Last name additional attempts if still missing
  if (!result.lastName) {
    const lastNamePatterns = [
      /(?:LAST\s*NAME|LN|SURNAME|FAMILY\s*NAME|LNAME)[\s:]*([A-Z][A-Z\s]{1,30}?)(?:\s*\n|DOB|EXP|DLN|LICENSE|ADDRESS|$)/i,
      /\b([A-Z]{3,20})\s+([A-Z]{3,20})\b/,
      /\b([A-Z][a-z]{2,15})\s+([A-Z][a-z]{2,15})\b/
    ]
    for (const pattern of lastNamePatterns) {
      const match = originalText.match(pattern) || normalizedText.match(pattern)
      if (match) {
        if (match[2] && !result.firstName) {
          result.firstName = match[1].trim()
          result.lastName = match[2].trim()
        } else {
          const name = (match[1] || match[2] || '').trim()
          if (name) {
            result.lastName = name.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')
          }
        }
        if (result.lastName) break
      }
    }
  }

  // --- License number extraction ---
  const licensePatterns = [
    /(?:LICENSE|DLN|DL\s*#|LIC\s*#|LICENSE\s*NUMBER|DRIVER\s*LICENSE\s*#|DL\s*NUMBER|4[Dd]\s*NUMBER|NUMERO)[\s:]*([A-Z0-9\s\-]{6,25})/i,
    /(?:DLN|DL\s*#|DL\s*NO|NUMBER|NUMERO)[\s:]*([A-Z0-9\s\-]{6,25})/i,
    /\b([A-Z]{2}\d{2}[\s\-]?\d{8,12})\b/,
    /\b([A-Z]\d{4}[\s\-]\d{5}[\s\-]\d{5})\b/,
    /\b([A-Z]{1,4}\d{5,15})\b/,
    /\b(\d{6,15}[A-Z]{0,4})\b/
  ]
  for (const pattern of licensePatterns) {
    const match = originalText.match(pattern) || normalizedText.match(pattern)
    if (match && match[1]) {
      result.licenseNo = match[1].trim().replace(/\s+/g, ' ').toUpperCase()
      break
    }
  }

  // --- Expiry date extraction ---
  const expiryPatterns = [
    /(?:VALIDITY\s*\(?\s*TR\s*\)?|EXP|EXPIRY|EXPIRES|EXP\s*DATE|EXPIRATION)[\s:]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4})/i,
    /(?:EXP|EXPIRY|EXPIRES|EXP\s*DATE|EXPIRATION|EXP\s*D|4[Bb]\s*EXP|EXP\.)[\s:]*(\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2})/i,
    /(?:EXP|EXPIRY|EXPIRES|EXP\s*DATE|EXPIRATION|EXP\s*D)[\s:]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i,
    /(?:EXPIRES|EXPIRY|EXP)[\s:]*([A-Z]{3,9}\s+\d{1,2},?\s+\d{4})/i,
    /EXP[IRY]*[:\s]+(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i,
    /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4})(?:\s|$)/
  ]
  for (let i = 0; i < expiryPatterns.length; i++) {
    const p = expiryPatterns[i]
    const match = originalText.match(p) || normalizedText.match(p)
    if (match && match[1]) {
      const norm = normalizeDate(match[1].trim())
      if (norm) {
        result.expiryDate = norm
        break
      }
    }
  }

  // --- DOB extraction ---
  const dobPatterns = [
    /(?:DATE\s*OF\s*BIRTH|DOB|BIRTH\s*DATE|BORN)[\s:]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4})/i,
    /(?:DOB|DATE\s*OF\s*BIRTH|BIRTH\s*DATE|BORN|3\s*DOB|DDN)[\s:]*(\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2})/i,
    /(?:DOB)[\s:]*(\d{2}[\/\-\.]\d{2}[\/\-\.]\d{4})/i,
    /(?:BORN)[\s:]*([A-Z]{3}\s+\d{1,2},?\s+\d{4})/i
  ]
  for (const p of dobPatterns) {
    const m = originalText.match(p) || normalizedText.match(p)
    if (m && m[1]) {
      const norm = normalizeDate(m[1].trim())
      if (norm) {
        result.dob = norm
        break
      }
    }
  }

  // ---------- ADDRESS extraction (REPLACED) ----------
  // Strict approach: anchor to "Address:" label and capture only the following block up to next label keywords.
  let address = null

  // 1) Strong label-based capture (original text preferred)
  address = tryAddressFromLabelStrict(originalText) || tryAddressFromLabelStrict(normalizedText)

  // 2) Fuzzy fallback: sometimes OCR breaks the label "ADDRESS" -> try small fuzzy pattern
  if (!address) {
    const fuzzy = /ADD[A-Z]{0,4}ESS\s*[:\-]?\s*([\s\S]{5,200}?)(?=(?:\n\S{1,20}\s*[:\-]|DATE\s+OF\s+BIRTH|DATE|DOB|BLOOD|ORGAN|SON|DAUGHTER|WIFE|HOLDER|SIGNATURE|VALIDITY|ISSUE|EXP|$))/i
    const m = originalText.match(fuzzy) || normalizedText.match(fuzzy)
    if (m && m[1]) address = m[1].trim()
  }

  // 3) Pincode fallback (only if label capture failed)
  if (!address) {
    // common Indian pincode: 6 digits; allow minor OCR confusion by accepting O/0
    const pincodeRegexes = [
      /\b(\d{6})\b/,                        // clean 6 digits
      /\b([0O]\d{5})\b/,                    // 0/O confusion
      /\b(\d{4}[0O]\d)\b/,                  // mixed confusion
      /\b(\d{5}[0O])\b/
    ]
    let pMatch = null
    for (const rx of pincodeRegexes) {
      pMatch = originalText.match(rx) || normalizedText.match(rx)
      if (pMatch && pMatch[1]) break
    }

    if (pMatch && pMatch[1]) {
      const p = pMatch[1]
      // find index in originalText if possible
      const idx = originalText.indexOf(p) >= 0 ? originalText.indexOf(p) : normalizedText.indexOf(p)
      const srcText = idx >= 0 ? (originalText.indexOf(p) >= 0 ? originalText : normalizedText) : originalText
      const pos = idx >= 0 ? idx : Math.max(0, srcText.length - 1)
      const start = Math.max(0, pos - 160)
      const end = Math.min(srcText.length, pos + 6)
      address = srcText.substring(start, end)
    }
  }

  // ---------- ADDRESS post-processing (REPLACED CLEANUP) ----------
  if (address) {
    // 1) Basic normalization: replace newlines and weird punctuation, collapse spaces
    let cleaned = address
      .replace(/[\r\n]+/g, ' ')
      // replace visually similar OCR garbage with space (keep comma and dash)
      .replace(/[|;(){}[\]\/\\\"*^%$#@<>~+=]/g, ' ')
      // replace multiple non-word except comma/dash/digits with space
      .replace(/[^A-Za-z0-9,.\- ]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()

    // 2) Remove trailing slashes or stray punctuation
    cleaned = cleaned.replace(/[\/\\]+/g, ' ').replace(/\s*,\s*$/,'').trim()

    // 3) Lowercase / uppercase normalization for matching, but keep original for final
    const cleanedUpper = cleaned.toUpperCase()

    // 4) Known place anchors (common locality tokens) - prefer substring starting at anchor if found
    const anchors = ['PARTAPUR','JAITPUR','BEHROR','ALWAR','RAJASTHAN','JAIPUR','DELHI','MUMBAI','NAGPUR','UDAIPUR']
    let startIdx = -1
    for (const a of anchors) {
      const idx = cleanedUpper.indexOf(a)
      if (idx !== -1) {
        startIdx = idx
        break
      }
    }

    // 5) If no anchor found, try to find the first capitalized place-like sequence before the pincode
    if (startIdx === -1) {
      const pincodeMatch = cleaned.match(/\b\d{6}\b/)
      const pidx = pincodeMatch ? cleaned.indexOf(pincodeMatch[0]) : -1

      if (pidx !== -1) {
        // look backwards up to 160 chars to find a sequence of 2-4 words that start with uppercase letters
        const scanStart = Math.max(0, pidx - 160)
        const leftChunk = cleaned.substring(scanStart, pidx)
        // match the last capitalized sequence of 2+ words (e.g. "Jaitpur Behror Alwar")
        const capMatch = leftChunk.match(/([A-Z][a-zA-Z]{2,}\s+[A-Z][a-zA-Z]{2,}(?:\s+[A-Z][a-zA-Z]{2,})*)\s*$/)
        if (capMatch && capMatch[1]) {
          // Compute absolute index
          startIdx = scanStart + leftChunk.lastIndexOf(capMatch[1])
        }
      }
    }

    // 6) If we found a start index, slice from it; otherwise as a last resort remove common noise tokens (DOB/BLOOD/SON/etc)
    if (startIdx !== -1 && startIdx < cleaned.length) {
      cleaned = cleaned.substring(startIdx).trim()
    } else {
      // remove everything up to known labels that are noise
      cleaned = cleaned.replace(/.*?(?=\b(?:PARTAPUR|ADDRESS|JAITPUR|BEHROR|ALWAR|RAJASTHAN|\d{6})\b)/i, '').trim()
      // remove any leading fragments that contain DOB/BLOOD/SON etc
      cleaned = cleaned.replace(/^(.*?(DATE\s*OF\s*BIRTH|DOB|BLOOD|ORGAN|SON|DAUGHTER|WIFE|BLOOD|HOLDER|SIGNATURE).*)/i, '').trim()
    }

    // 7) Ensure pincode remains and format address pieces with comma separation
    const pin = cleaned.match(/\b\d{6}\b/)
    if (pin) {
      // Keep upto and including pincode, discard trailing junk after pincode
      const pinIdx = cleaned.indexOf(pin[0])
      cleaned = cleaned.substring(0, pinIdx + pin[0].length).trim()
    }

    // 8) Final sanitization: collapse multiple commas/spaces and ensure comma before pincode
    cleaned = cleaned
      .replace(/\s*,\s*/g, ', ')
      .replace(/\s+/g, ' ')
      .replace(/,+/g, ',')
      .replace(/\s+,/g, ',')
      .replace(/,\s*$/, '')
      .trim()

    // Ensure there's a comma before pincode (if missing)
    cleaned = cleaned.replace(/(\D)\s+(\d{6})$/, '$1, $2')

    // 9) Remove any leftover leading noise tokens like 'TH :' or stray numbers/dates at start
    cleaned = cleaned.replace(/^(th\s*[:\-]?\s*)/i, '').replace(/^\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}\s*/,'').trim()

    // 10) Assign cleaned address
    result.address = cleaned
    // final guard: if address still looks like garbage (no letters or no pincode), drop it
    if (!/[A-Za-z]/.test(result.address) || !/\d{6}/.test(result.address)) {
      delete result.address
    }
  }

  // Fallback name extraction if still missing (two-word uppercase)
  if (!result.firstName && !result.lastName) {
    const excludeWords = /(INDIAN|UNION|DRIVING|LICENCE|LICENSE|GOVERNMENT|RAJASTHAN|ONTARIO|ENHANCED|PERMIS|CONDUIRE|CAN|RJ|ISSUED|BY|DATE|FIRST|ISSUE|VALIDITY|TR|NT|DOB|BIRTH|ADDRESS|SON|DAUGHTER|WIFE|BLOOD|ORGAN|DONOR|HOLDER|SIGNATURE|CLASS|HGT|SEX|REF|NUMBER|NUMERO|EXP|EXPIRY|EXPIRES|EXPIRATION|ST|SC)/i
    const twoWordPatterns = normalizedText.match(/\b([A-Z]{3,20})\s+([A-Z]{3,20})\b/g)
    if (twoWordPatterns) {
      for (const pattern of twoWordPatterns) {
        const parts = pattern.split(/\s+/)
        if (parts.length === 2 && !excludeWords.test(parts[0]) && !excludeWords.test(parts[1])) {
          if (!/^\d/.test(parts[0]) && !/^\d/.test(parts[1])) {
            result.firstName = parts[0].trim()
            result.lastName = parts[1].trim()
            break
          }
        }
      }
    }
  }

  // If only firstName present, try to find lastName following it
  if (result.firstName && !result.lastName) {
    const fullNamePattern = new RegExp(`\\b${result.firstName.toUpperCase()}\\s+([A-Z]{2,20})\\b`, 'i')
    const lnMatch = normalizedText.match(fullNamePattern)
    if (lnMatch && lnMatch[1]) {
      result.lastName = lnMatch[1].trim()
    }
  }

  // --- Indian-specific overrides ---
  if (isIndianLicense) {
    try {
      // 1) Name from holder signature line
      const holderNameMatch =
        normalizedText.match(/([A-Z]{3,20})\s+([A-Z]{3,20})[^\n]{0,80}HOLDER['\s]*S?\s+SIGNATURE/i) ||
        originalText.match(/([A-Z]{3,20})\s+([A-Z]{3,20})[^\n]{0,80}Holder['\s]*s?\s+Signature/i)
      if (holderNameMatch && holderNameMatch[1] && holderNameMatch[2]) {
        const first = holderNameMatch[1].trim()
        const last = holderNameMatch[2].trim()
        result.firstName = first.charAt(0).toUpperCase() + first.slice(1).toLowerCase()
        result.lastName = last.charAt(0).toUpperCase() + last.slice(1).toLowerCase()
      }

      // 2) Indian DOB explicit
      if (!result.dob) {
        const indianDobMatch =
          normalizedText.match(/DATE\s*OF\s*BIRTH\s*[:\-]?\s*(\d{2}[\/\-\.]\d{2}[\/\-\.]\d{4})/i) ||
          normalizedText.match(/DA\s*RE\s*OF\s*BIRTH\s*[:\-]?\s*(\d{2}[\/\-\.]\d{2}[\/\-\.]\d{4})/i) ||
          normalizedText.replace(/\s+/g, '').match(/DATEOFBIRTH[:\-]?(\d{2}[\/\-\.]\d{2}[\/\-\.]\d{4})/i)
        if (indianDobMatch && indianDobMatch[1]) {
          const dobNorm = normalizeDate(indianDobMatch[1].trim())
          if (dobNorm) result.dob = dobNorm
        }
      }

      // 3) Expiry: pick the date with the largest year (common on Indian cards for long validity)
      const allDateMatches = normalizedText.match(/\d{2}[\/\-\.]\d{2}[\/\-\.]\d{4}/g)
      if (allDateMatches && allDateMatches.length > 0) {
        let bestDate = ''
        let bestYear = 0
        for (const d of allDateMatches) {
          const norm = normalizeDate(d)
          if (!norm) continue
          const year = parseInt(norm.substring(0, 4), 10)
          if (!Number.isNaN(year) && year > bestYear) {
            bestYear = year
            bestDate = norm
          }
        }
        const currentYear = new Date().getFullYear()
        if (bestDate && bestYear > currentYear + 5) {
          result.expiryDate = bestDate
        }
      }
    } catch (e) {
      console.log('Indian licence override parsing failed:', e)
    }
  }

  // Final normalization of simple fields: capitalize names properly
  if (result.firstName) {
    result.firstName = result.firstName
      .split(' ')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ')
  }
  if (result.lastName) {
    result.lastName = result.lastName
      .split(' ')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ')
  }

  // Debug summary
  console.log('parseLicenseData: parsed result ->', result)
  return result
}

module.exports = { parseLicenseData }
