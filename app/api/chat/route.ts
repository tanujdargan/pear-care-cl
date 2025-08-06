export const maxDuration = 30

export async function POST(req: Request) {
  try {
    const { messages, patientHistory } = await req.json()

    const runpodUrl = `https://api.runpod.ai/v2/${process.env.RUNPOD_ENDPOINT_ID}/run`
    const systemPrompt =
      process.env.SYSTEM_PROMPT ||
      "You are a course of care and diagnostics agent. You are required to determine the optimal course of care and diagnosis for the patient with ICD10 and CPT codes that are relevant to the diagnosis."

    // Format patient history into the medical template
    const formattedHistory = patientHistory ? formatPatientHistory(patientHistory) : ""

    // Prepare messages with system prompt and patient history
    const formattedMessages = [
      { role: "system", content: systemPrompt },
      ...(formattedHistory ? [{ role: "system", content: `Patient History: ${formattedHistory}` }] : []),
      ...messages,
    ]

    const response = await fetch(runpodUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RUNPOD_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input: {
          messages: formattedMessages,
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

    // Create a streaming response
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      start(controller) {
        // Simulate streaming by chunking the response
        const content = data.output?.choices?.[0]?.message?.content || data.output || "No response received"
        const chunks = content.split(" ")

        let index = 0
        const interval = setInterval(() => {
          if (index < chunks.length) {
            const chunk = chunks[index] + " "
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: chunk })}\n\n`))
            index++
          } else {
            controller.enqueue(encoder.encode(`data: [DONE]\n\n`))
            controller.close()
            clearInterval(interval)
          }
        }, 50)
      },
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    })
  } catch (error) {
    console.error("Chat API error:", error)
    return new Response(JSON.stringify({ error: "Failed to process request" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
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
