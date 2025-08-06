export async function POST(req: Request) {
  try {
    const { patientHistory, symptoms } = await req.json()

    const runpodUrl = `https://api.runpod.ai/v2/${process.env.RUNPOD_ENDPOINT_ID}/run`
    const systemPrompt = `${process.env.SYSTEM_PROMPT} Focus on providing a detailed doctor referral recommendation with specific reasoning, recommended specialists, urgency level, and next steps.`

    const formattedHistory = formatPatientHistory(patientHistory)

    const messages = [
      { role: "system", content: systemPrompt },
      { role: "system", content: `Patient History: ${formattedHistory}` },
      {
        role: "user",
        content: `Based on the patient history and current symptoms: ${symptoms}, please provide a comprehensive doctor referral recommendation including: 1) Recommended specialist(s) 2) Urgency level 3) Specific reasoning 4) Suggested tests or preparations 5) ICD10 and CPT codes if applicable`,
      },
    ]

    const response = await fetch(runpodUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RUNPOD_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input: {
          messages,
          sampling_params: {
            temperature: 0.7,
            max_tokens: 2048,
          },
        },
      }),
    })

    if (!response.ok) {
      throw new Error(`RunPod API error: ${response.status}`)
    }

    const data = await response.json()
    const content = data.output?.choices?.[0]?.message?.content || data.output || "No response received"

    return Response.json({ recommendation: content })
  } catch (error) {
    console.error("Referral API error:", error)
    return Response.json({ error: "Failed to process referral request" }, { status: 500 })
  }
}

function formatPatientHistory(history: any): string {
  return `A ${history.age}-year-old ${history.race} ${history.sexAssignedAtBirth} (DOB: ${history.dob}) presents with ${history.chiefComplaint}.

Residency: ${history.residency}, Recent Travel: ${history.recentTravel}
Chronic conditions: ${history.chronicConditions}
Medical, surgical, and immunization history: ${history.medicalHistory}
Family medical history: ${history.familyHistory}
Genetic conditions: ${history.geneticConditions}
Mental health: ${history.mentalHealth}
At-birth complications: ${history.birthComplications}
Allergies: ${history.allergies}
Current medications: ${history.currentMedications}
Height: ${history.height}cm, Weight: ${history.weight}kg, BMI: ${history.bmi}
Blood group: ${history.bloodGroup}
Blood pressure: ${history.bloodPressure}, Oxygen level: ${history.oxygenLevel}, Glucose/sugar level: ${history.glucoseLevel}, Heart rate: ${history.heartRate}
Alcohol use: ${history.alcoholUse}
Tobacco/nicotine use: ${history.tobaccoUse}
Exercise level: ${history.exerciseLevel}
Recreational drug use: ${history.drugUse}
Sexual activity: ${history.sexualActivity}
Caffeine intake: ${history.caffeineIntake}
Environmental hazards: ${history.environmentalHazards}
Obstetric and gynecological history: ${history.obGynHistory}`
}
