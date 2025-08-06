"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ChatInterface } from "@/components/chat-interface"
import { PatientHistoryModal } from "@/components/patient-history-modal"
import { MessageSquare, FileText, Settings } from 'lucide-react'
import Image from "next/image"
import Link from "next/link"

export default function MedicalChatApp() {
  const [patientHistory, setPatientHistory] = useState(null)
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Load patient history from cookies on component mount
    const savedHistory = document.cookie
      .split('; ')
      .find(row => row.startsWith('pear-care-patient-history='))
      ?.split('=')[1]

    if (savedHistory) {
      try {
        const decodedHistory = JSON.parse(decodeURIComponent(savedHistory))
        setPatientHistory(decodedHistory)
      } catch (error) {
        console.error('Error parsing patient history from cookie:', error)
      }
    } else {
      // Show modal if no history found
      setShowHistoryModal(true)
    }
    setIsLoading(false)
  }, [])

  const handleHistorySave = (history: any) => {
    // Save to cookie with 30 days expiration
    const expirationDate = new Date()
    expirationDate.setDate(expirationDate.getDate() + 30)
    
    document.cookie = `pear-care-patient-history=${encodeURIComponent(JSON.stringify(history))}; expires=${expirationDate.toUTCString()}; path=/`
    
    setPatientHistory(history)
    setShowHistoryModal(false)
  }

  const handleEditHistory = () => {
    setShowHistoryModal(true)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading Pear Care...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="container mx-auto p-6 max-w-7xl">
        {/* Header with Logo */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="relative w-16 h-16">
                <Image
                  src="/pear-care-medical-logo.png"
                  alt="Pear Care Logo"
                  width={64}
                  height={64}
                  className="rounded-full"
                />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white mb-1">Pear Care</h1>
                <p className="text-gray-300">AI-powered medical consultation system</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {patientHistory && (
                <Button
                  onClick={handleEditHistory}
                  variant="outline"
                  className="bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Edit History
                </Button>
              )}
              <Link href="/dashboard">
                <Button className="bg-green-600 hover:bg-green-700 text-white">
                  <FileText className="w-4 h-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
            </div>
          </div>

          {patientHistory && (
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-3 mb-2">
                <MessageSquare className="w-5 h-5 text-green-500" />
                <h2 className="text-lg font-semibold text-white">Patient Profile</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="text-gray-300">
                  <span className="text-gray-400">Age:</span> {patientHistory.age} years old
                </div>
                <div className="text-gray-300">
                  <span className="text-gray-400">Sex:</span> {patientHistory.sexAssignedAtBirth}
                </div>
                <div className="text-gray-300">
                  <span className="text-gray-400">BMI:</span> {patientHistory.bmi || 'Not calculated'}
                </div>
              </div>
              <div className="mt-2 text-sm text-gray-400">
                <span className="text-gray-400">Chief Complaint:</span> {patientHistory.chiefComplaint}
              </div>
            </div>
          )}
        </div>

        {/* Main Chat Interface */}
        {patientHistory ? (
          <ChatInterface patientHistory={patientHistory} />
        ) : (
          <div className="text-center mt-12 p-8 bg-gray-800 rounded-lg border border-gray-700">
            <div className="max-w-md mx-auto">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Welcome to Pear Care</h3>
              <p className="text-gray-300 mb-6">
                To provide you with personalized medical consultations, we need to collect your medical history first.
              </p>
              <Button
                onClick={() => setShowHistoryModal(true)}
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-3"
              >
                Complete Medical History
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Patient History Modal */}
      <PatientHistoryModal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        onSave={handleHistorySave}
        initialData={patientHistory}
      />
    </div>
  )
}
