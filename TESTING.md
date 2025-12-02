# Testing Guide

## Quick Test

1. **Start both servers** (see README for instructions)

2. **Test File Upload:**
   - Create a test driver's license file (PDF, JPG, PNG, or TXT)
   - Drag and drop it into the upload area, or click "Select files"
   - Wait for processing (you'll see "Uploading..." state)
   - Check if form fields are auto-filled

3. **Test Form Validation:**
   - Try submitting with empty fields
   - Verify error messages appear
   - Fill all required fields
   - Submit and verify success message

## Sample Test Data

You can create a simple text file (`test-license.txt`) with the following format to test:

```
FIRST NAME: John
LAST NAME: Doe
LICENSE NO: DL123456789
EXPIRY DATE: 12/31/2025
DOB: 01/15/1990
ADDRESS: 123 Main Street, City, State 12345
```

Or use any PDF/image of a driver's license for more realistic testing.

## Expected Behavior

- ✅ File upload shows loading state
- ✅ Success state appears after upload
- ✅ Form fields auto-fill with extracted data
- ✅ User can edit auto-filled fields
- ✅ Form validation prevents submission with missing fields
- ✅ Success message appears after valid submission

