"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PatientHistoryForm } from "@/components/patient-history-form"
import { ChatInterface } from "@/components/chat-interface"
import { DoctorReferral } from "@/components/doctor-referral"
import { MessageSquare, UserCheck, FileText } from "lucide-react"
import Image from "next/image"

export default function MedicalChatApp() {
  const [patientHistory, setPatientHistory] = useState(null)
  const [activeTab, setActiveTab] = useState("history")

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="container mx-auto p-6 max-w-7xl">
        {/* Header with Logo */}
        <div className="mb-10 text-center">
          <div className="flex items-center justify-center gap-4 mb-6">
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
              <h1 className="text-5xl font-bold text-white mb-2">Pear Care</h1>
              <p className="text-gray-300 text-lg">AI-powered medical consultation and referral system</p>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8 bg-gray-800 border border-gray-700">
            <TabsTrigger
              value="history"
              className="flex items-center gap-3 text-gray-300 data-[state=active]:bg-green-600 data-[state=active]:text-white py-3"
            >
              <FileText className="w-5 h-5" />
              Patient History
            </TabsTrigger>
            <TabsTrigger
              value="chat"
              className="flex items-center gap-3 text-gray-300 data-[state=active]:bg-green-600 data-[state=active]:text-white py-3"
              disabled={!patientHistory}
            >
              <MessageSquare className="w-5 h-5" />
              Chat Consultation
            </TabsTrigger>
            <TabsTrigger
              value="referral"
              className="flex items-center gap-3 text-gray-300 data-[state=active]:bg-green-600 data-[state=active]:text-white py-3"
              disabled={!patientHistory}
            >
              <UserCheck className="w-5 h-5" />
              Doctor Referral
            </TabsTrigger>
          </TabsList>

          <TabsContent value="history" className="mt-8">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="pb-6">
                <CardTitle className="text-white text-2xl">Patient Medical History</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <PatientHistoryForm
                  onSave={(history) => {
                    setPatientHistory(history)
                    setActiveTab("chat")
                  }}
                  initialData={patientHistory}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="chat" className="mt-8">
            <ChatInterface patientHistory={patientHistory} />
          </TabsContent>

          <TabsContent value="referral" className="mt-8">
            <DoctorReferral patientHistory={patientHistory} />
          </TabsContent>
        </Tabs>

        {!patientHistory && activeTab !== "history" && (
          <div className="text-center mt-12 p-8 bg-gray-800 rounded-lg border border-gray-700">
            <div className="max-w-md mx-auto">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-300 mb-6 text-lg">
                Please complete your patient history first to access medical consultations
              </p>
              <Button
                onClick={() => setActiveTab("history")}
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-3"
              >
                Complete Patient History
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
