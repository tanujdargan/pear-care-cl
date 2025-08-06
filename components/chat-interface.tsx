"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, Bot, User, Clock, Zap } from 'lucide-react'

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
}

interface ChatInterfaceProps {
  patientHistory: any
}

export function ChatInterface({ patientHistory }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [loadingStatus, setLoadingStatus] = useState<string>("")
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    console.log("🚀 Chat Interface: Starting new message submission")

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    }

    console.log("👤 Chat Interface: User message:", {
      id: userMessage.id,
      contentLength: userMessage.content.length,
      content: userMessage.content
    })

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)
    setLoadingStatus("Sending request...")

    const requestPayload = {
      messages: [...messages, userMessage].map((m) => ({ role: m.role, content: m.content })),
      patientHistory,
    }

    console.log("📤 Chat Interface: Sending request:", {
      messagesCount: requestPayload.messages.length,
      hasPatientHistory: !!requestPayload.patientHistory,
      payloadSize: JSON.stringify(requestPayload).length
    })

    try {
      const startTime = Date.now()
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestPayload),
      })

      const responseTime = Date.now() - startTime
      console.log("📥 Chat Interface: Response received:", {
        status: response.status,
        statusText: response.statusText,
        responseTime: `${responseTime}ms`,
        headers: Object.fromEntries(response.headers.entries())
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("❌ Chat Interface: API error:", {
          status: response.status,
          statusText: response.statusText,
          errorBody: errorText
        })
        throw new Error(`API error: ${response.status} - ${errorText}`)
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "",
      }

      console.log("🤖 Chat Interface: Created assistant message:", assistantMessage.id)
      setMessages((prev) => [...prev, assistantMessage])

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        console.error("❌ Chat Interface: No reader available")
        throw new Error("No response stream available")
      }

      console.log("🌊 Chat Interface: Starting to read stream")
      let totalChunks = 0
      let totalContent = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) {
          console.log("✅ Chat Interface: Stream reading completed:", {
            totalChunks,
            totalContentLength: totalContent.length
          })
          break
        }

        const chunk = decoder.decode(value)
        const lines = chunk.split("\n")

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6)
            if (data === "[DONE]") {
              console.log("🏁 Chat Interface: Received [DONE] signal")
              setIsLoading(false)
              setLoadingStatus("")
              return
            }

            try {
              const parsed = JSON.parse(data)
              
              // Handle status updates
              if (parsed.status) {
                console.log("📊 Chat Interface: Status update:", parsed.status)
                switch (parsed.status) {
                  case "queued":
                    setLoadingStatus("Request queued, waiting for processing...")
                    break
                  case "processing":
                    setLoadingStatus("Processing your request...")
                    break
                  case "streaming":
                    setLoadingStatus("Generating response...")
                    break
                  default:
                    setLoadingStatus(parsed.message || "Processing...")
                }
              }
              
              // Handle error messages
              if (parsed.error) {
                console.error("❌ Chat Interface: Received error:", parsed.error)
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMessage.id 
                      ? { ...msg, content: `Error: ${parsed.error}${parsed.details ? ` - ${parsed.details}` : ''}` }
                      : msg
                  )
                )
                setIsLoading(false)
                setLoadingStatus("")
                return
              }
              
              // Handle content chunks
              if (parsed.content) {
                totalChunks++
                totalContent += parsed.content
                
                if (totalChunks % 10 === 0) {
                  console.log(`🔄 Chat Interface: Processed ${totalChunks} chunks, content length: ${totalContent.length}`)
                }

                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMessage.id ? { ...msg, content: msg.content + parsed.content } : msg,
                  ),
                )
              }
            } catch (parseError) {
              console.warn("⚠️ Chat Interface: Failed to parse chunk:", {
                data,
                error: parseError.message
              })
            }
          }
        }
      }
    } catch (error) {
      console.error("💥 Chat Interface: Error during chat:", {
        message: error.message,
        stack: error.stack
      })
      
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: `Sorry, I encountered an error: ${error.message}. Please check the console for more details and try again.`,
        },
      ])
    } finally {
      setIsLoading(false)
      setLoadingStatus("")
    }
  }

  const getLoadingIcon = () => {
    if (loadingStatus.includes("queued") || loadingStatus.includes("waiting")) {
      return <Clock className="w-5 h-5 text-yellow-500" />
    } else if (loadingStatus.includes("processing")) {
      return <Zap className="w-5 h-5 text-blue-500" />
    } else {
      return <Bot className="w-5 h-5 text-green-500" />
    }
  }

  return (
    <Card className="h-[700px] flex flex-col bg-gray-800 border-gray-700">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-3 text-white text-xl">
          <Bot className="w-6 h-6 text-green-500" />
          Medical AI Consultation
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-0">
        <ScrollArea className="flex-1 p-6" ref={scrollAreaRef}>
          {messages.length === 0 && (
            <div className="text-center text-gray-400 mt-12">
              <Bot className="w-16 h-16 mx-auto mb-6 text-green-500" />
              <p className="text-lg leading-relaxed max-w-md mx-auto">
                Hello! I'm your medical AI assistant. I have your patient history and I'm ready to help with your
                medical questions.
              </p>
            </div>
          )}

          {messages.map((message) => (
            <div key={message.id} className={`mb-6 flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-2xl p-4 ${
                  message.role === "user"
                    ? "bg-green-600 text-white"
                    : "bg-gray-700 text-gray-100 border border-gray-600"
                }`}
              >
                <div className="flex items-start gap-3">
                  {message.role === "assistant" && <Bot className="w-5 h-5 mt-1 flex-shrink-0 text-green-500" />}
                  {message.role === "user" && <User className="w-5 h-5 mt-1 flex-shrink-0" />}
                  <div className="whitespace-pre-wrap leading-relaxed">{message.content}</div>
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start mb-6">
              <div className="bg-gray-700 border border-gray-600 rounded-2xl p-4">
                <div className="flex items-center gap-3">
                  {getLoadingIcon()}
                  <div className="flex flex-col">
                    <div className="flex space-x-2 mb-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce"></div>
                      <div
                        className="w-2 h-2 bg-green-500 rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-green-500 rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      ></div>
                    </div>
                    {loadingStatus && (
                      <div className="text-xs text-gray-400 mt-1">
                        {loadingStatus}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </ScrollArea>

        <div className="border-t border-gray-700 p-6">
          <form onSubmit={handleSubmit} className="flex gap-4">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your symptoms, treatment options, or medical concerns..."
              disabled={isLoading}
              className="flex-1 bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-green-500 py-3"
            />
            <Button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="bg-green-600 hover:bg-green-700 text-white px-6"
            >
              <Send className="w-5 h-5" />
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  )
}
