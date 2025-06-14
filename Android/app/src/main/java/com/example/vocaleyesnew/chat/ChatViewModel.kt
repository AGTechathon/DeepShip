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

    companion object {
        private const val API_KEY = "AIzaSyDpuTNjPEe3NX4qrpqoriscoCFLW7Bll8k"
        private const val PROJECT_NUMBER = "270025439616"
        private const val MODEL_NAME = "gemini-2.0-flash"
        private const val TAG = "ChatViewModel"
    }

    fun initialize(context: Context) {
        textToSpeech = TextToSpeech(context) { status ->
            if (status == TextToSpeech.SUCCESS) {
                textToSpeech?.language = Locale.US
                textToSpeech?.setSpeechRate(0.8f)
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
            _messages.value = listOf(
                ChatMessage("Hello! I'm your AI assistant. How can I help you today?", false)
            )
            textToSpeech?.speak("Hello! I'm your AI assistant. How can I help you today?",
                TextToSpeech.QUEUE_FLUSH, null, "greeting")
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
            
            // Add user message to chat
            _messages.value = _messages.value + ChatMessage(message, true)
            
            try {
                if (generativeModel == null) {
                    throw Exception("AI model not initialized")
                }

                // Generate response using Gemini
                val prompt = content {
                    text("You are a helpful AI assistant. Please respond to: $message")
                }
                
                val response = generativeModel?.generateContent(prompt)
                if (response != null) {
                    val responseText = response.text
                    if (responseText.isNullOrBlank()) {
                        throw Exception("Empty response from AI model")
                    }
                    _messages.value = _messages.value + ChatMessage(responseText, false)
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

    override fun onCleared() {
        super.onCleared()
        textToSpeech?.stop()
        textToSpeech?.shutdown()
        textToSpeech = null
    }
} 