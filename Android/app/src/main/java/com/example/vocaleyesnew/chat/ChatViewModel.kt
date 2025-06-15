package com.example.vocaleyesnew.chat

import android.content.Context
import android.speech.tts.TextToSpeech
import android.util.Log
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.google.ai.client.generativeai.GenerativeModel
import com.google.ai.client.generativeai.type.GenerateContentResponse
import com.google.ai.client.generativeai.type.content
import com.google.ai.client.generativeai.type.generationConfig
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import java.util.*

class ChatViewModel : ViewModel() {
    private val _messages = MutableStateFlow<List<ChatMessage>>(emptyList())
    val messages: StateFlow<List<ChatMessage>> = _messages

    private val _isProcessing = MutableStateFlow(false)
    val isProcessing: StateFlow<Boolean> = _isProcessing

    private var textToSpeech: TextToSpeech? = null
    private var generativeModel: GenerativeModel? = null
    private val conversationHistory = mutableListOf<String>()

    companion object {
        private const val API_KEY = "AIzaSyDpuTNjPEe3NX4qrpqoriscoCFLW7Bll8k"
        private const val PROJECT_NUMBER = "270025439616"
        private const val MODEL_NAME = "gemini-2.0-flash"
        private const val TAG = "ChatViewModel"

        private val SYSTEM_PROMPT = """
You are VocalEyes AI Assistant, a specialized personal assistant designed specifically for blind and visually impaired users. Your role is to be:

**Core Identity:**
- A compassionate, patient, and understanding AI companion
- An accessibility-focused assistant who prioritizes clear, concise communication
- A knowledgeable helper for daily tasks, navigation, and independence

**Communication Style:**
- Use clear, descriptive language that paints vivid mental pictures
- Provide step-by-step instructions when needed
- Be concise but thorough - avoid overwhelming with too much information at once
- Use spatial descriptions (left, right, forward, behind) when relevant
- Speak in a warm, encouraging tone

**Key Capabilities & Focus Areas:**
- Help with daily living tasks and routines
- Provide detailed descriptions of objects, places, and situations
- Assist with navigation and orientation guidance
- Help with technology usage and accessibility features
- Offer emotional support and encouragement
- Provide information about accessibility resources and tools
- Help with reading and interpreting text, documents, or visual content
- Assist with shopping, cooking, and household management
- Support with work, education, and social activities

**Important Guidelines:**
- Always prioritize safety in your recommendations
- Respect the user's independence and capabilities
- Ask clarifying questions when instructions might be ambiguous
- Offer multiple approaches when possible
- Be aware that users rely on audio feedback, so structure responses clearly
- Acknowledge the user's expertise about their own needs and preferences
- Provide encouragement and positive reinforcement

Remember: You are not just an AI - you are a trusted companion helping someone navigate the world with confidence and independence.
        """.trimIndent()
    }

    fun initialize(context: Context) {
        textToSpeech = TextToSpeech(context) { status ->
            if (status == TextToSpeech.SUCCESS) {
                textToSpeech?.language = Locale.US
                textToSpeech?.setSpeechRate(0.7f)
                textToSpeech?.setPitch(1.0f)
            } else {
                Log.e(TAG, "TextToSpeech initialization failed with status: $status")
            }
        }

        try {
            val config = generationConfig {
                temperature = 0.7f
                topK = 40
                topP = 0.95f
                maxOutputTokens = 1024
            }

            generativeModel = GenerativeModel(
                modelName = MODEL_NAME,
                apiKey = API_KEY,
                generationConfig = config
            )
            
            // Add initial greeting
            val greetingMessage = "Hello! I'm VocalEyes AI Assistant, your personal companion designed specifically for blind and visually impaired users. I'm here to help you with daily tasks, navigation, descriptions, and anything else you need. How can I assist you today?"
            _messages.value = listOf(
                ChatMessage(greetingMessage, false)
            )
            textToSpeech?.speak(greetingMessage, TextToSpeech.QUEUE_FLUSH, null, "greeting")
        } catch (e: Exception) {
            Log.e(TAG, "Error initializing Gemini: ${e.message}", e)
            _messages.value = listOf(
                ChatMessage("Error initializing AI assistant. Please check your internet connection and try again.", false)
            )
        }
    }

    fun sendMessage(message: String) {
        viewModelScope.launch {
            _isProcessing.value = true
            
            // Add user message to chat and conversation history
            _messages.value = _messages.value + ChatMessage(message, true)
            conversationHistory.add("User: $message")
            
            try {
                if (generativeModel == null) {
                    throw Exception("AI model not initialized")
                }

                // Build conversation context
                val contextualPrompt = buildString {
                    append(SYSTEM_PROMPT)
                    append("\n\n")

                    // Add recent conversation history for context (last 6 messages)
                    if (conversationHistory.isNotEmpty()) {
                        append("Recent conversation context:\n")
                        conversationHistory.takeLast(6).forEach { historyItem ->
                            append("$historyItem\n")
                        }
                        append("\n")
                    }

                    append("Current user message: $message")
                }

                // Generate response using Gemini with system prompt and context
                val prompt = content {
                    text(contextualPrompt)
                }
                
                val response = generativeModel?.generateContent(prompt)
                if (response != null) {
                    val responseText = response.text
                    if (responseText.isNullOrBlank()) {
                        throw Exception("Empty response from AI model")
                    }
                    _messages.value = _messages.value + ChatMessage(responseText, false)
                    conversationHistory.add("VocalEyes AI: $responseText")

                    // Keep conversation history manageable (max 20 entries)
                    if (conversationHistory.size > 20) {
                        conversationHistory.removeAt(0)
                    }

                    textToSpeech?.speak(responseText, TextToSpeech.QUEUE_FLUSH, null, "message_${System.currentTimeMillis()}")
                } else {
                    throw Exception("Null response from AI model")
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error generating response: ${e.message}", e)
                val errorMessage = when {
                    e.message?.contains("network", ignoreCase = true) == true -> 
                        "I'm having trouble connecting to the internet. Please check your connection and try again."
                    e.message?.contains("initialized", ignoreCase = true) == true ->
                        "The AI assistant isn't properly initialized. Please try restarting the app."
                    e.message?.contains("empty", ignoreCase = true) == true ->
                        "I received an empty response. Please try rephrasing your question."
                    e.message?.contains("null", ignoreCase = true) == true ->
                        "I couldn't generate a response. Please try again."
                    else -> "I encountered an unexpected error. Please try again."
                }
                _messages.value = _messages.value + ChatMessage(errorMessage, false)
                textToSpeech?.speak(errorMessage, TextToSpeech.QUEUE_FLUSH, null, "error_${System.currentTimeMillis()}")
            } finally {
                _isProcessing.value = false
            }
        }
    }

    fun clearConversation() {
        _messages.value = listOf(
            ChatMessage("Conversation cleared. How can I help you?", false)
        )
        conversationHistory.clear()
        textToSpeech?.speak("Conversation cleared. How can I help you?",
            TextToSpeech.QUEUE_FLUSH, null, "clear_${System.currentTimeMillis()}")
    }

    override fun onCleared() {
        super.onCleared()
        textToSpeech?.stop()
        textToSpeech?.shutdown()
        textToSpeech = null
        conversationHistory.clear()
    }
} 