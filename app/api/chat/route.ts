export const maxDuration = 30

export async function POST(req: Request) {
  console.log("🚀 Chat API: Request received")
  
  try {
    const requestBody = await req.json()
    console.log("📝 Chat API: Request body parsed:", {
      messagesCount: requestBody.messages?.length,
      hasPatientHistory: !!requestBody.patientHistory,
      patientHistoryKeys: requestBody.patientHistory ? Object.keys(requestBody.patientHistory) : []
    })

    const { messages, patientHistory } = requestBody

    // Environment variables check
    console.log("🔧 Chat API: Environment check:", {
      hasRunpodEndpointId: !!process.env.RUNPOD_ENDPOINT_ID,
      hasRunpodApiKey: !!process.env.RUNPOD_API_KEY,
      hasSystemPrompt: !!process.env.SYSTEM_PROMPT,
      runpodEndpointId: process.env.RUNPOD_ENDPOINT_ID ? `${process.env.RUNPOD_ENDPOINT_ID.substring(0, 8)}...` : 'NOT SET'
    })

    if (!process.env.RUNPOD_ENDPOINT_ID) {
      console.error("❌ Chat API: RUNPOD_ENDPOINT_ID not set")
      return new Response(JSON.stringify({ error: "RunPod endpoint not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      })
    }

    if (!process.env.RUNPOD_API_KEY) {
      console.error("❌ Chat API: RUNPOD_API_KEY not set")
      return new Response(JSON.stringify({ error: "RunPod API key not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      })
    }

    const runpodUrl = `https://api.runpod.ai/v2/${process.env.RUNPOD_ENDPOINT_ID}/run`
    const statusUrl = `https://api.runpod.ai/v2/${process.env.RUNPOD_ENDPOINT_ID}/status`
    console.log("🌐 Chat API: RunPod URLs:", { runpodUrl, statusUrl })

    const systemPrompt =
      process.env.SYSTEM_PROMPT ||
      "You are a course of care and diagnostics agent. You are required to determine the optimal course of care and diagnosis for the patient with ICD10 and CPT codes that are relevant to the diagnosis."

    console.log("💬 Chat API: System prompt length:", systemPrompt.length)

    // Format patient history into the medical template
    const formattedHistory = patientHistory ? formatPatientHistory(patientHistory) : ""
    console.log("📋 Chat API: Formatted history length:", formattedHistory.length)

    // Combine system prompt and patient history into a single system message
    const combinedSystemPrompt = formattedHistory 
      ? `${systemPrompt}\n\nPatient History:\n${formattedHistory}`
      : systemPrompt

    // Properly format messages to ensure alternating user/assistant pattern
    const formattedMessages = formatMessagesForAPI(messages, combinedSystemPrompt)

    console.log("📨 Chat API: Final messages:", {
      totalMessages: formattedMessages.length,
      messageRoles: formattedMessages.map(m => m.role),
      systemMessages: formattedMessages.filter(m => m.role === 'system').length,
      userMessages: formattedMessages.filter(m => m.role === 'user').length,
      assistantMessages: formattedMessages.filter(m => m.role === 'assistant').length
    })

    // Validate message alternation
    const isValidAlternation = validateMessageAlternation(formattedMessages)
    console.log("✅ Chat API: Message alternation valid:", isValidAlternation)

    if (!isValidAlternation) {
      console.error("❌ Chat API: Invalid message alternation detected")
      return new Response(JSON.stringify({ 
        error: "Invalid message format",
        details: "Messages must alternate between user and assistant roles"
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    const requestPayload = {
      input: {
        messages: formattedMessages,
        sampling_params: {
          temperature: 0.7,
          max_tokens: 2048,
        },
      },
    }

    console.log("📤 Chat API: Sending request to RunPod:", {
      url: runpodUrl,
      payloadSize: JSON.stringify(requestPayload).length,
      temperature: requestPayload.input.sampling_params.temperature,
      maxTokens: requestPayload.input.sampling_params.max_tokens,
      messagePattern: formattedMessages.map(m => m.role).join(' -> ')
    })

    // Create a streaming response that handles the queue system
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Step 1: Submit the job to RunPod
          const startTime = Date.now()
          const response = await fetch(runpodUrl, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${process.env.RUNPOD_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(requestPayload),
          })

          const responseTime = Date.now() - startTime
          console.log("📥 Chat API: RunPod initial response received:", {
            status: response.status,
            statusText: response.statusText,
            responseTime: `${responseTime}ms`,
            headers: Object.fromEntries(response.headers.entries())
          })

          if (!response.ok) {
            const errorText = await response.text()
            console.error("❌ Chat API: RunPod API error:", {
              status: response.status,
              statusText: response.statusText,
              errorBody: errorText,
              responseTime: `${responseTime}ms`
            })
            
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
              error: `RunPod API error: ${response.status} - ${response.statusText}`,
              details: errorText 
            })}\n\n`))
            controller.close()
            return
          }

          const initialData = await response.json()
          console.log("🔍 Chat API: RunPod initial response data:", {
            hasId: !!initialData.id,
            status: initialData.status,
            dataKeys: Object.keys(initialData)
          })

          // Step 2: Handle queue system
          if (initialData.status === "IN_QUEUE" && initialData.id) {
            console.log("⏳ Chat API: Job queued, starting polling:", initialData.id)
            
            // Send loading status to client
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
              status: "queued",
              message: "Your request is in queue, please wait..."
            })}\n\n`))

            // Poll for completion
            const jobId = initialData.id
            let pollCount = 0
            const maxPolls = 60 // 5 minutes max (5 second intervals)
            
            while (pollCount < maxPolls) {
              await new Promise(resolve => setTimeout(resolve, 5000)) // Wait 5 seconds
              pollCount++
              
              console.log(`🔄 Chat API: Polling attempt ${pollCount}/${maxPolls} for job ${jobId}`)
              
              try {
                const statusResponse = await fetch(`${statusUrl}/${jobId}`, {
                  headers: {
                    Authorization: `Bearer ${process.env.RUNPOD_API_KEY}`,
                  },
                })

                if (!statusResponse.ok) {
                  console.error("❌ Chat API: Status check failed:", statusResponse.status)
                  continue
                }

                const statusData = await statusResponse.json()
                console.log("📊 Chat API: Status check result:", {
                  status: statusData.status,
                  hasOutput: !!statusData.output,
                  hasError: !!statusData.error,
                  executionTime: statusData.executionTime
                })

                if (statusData.status === "COMPLETED" && statusData.output) {
                  console.log("✅ Chat API: Job completed, processing output")
                  
                  // Send processing status
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                    status: "processing",
                    message: "Processing your response..."
                  })}\n\n`))

                  // Extract content from completed job
                  const content = extractContent(statusData.output)
                  console.log("📝 Chat API: Extracted content:", {
                    contentLength: content.length,
                    contentPreview: content.substring(0, 100) + (content.length > 100 ? '...' : '')
                  })

                  // Stream the content
                  await streamContent(controller, encoder, content)
                  return

                } else if (statusData.status === "FAILED") {
                  console.error("❌ Chat API: Job failed:", statusData.error)
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                    error: "Job processing failed",
                    details: statusData.error || "Unknown error occurred"
                  })}\n\n`))
                  controller.close()
                  return

                } else if (statusData.status === "IN_PROGRESS") {
                  console.log("🔄 Chat API: Job in progress, continuing to poll")
                  // Send progress update
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                    status: "processing",
                    message: "Your request is being processed..."
                  })}\n\n`))
                }

              } catch (pollError) {
                console.error("❌ Chat API: Polling error:", pollError.message)
              }
            }

            // Timeout reached
            console.error("⏰ Chat API: Polling timeout reached")
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
              error: "Request timeout",
              message: "The request took too long to process. Please try again."
            })}\n\n`))
            controller.close()

          } else if (initialData.output) {
            // Direct response (not queued)
            console.log("🚀 Chat API: Direct response received")
            const content = extractContent(initialData.output)
            await streamContent(controller, encoder, content)

          } else {
            console.error("❌ Chat API: Unexpected response format:", initialData)
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
              error: "Unexpected response format",
              details: "No output or queue ID received"
            })}\n\n`))
            controller.close()
          }

        } catch (error) {
          console.error("💥 Chat API: Stream error:", error)
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
            error: "Stream processing failed",
            details: error.message
          })}\n\n`))
          controller.close()
        }
      },
    })

    console.log("🎯 Chat API: Returning streaming response")
    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    })

  } catch (error) {
    console.error("💥 Chat API: Unexpected error:", {
      message: error.message,
      stack: error.stack,
      name: error.name
    })
    
    return new Response(JSON.stringify({ 
      error: "Failed to process request",
      details: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}

// New function to properly format messages for API compliance
function formatMessagesForAPI(messages: any[], systemPrompt: string) {
  const formattedMessages = []
  
  // Add system message first
  formattedMessages.push({
    role: "system",
    content: systemPrompt
  })
  
  // Process conversation messages, ensuring alternation
  let lastRole = "system"
  
  for (const message of messages) {
    // Skip if same role as previous (shouldn't happen in normal flow)
    if (message.role === lastRole && message.role !== "system") {
      console.warn("⚠️ Skipping duplicate role:", message.role)
      continue
    }
    
    // Only add user and assistant messages (skip any additional system messages)
    if (message.role === "user" || message.role === "assistant") {
      formattedMessages.push({
        role: message.role,
        content: message.content
      })
      lastRole = message.role
    }
  }
  
  return formattedMessages
}

// Function to validate message alternation
function validateMessageAlternation(messages: any[]): boolean {
  if (messages.length === 0) return false
  
  // First message should be system
  if (messages[0].role !== "system") return false
  
  // Check alternation for the rest (should be user/assistant/user/assistant...)
  for (let i = 1; i < messages.length - 1; i++) {
    const current = messages[i].role
    const next = messages[i + 1].role
    
    // Skip system messages in validation
    if (current === "system" || next === "system") continue
    
    // User should be followed by assistant, assistant by user
    if (current === "user" && next === "user") return false
    if (current === "assistant" && next === "assistant") return false
  }
  
  return true
}

// Helper function to extract content from various response formats
function extractContent(output: any): string {
  console.log("🔍 Extracting content from output:", {
    outputType: typeof output,
    outputKeys: typeof output === 'object' ? Object.keys(output) : []
  })

  if (output?.choices?.[0]?.message?.content) {
    console.log("✅ Content found in choices[0].message.content")
    return output.choices[0].message.content
  } else if (output?.message?.content) {
    console.log("✅ Content found in output.message.content")
    return output.message.content
  } else if (output?.content) {
    console.log("✅ Content found in output.content")
    return output.content
  } else if (typeof output === 'string') {
    console.log("✅ Content found as string in output")
    return output
  } else {
    console.warn("⚠️ No content found, using fallback message")
    console.log("🔍 Full output structure:", JSON.stringify(output, null, 2))
    return "I apologize, but I couldn't generate a proper response. Please try rephrasing your question."
  }
}

// Helper function to stream content in chunks
async function streamContent(controller: ReadableStreamDefaultController, encoder: TextEncoder, content: string) {
  console.log("🌊 Starting content streaming:", {
    contentLength: content.length
  })

  // Send start streaming signal
  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
    status: "streaming",
    message: "Streaming response..."
  })}\n\n`))

  // Split content into words for streaming
  const chunks = content.split(" ")
  console.log("📦 Split into chunks:", chunks.length)

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i] + (i < chunks.length - 1 ? " " : "")
    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: chunk })}\n\n`))
    
    if (i % 10 === 0) {
      console.log(`🔄 Streamed ${i + 1}/${chunks.length} chunks`)
    }
    
    // Small delay between chunks for smooth streaming
    await new Promise(resolve => setTimeout(resolve, 50))
  }

  console.log("✅ Content streaming completed")
  controller.enqueue(encoder.encode(`data: [DONE]\n\n`))
  controller.close()
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
