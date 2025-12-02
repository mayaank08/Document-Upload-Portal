'use client'

import { useState } from 'react'
import Header from '@/components/Header'
import DocumentUpload from '@/components/DocumentUpload'
import AdditionalInfo from '@/components/AdditionalInfo'

export interface LicenseFormData {
  firstName: string
  lastName: string
  licenseNo: string
  expiryDate: string
  address: string
  dob: string
}

export default function Home() {
  const [formData, setFormData] = useState<LicenseFormData>({
    firstName: '',
    lastName: '',
    licenseNo: '',
    expiryDate: '',
    address: '',
    dob: '',
  })

  const handleAutoFill = (data: Partial<LicenseFormData>) => {
    console.log('Auto-filling form with data:', data)
    setFormData((prev) => {
      const updated = { ...prev, ...data }
      console.log('Updated form data:', updated)
      return updated
    })
  }

  const handleFormChange = (field: keyof LicenseFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  // Calculate progress based on filled fields
  const calculateProgress = (): number => {
    const fields: (keyof LicenseFormData)[] = [
      'firstName',
      'lastName',
      'licenseNo',
      'expiryDate',
      'address',
      'dob',
    ]
    const filledFields = fields.filter((field) => {
      const value = formData[field]
      return value && value.trim().length > 0
    })
    return Math.round((filledFields.length / fields.length) * 100)
  }

  const progress = calculateProgress()

  return (
    <div className="min-h-screen bg-gray-50">
      <Header progress={progress} />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">
            Hello John,
          </h1>
          <p className="text-gray-700 mb-2">
            Your agent has requested documents for your application.
          </p>
          <p className="text-gray-600 text-sm">
            Simply add everything you have. We'll detect each document and mark
            what's missing. Adding all documents will reduce the need to fill
            out additional information.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <DocumentUpload onAutoFill={handleAutoFill} />
          </div>
          <div className="lg:col-span-1">
            <AdditionalInfo
              formData={formData}
              onChange={handleFormChange}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

