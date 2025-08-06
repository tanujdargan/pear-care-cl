"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Calendar, FileText, User, Clock, MessageSquare } from 'lucide-react'
import Link from "next/link"
import Image from "next/image"

export default function Dashboard() {
  const [patientHistory, setPatientHistory] = useState(null)
  const [consultations, setConsultations] = useState([])

  useEffect(() => {
    // Load patient history from cookies
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
    }

    // Load consultations from localStorage (mock data for now)
    const savedConsultations = localStorage.getItem('pear-care-consultations')
    if (savedConsultations) {
      try {
        setConsultations(JSON.parse(savedConsultations))
      } catch (error) {
        console.error('Error parsing consultations:', error)
      }
    }
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="container mx-auto p-6 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="outline" className="bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Chat
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <div className="relative w-12 h-12">
                  <Image
                    src="/pear-care-medical-logo.png"
                    alt="Pear Care Logo"
                    width={48}
                    height={48}
                    className="rounded-full"
                  />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">Dashboard</h1>
                  <p className="text-gray-300">Your medical consultation history</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Patient Summary */}
        {patientHistory && (
          <Card className="bg-gray-800 border-gray-700 mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-white">
                <User className="w-6 h-6 text-green-500" />
                Patient Profile
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-gray-700 rounded-lg">
                  <div className="text-2xl font-bold text-white">{patientHistory.age}</div>
                  <div className="text-gray-400 text-sm">Years Old</div>
                </div>
                <div className="text-center p-4 bg-gray-700 rounded-lg">
                  <div className="text-2xl font-bold text-white">{patientHistory.bmi || 'N/A'}</div>
                  <div className="text-gray-400 text-sm">BMI</div>
                </div>
                <div className="text-center p-4 bg-gray-700 rounded-lg">
                  <div className="text-2xl font-bold text-white">{patientHistory.bloodGroup || 'N/A'}</div>
                  <div className="text-gray-400 text-sm">Blood Type</div>
                </div>
                <div className="text-center p-4 bg-gray-700 rounded-lg">
                  <div className="text-2xl font-bold text-white">{consultations.length}</div>
                  <div className="text-gray-400 text-sm">Consultations</div>
                </div>
              </div>
              <div className="mt-4 p-4 bg-gray-700 rounded-lg">
                <h3 className="text-white font-semibold mb-2">Chief Complaint</h3>
                <p className="text-gray-300">{patientHistory.chiefComplaint}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Consultations */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-white">
              <MessageSquare className="w-6 h-6 text-green-500" />
              Recent Consultations
            </CardTitle>
          </CardHeader>
          <CardContent>
            {consultations.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No Consultations Yet</h3>
                <p className="text-gray-400 mb-6">Start your first medical consultation to see your history here.</p>
                <Link href="/">
                  <Button className="bg-green-600 hover:bg-green-700 text-white">
                    Start Consultation
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {consultations.map((consultation, index) => (
                  <div key={index} className="p-4 bg-gray-700 rounded-lg border border-gray-600">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-300 text-sm">
                          {new Date(consultation.date).toLocaleDateString()}
                        </span>
                      </div>
                      <Badge variant="outline" className="text-green-400 border-green-400">
                        Completed
                      </Badge>
                    </div>
                    <p className="text-white font-medium mb-2">{consultation.topic}</p>
                    <p className="text-gray-400 text-sm line-clamp-2">{consultation.summary}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
