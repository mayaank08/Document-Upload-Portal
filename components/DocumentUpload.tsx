'use client'

import { useState, useCallback, useRef } from 'react'
import { LicenseFormData } from '@/app/page'

interface DocumentUploadProps {
  onAutoFill: (data: Partial<LicenseFormData>) => void
}

type UploadState = 'initial' | 'uploading' | 'success' | 'error'

export default function DocumentUpload({ onAutoFill }: DocumentUploadProps) {
  const [uploadState, setUploadState] = useState<UploadState>('initial')
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [fileName, setFileName] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const validateFile = (file: File): string | null => {
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'text/plain',
    ]
    const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.txt']

    const fileExtension = file.name
      .toLowerCase()
      .substring(file.name.lastIndexOf('.'))
    const isValidType = allowedTypes.includes(file.type)
    const isValidExtension = allowedExtensions.includes(fileExtension)

    if (!isValidType && !isValidExtension) {
      return 'Invalid file type. Please upload PDF, JPG, PNG, or TXT files only.'
    }

    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return 'File size exceeds 10MB limit.'
    }

    return null
  }

  const handleFileUpload = async (file: File) => {
    const validationError = validateFile(file)
    if (validationError) {
      setUploadState('error')
      setErrorMessage(validationError)
      return
    }

    setUploadState('uploading')
    setErrorMessage('')
    setFileName(file.name)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch('http://localhost:3001/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Upload failed')
      }

      const data = await response.json()
      
      console.log('Response data:', data)
      
      if (data.extractedData && Object.keys(data.extractedData).length > 0) {
        // Auto-fill form with extracted data (even if partial)
        onAutoFill(data.extractedData)
        setUploadState('success')
      } else {
        // File uploaded but no data extracted
        setUploadState('success')
        console.warn('No data extracted from file')
      }
    } catch (error) {
      setUploadState('error')
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Failed to upload file. Please try again.'
      )
    }
  }

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      setIsDragging(false)

      const file = e.dataTransfer.files[0]
      if (file) {
        handleFileUpload(file)
      }
    },
    []
  )

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileUpload(file)
    }
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        Requested Documents
      </h2>

      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragging
            ? 'border-green-500 bg-green-50'
            : uploadState === 'error'
            ? 'border-red-300 bg-red-50'
            : uploadState === 'success'
            ? 'border-green-300 bg-green-50'
            : 'border-gray-300 bg-gray-50'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.txt"
          onChange={handleFileSelect}
          className="hidden"
        />

        {uploadState === 'initial' && (
          <>
            <div className="mb-4">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
              >
                <path
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <p className="text-gray-600 mb-2">
              <button
                onClick={handleClick}
                className="text-blue-600 hover:text-blue-700 underline font-medium"
              >
                Select files
              </button>{' '}
              to upload or drag and drop them into this space.
            </p>
            <p className="text-sm text-gray-500">
              Driver's License (PDF, JPG, PNG, or TXT)
            </p>
          </>
        )}

        {uploadState === 'uploading' && (
          <>
            <div className="mb-4">
              <div className="mx-auto w-12 h-12 border-4 border-green-200 border-t-green-600 rounded-full animate-spin"></div>
            </div>
            <p className="text-gray-700 font-medium">Uploading...</p>
            <p className="text-sm text-gray-500 mt-1">{fileName}</p>
          </>
        )}

        {uploadState === 'success' && (
          <>
            <div className="mb-4">
              <svg
                className="mx-auto h-12 w-12 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <p className="text-green-700 font-medium">Upload successful!</p>
            <p className="text-sm text-gray-600 mt-1">{fileName}</p>
            <p className="text-sm text-green-600 mt-2">
              Form fields have been auto-filled. You can edit them if needed.
            </p>
            <button
              onClick={handleClick}
              className="mt-4 text-blue-600 hover:text-blue-700 underline text-sm"
            >
              Upload another file
            </button>
          </>
        )}

        {uploadState === 'error' && (
          <>
            <div className="mb-4">
              <svg
                className="mx-auto h-12 w-12 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <p className="text-red-700 font-medium">Upload failed</p>
            <p className="text-sm text-red-600 mt-1">{errorMessage}</p>
            <button
              onClick={handleClick}
              className="mt-4 text-blue-600 hover:text-blue-700 underline text-sm"
            >
              Try again
            </button>
          </>
        )}
      </div>
    </div>
  )
}

