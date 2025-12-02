# Document Upload Portal
Live Link - https://document-upload-portal.vercel.app/

A modern document upload portal built with Next.js and Hono, featuring drag-and-drop file upload, automatic text extraction, and intelligent form auto-fill from driver's license documents.

## Features

- 🎨 **Pixel-perfect UI** matching the Figma design
- 📤 **Drag-and-drop file upload** with click-to-upload support
- 📄 **Multi-format support**: PDF, JPG, PNG, and TXT files
- 🤖 **Automatic text extraction** from uploaded documents
- ✨ **Smart form auto-fill** from extracted license data
- ✅ **Form validation** before submission
- 💾 **Data persistence** on the backend
- 🎯 **Clear UI states**: Initial, Uploading, Success, Error

## Tech Stack

### Frontend
- **Next.js 14** (React) with TypeScript
- **Tailwind CSS** for styling
- Modern React hooks and client-side state management

### Backend
- **Hono** - Fast, lightweight web framework (serverless-ready)
- **Node.js** server
- **Text Extraction**:
  - **pdf-parse** - For extracting text from text-based PDF files
  - **pdf2pic** + **Tesseract.js** - Fallback OCR for scanned PDF files (converts first page of PDF to image, then runs OCR)
  - **Tesseract.js** - OCR for extracting text from images (JPG/PNG)

## Getting Started

### Prerequisites

- Node.js 18+ and npm (or yarn)
- Git
- For scanned PDF OCR support:
  - **ImageMagick** and **Ghostscript** installed on your system (required by `pdf2pic`)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd "Document Upload Portal"
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development servers**

   You'll need to run both the frontend and backend servers:

   **Terminal 1 - Backend Server:**
   ```bash
   npm run server
   ```
   The backend will run on `http://localhost:3001`

   **Terminal 2 - Frontend Server:**
   ```bash
   npm run dev
   ```
   The frontend will run on `http://localhost:3000`

4. **Open your browser**
   Navigate to `http://localhost:3000` to see the application.

## Project Structure

```
Document Upload Portal/
├── app/                    # Next.js app directory
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Main page component
├── components/             # React components
│   ├── Header.tsx         # Header with logo and progress
│   ├── DocumentUpload.tsx # Drag-and-drop upload component
│   └── AdditionalInfo.tsx # Form component
├── server/                 # Backend server
│   ├── index.js           # Hono server setup
│   ├── textExtraction.js  # Text extraction logic
│   ├── licenseParser.js   # License data parsing
│   └── dataStorage.js     # Data persistence
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── README.md
```

## How It Works

### Text Extraction

The application uses different methods for extracting text based on file type:

1. **PDF Files (text-based)**: Uses `pdf-parse` library to extract text directly from PDF documents
2. **PDF Files (scanned/image-based)**: If `pdf-parse` returns little/no text, the first page is converted to an image via `pdf2pic` and processed with `Tesseract.js` OCR
3. **Image Files (JPG/PNG)**: Uses `Tesseract.js` (OCR) to extract text from images
4. **Text Files (TXT)**: Reads the file content directly

### License Parsing

After extracting text, the application uses pattern matching and regex to identify:
- First Name
- Last Name
- License Number
- Expiry Date
- Date of Birth
- Address

The parser looks for common patterns found in driver's license documents and normalizes the data format (e.g., dates are converted to YYYY-MM-DD format).

### Auto-fill Flow

1. User uploads a driver's license file (PDF, JPG, PNG, or TXT)
2. File is sent to the backend `/api/upload` endpoint
3. Backend extracts text using the appropriate method
4. Text is parsed to extract license information
5. Extracted data is returned to the frontend
6. Form fields are automatically filled with the extracted data
7. User can edit any field before submitting

## API Endpoints

### `POST /api/upload`
Uploads a file and extracts license information.

**Request:**
- `Content-Type: multipart/form-data`
- Body: `file` (PDF, JPG, PNG, or TXT)

**Response:**
```json
{
  "success": true,
  "extractedData": {
    "firstName": "John",
    "lastName": "Doe",
    "licenseNo": "DL123456",
    "expiryDate": "2025-12-31",
    "address": "123 Main St",
    "dob": "1990-01-01"
  },
  "message": "File processed successfully"
}
```

### `POST /api/submit`
Submits the form data for persistence.

**Request:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "licenseNo": "DL123456",
  "expiryDate": "2025-12-31",
  "address": "123 Main St",
  "dob": "1990-01-01"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Data saved successfully"
}
```

### `GET /api/health`
Health check endpoint.

## File Format Support

- **PDF**: `.pdf` files (application/pdf)
- **Images**: `.jpg`, `.jpeg`, `.png` files (image/jpeg, image/png)
- **Text**: `.txt` files (text/plain)

Maximum file size: 10MB

## Development

### Running in Development Mode

```bash
# Backend (Terminal 1)
npm run server

# Frontend (Terminal 2)
npm run dev
```

### Building for Production

```bash
# Build Next.js app
npm run build

# Start production server
npm start
```

## Notes

- The text extraction and parsing work best with clear, well-formatted documents
- OCR accuracy depends on image quality for JPG/PNG files
- The license parser uses pattern matching and may need adjustment for different license formats
- All uploaded files are temporarily stored during processing and then deleted
- Form submissions are saved to `server/data/submissions.json`

## License

This project is built for assessment purposes.

