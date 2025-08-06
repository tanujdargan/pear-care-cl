"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface PatientHistoryFormProps {
  onSave: (history: any) => void
  initialData?: any
}

export function PatientHistoryForm({ onSave, initialData }: PatientHistoryFormProps) {
  const [formData, setFormData] = useState({
    age: initialData?.age || "",
    race: initialData?.race || "",
    sexAssignedAtBirth: initialData?.sexAssignedAtBirth || "",
    dob: initialData?.dob || "",
    chiefComplaint: initialData?.chiefComplaint || "",
    residency: initialData?.residency || "",
    recentTravel: initialData?.recentTravel || "None",
    chronicConditions: initialData?.chronicConditions || "None",
    medicalHistory: initialData?.medicalHistory || "None",
    familyHistory: initialData?.familyHistory || "None",
    geneticConditions: initialData?.geneticConditions || "None",
    mentalHealth: initialData?.mentalHealth || "None",
    birthComplications: initialData?.birthComplications || "None",
    allergies: initialData?.allergies || "None",
    currentMedications: initialData?.currentMedications || "None",
    height: initialData?.height || "",
    weight: initialData?.weight || "",
    bmi: initialData?.bmi || "",
    bloodGroup: initialData?.bloodGroup || "",
    bloodPressure: initialData?.bloodPressure || "",
    oxygenLevel: initialData?.oxygenLevel || "",
    glucoseLevel: initialData?.glucoseLevel || "",
    heartRate: initialData?.heartRate || "",
    alcoholUse: initialData?.alcoholUse || "None",
    tobaccoUse: initialData?.tobaccoUse || "None",
    exerciseLevel: initialData?.exerciseLevel || "",
    drugUse: initialData?.drugUse || "No",
    sexualActivity: initialData?.sexualActivity || "",
    caffeineIntake: initialData?.caffeineIntake || "",
    environmentalHazards: initialData?.environmentalHazards || "None",
    obGynHistory: initialData?.obGynHistory || "None",
  })

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))

    // Auto-calculate BMI
    if (field === "height" || field === "weight") {
      const height = field === "height" ? Number.parseFloat(value) : Number.parseFloat(formData.height)
      const weight = field === "weight" ? Number.parseFloat(value) : Number.parseFloat(formData.weight)

      if (height && weight) {
        const bmi = (weight / (height / 100) ** 2).toFixed(1)
        setFormData((prev) => ({ ...prev, bmi }))
      }
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <Card className="bg-gray-700 border-gray-600">
        <CardHeader className="pb-6">
          <CardTitle className="text-white text-xl">Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="age" className="text-gray-200">
              Age
            </Label>
            <Input
              id="age"
              type="number"
              value={formData.age}
              onChange={(e) => handleChange("age", e.target.value)}
              required
              className="bg-gray-600 border-gray-500 text-white placeholder-gray-400 focus:border-green-500"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dob" className="text-gray-200">
              Date of Birth
            </Label>
            <Input
              id="dob"
              type="date"
              value={formData.dob}
              onChange={(e) => handleChange("dob", e.target.value)}
              required
              className="bg-gray-600 border-gray-500 text-white placeholder-gray-400 focus:border-green-500"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="race" className="text-gray-200">
              Race/Ethnicity
            </Label>
            <Input
              id="race"
              value={formData.race}
              onChange={(e) => handleChange("race", e.target.value)}
              required
              className="bg-gray-600 border-gray-500 text-white placeholder-gray-400 focus:border-green-500"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sexAssignedAtBirth" className="text-gray-200">
              Sex Assigned at Birth
            </Label>
            <Input
              id="sexAssignedAtBirth"
              value={formData.sexAssignedAtBirth}
              onChange={(e) => handleChange("sexAssignedAtBirth", e.target.value)}
              required
              className="bg-gray-600 border-gray-500 text-white placeholder-gray-400 focus:border-green-500"
            />
          </div>
          <div className="md:col-span-2 space-y-2">
            <Label htmlFor="chiefComplaint" className="text-gray-200">
              Chief Complaint/Current Condition
            </Label>
            <Textarea
              id="chiefComplaint"
              value={formData.chiefComplaint}
              onChange={(e) => handleChange("chiefComplaint", e.target.value)}
              placeholder="Describe current symptoms or reason for consultation"
              required
              className="bg-gray-600 border-gray-500 text-white placeholder-gray-400 focus:border-green-500 min-h-[100px]"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gray-700 border-gray-600">
        <CardHeader className="pb-6">
          <CardTitle className="text-white text-xl">Physical Measurements</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <Label htmlFor="height" className="text-gray-200">
              Height (cm)
            </Label>
            <Input
              id="height"
              type="number"
              value={formData.height}
              onChange={(e) => handleChange("height", e.target.value)}
              required
              className="bg-gray-600 border-gray-500 text-white placeholder-gray-400 focus:border-green-500"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="weight" className="text-gray-200">
              Weight (kg)
            </Label>
            <Input
              id="weight"
              type="number"
              step="0.1"
              value={formData.weight}
              onChange={(e) => handleChange("weight", e.target.value)}
              required
              className="bg-gray-600 border-gray-500 text-white placeholder-gray-400 focus:border-green-500"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bmi" className="text-gray-200">
              BMI
            </Label>
            <Input id="bmi" value={formData.bmi} readOnly className="bg-gray-500 border-gray-400 text-gray-200" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bloodGroup" className="text-gray-200">
              Blood Group
            </Label>
            <Input
              id="bloodGroup"
              value={formData.bloodGroup}
              onChange={(e) => handleChange("bloodGroup", e.target.value)}
              className="bg-gray-600 border-gray-500 text-white placeholder-gray-400 focus:border-green-500"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bloodPressure" className="text-gray-200">
              Blood Pressure
            </Label>
            <Input
              id="bloodPressure"
              value={formData.bloodPressure}
              onChange={(e) => handleChange("bloodPressure", e.target.value)}
              placeholder="e.g., 120/80"
              className="bg-gray-600 border-gray-500 text-white placeholder-gray-400 focus:border-green-500"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="heartRate" className="text-gray-200">
              Heart Rate
            </Label>
            <Input
              id="heartRate"
              value={formData.heartRate}
              onChange={(e) => handleChange("heartRate", e.target.value)}
              placeholder="bpm"
              className="bg-gray-600 border-gray-500 text-white placeholder-gray-400 focus:border-green-500"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gray-700 border-gray-600">
        <CardHeader className="pb-6">
          <CardTitle className="text-white text-xl">Medical History</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="chronicConditions" className="text-gray-200">
              Chronic Conditions
            </Label>
            <Textarea
              id="chronicConditions"
              value={formData.chronicConditions}
              onChange={(e) => handleChange("chronicConditions", e.target.value)}
              placeholder="List any chronic conditions or 'None'"
              className="bg-gray-600 border-gray-500 text-white placeholder-gray-400 focus:border-green-500 min-h-[80px]"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="allergies" className="text-gray-200">
              Allergies
            </Label>
            <Textarea
              id="allergies"
              value={formData.allergies}
              onChange={(e) => handleChange("allergies", e.target.value)}
              placeholder="List any allergies or 'None'"
              className="bg-gray-600 border-gray-500 text-white placeholder-gray-400 focus:border-green-500 min-h-[80px]"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="currentMedications" className="text-gray-200">
              Current Medications
            </Label>
            <Textarea
              id="currentMedications"
              value={formData.currentMedications}
              onChange={(e) => handleChange("currentMedications", e.target.value)}
              placeholder="List current medications or 'None'"
              className="bg-gray-600 border-gray-500 text-white placeholder-gray-400 focus:border-green-500 min-h-[80px]"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="familyHistory" className="text-gray-200">
              Family Medical History
            </Label>
            <Textarea
              id="familyHistory"
              value={formData.familyHistory}
              onChange={(e) => handleChange("familyHistory", e.target.value)}
              placeholder="Describe family medical history or 'None'"
              className="bg-gray-600 border-gray-500 text-white placeholder-gray-400 focus:border-green-500 min-h-[80px]"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gray-700 border-gray-600">
        <CardHeader className="pb-6">
          <CardTitle className="text-white text-xl">Lifestyle Information</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="alcoholUse" className="text-gray-200">
              Alcohol Use
            </Label>
            <Input
              id="alcoholUse"
              value={formData.alcoholUse}
              onChange={(e) => handleChange("alcoholUse", e.target.value)}
              placeholder="Frequency or 'None'"
              className="bg-gray-600 border-gray-500 text-white placeholder-gray-400 focus:border-green-500"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tobaccoUse" className="text-gray-200">
              Tobacco/Nicotine Use
            </Label>
            <Input
              id="tobaccoUse"
              value={formData.tobaccoUse}
              onChange={(e) => handleChange("tobaccoUse", e.target.value)}
              placeholder="Frequency or 'None'"
              className="bg-gray-600 border-gray-500 text-white placeholder-gray-400 focus:border-green-500"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="exerciseLevel" className="text-gray-200">
              Exercise Level
            </Label>
            <Input
              id="exerciseLevel"
              value={formData.exerciseLevel}
              onChange={(e) => handleChange("exerciseLevel", e.target.value)}
              placeholder="Frequency/description"
              className="bg-gray-600 border-gray-500 text-white placeholder-gray-400 focus:border-green-500"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="caffeineIntake" className="text-gray-200">
              Caffeine Intake
            </Label>
            <Input
              id="caffeineIntake"
              value={formData.caffeineIntake}
              onChange={(e) => handleChange("caffeineIntake", e.target.value)}
              placeholder="Amount/frequency"
              className="bg-gray-600 border-gray-500 text-white placeholder-gray-400 focus:border-green-500"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end pt-6">
        <Button type="submit" size="lg" className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-lg">
          Save Patient History
        </Button>
      </div>
    </form>
  )
}
