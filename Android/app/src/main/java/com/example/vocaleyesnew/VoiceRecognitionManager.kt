package com.example.vocaleyesnew

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import android.speech.tts.TextToSpeech
import android.speech.tts.UtteranceProgressListener
import android.util.Log
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import java.util.*

class VoiceRecognitionManager private constructor(private val context: Context) {
    private var textToSpeech: TextToSpeech? = null
    private var speechRecognizer: SpeechRecognizer? = null
    private var isListening = false
    private var isPersistentListening = true
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main)
    private val monitoringHandler = Handler(Looper.getMainLooper())
    private var lastStateChange = 0L
    private val stateChangeDebounceTime = 1000L // Prevent rapid state changes
    private val monitoringInterval = 10000L // Check every 10 seconds (less aggressive)
    private var lastListeningStart = 0L
    private val maxListeningDuration = 60000L // Allow longer sessions (60 seconds)
    private var restartAttempts = 0
    private val maxRestartAttempts = 5 // Allow more attempts
    private var isRestarting = false // Prevent concurrent restarts

    private val _recognizedText = MutableStateFlow("")
    val recognizedText: StateFlow<String> = _recognizedText

    private val _isListeningState = MutableStateFlow(false)
    val isListeningState: StateFlow<Boolean> = _isListeningState

    private var onCommandRecognized: ((String) -> Unit)? = null
    private var globalCommandListener: ((String) -> Boolean)? = null // Returns true if command was handled
    private var activitySpecificListener: ((String) -> Boolean)? = null

    // Global commands that work in any activity
    private val globalCommands = mapOf(
        "go back" to { handleGoBack() },
        "go home" to { handleGoHome() },
        "repeat" to { handleRepeat() },
        "help" to { handleHelp() },
        "what can I say" to { handleHelp() },
        "stop listening" to { handleStopListening() },
        "start listening" to { handleStartListening() }
    )

    private var lastSpokenText = ""
    private var currentActivity: Activity? = null

    companion object {
        @Volatile
        private var INSTANCE: VoiceRecognitionManager? = null

        fun getInstance(context: Context): VoiceRecognitionManager {
            return INSTANCE ?: synchronized(this) {
                INSTANCE ?: VoiceRecognitionManager(context.applicationContext).also { INSTANCE = it }
            }
        }
    }

    init {
        initializeTextToSpeech()
        initializeSpeechRecognizer()
    }

    private fun handleGoBack() {
        currentActivity?.let { activity ->
            speak("Going back") {
                activity.finish()
            }
        }
    }

    private fun handleGoHome() {
        currentActivity?.let { activity ->
            speak("Going to home") {
                val intent = Intent(activity, MainActivity::class.java).apply {
                    flags = Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP
                }
                activity.startActivity(intent)
            }
        }
    }

    private fun handleRepeat() {
        if (lastSpokenText.isNotEmpty()) {
            speak(lastSpokenText)
        } else {
            speak("Nothing to repeat")
        }
    }

    private fun handleHelp() {
        val helpText = "Global commands: go back, go home, repeat, help. Activity specific commands may also be available."
        speak(helpText)
    }

    private fun handleStopListening() {
        isPersistentListening = false
        stopListening()
        speak("Voice recognition stopped. Say start listening to resume.")
    }

    private fun handleStartListening() {
        isPersistentListening = true
        startListening()
        speak("Voice recognition started")
    }

    private fun initializeSpeechRecognizer() {
        if (SpeechRecognizer.isRecognitionAvailable(context)) {
            createNewSpeechRecognizer()
            Log.d("VoiceRecognition", "Speech recognition initialized successfully")
            // "Voice recognition ready" message removed as requested
        } else {
            Log.e("VoiceRecognition", "Speech recognition not available")
            speak("Speech recognition not available on this device")
        }
    }

    private fun createNewSpeechRecognizer() {
        speechRecognizer?.destroy()
        speechRecognizer = SpeechRecognizer.createSpeechRecognizer(context)
        speechRecognizer?.setRecognitionListener(object : RecognitionListener {
            override fun onReadyForSpeech(params: Bundle?) {
                Log.d("VoiceRecognition", "Ready for speech")
                _isListeningState.value = true
            }

            override fun onBeginningOfSpeech() {
                Log.d("VoiceRecognition", "Speech started")
            }

            override fun onRmsChanged(rmsdB: Float) {
                // Optional: Use for visual feedback of voice level
            }

            override fun onBufferReceived(buffer: ByteArray?) {}

            override fun onEndOfSpeech() {
                Log.d("VoiceRecognition", "Speech ended")
            }

            override fun onError(error: Int) {
                val errorMessage = when (error) {
                    SpeechRecognizer.ERROR_AUDIO -> "Audio recording error"
                    SpeechRecognizer.ERROR_CLIENT -> "Client side error"
                    SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS -> "Insufficient permissions - please grant microphone access"
                    SpeechRecognizer.ERROR_NETWORK -> "Network error"
                    SpeechRecognizer.ERROR_NETWORK_TIMEOUT -> "Network timeout"
                    SpeechRecognizer.ERROR_NO_MATCH -> "No match found - continuing to listen"
                    SpeechRecognizer.ERROR_RECOGNIZER_BUSY -> "Recognition service busy"
                    SpeechRecognizer.ERROR_SERVER -> "Server error"
                    SpeechRecognizer.ERROR_SPEECH_TIMEOUT -> "No speech input - restarting"
                    else -> "Unknown error"
                }
                Log.d("VoiceRecognition", "Error: $errorMessage (Code: $error)")

                // Update state with debouncing
                updateListeningState(false)

                // Handle permission errors specially
                if (error == SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS) {
                    Log.e("VoiceRecognition", "Microphone permission denied")
                    speak("Please grant microphone permission for voice commands to work")
                    return
                }

                // Simplified error handling - only restart for recoverable errors
                if (isPersistentListening && !isRestarting) {
                    val shouldRestart = when (error) {
                        SpeechRecognizer.ERROR_NO_MATCH,
                        SpeechRecognizer.ERROR_SPEECH_TIMEOUT -> true // Normal timeouts
                        SpeechRecognizer.ERROR_AUDIO,
                        SpeechRecognizer.ERROR_RECOGNIZER_BUSY -> restartAttempts < maxRestartAttempts
                        else -> false // Don't restart for network/server errors
                    }

                    if (shouldRestart) {
                        restartAttempts++
                        val restartDelay = if (error == SpeechRecognizer.ERROR_NO_MATCH ||
                                              error == SpeechRecognizer.ERROR_SPEECH_TIMEOUT) 500L else 2000L

                        scope.launch {
                            delay(restartDelay)
                            restartListening()
                        }
                    } else if (restartAttempts >= maxRestartAttempts) {
                        Log.w("VoiceRecognition", "Max restart attempts reached, resetting in 15 seconds")
                        scope.launch {
                            delay(15000L) // Shorter reset time
                            restartAttempts = 0
                        }
                    }
                }
            }

            override fun onResults(results: Bundle?) {
                val matches = results?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
                if (!matches.isNullOrEmpty()) {
                    val recognizedText = matches[0].lowercase().trim()
                    _recognizedText.value = recognizedText
                    Log.d("VoiceRecognition", "Recognized: $recognizedText")

                    // Reset restart attempts on successful recognition
                    restartAttempts = 0

                    // Process command through hierarchy
                    processCommand(recognizedText)
                }

                // Update state with debouncing
                updateListeningState(false)

                // Continue listening if persistent listening is enabled
                if (isPersistentListening && !isRestarting) {
                    scope.launch {
                        delay(800) // Longer pause for better stability
                        restartListening()
                    }
                }
            }

            override fun onPartialResults(partialResults: Bundle?) {
                // Optional: Handle partial results if needed
            }

            override fun onEvent(eventType: Int, params: Bundle?) {}
        })
    }

    private fun processCommand(command: String) {
        var commandHandled = false

        // First check global commands
        globalCommands.forEach { (trigger, action) ->
            if (command.contains(trigger)) {
                action.invoke()
                commandHandled = true
                return@forEach
            }
        }

        // If not handled by global commands, try global listener
        if (!commandHandled) {
            commandHandled = globalCommandListener?.invoke(command) ?: false
        }

        // If still not handled, try activity-specific listener
        if (!commandHandled) {
            commandHandled = activitySpecificListener?.invoke(command) ?: false
        }

        // If still not handled, try legacy command listener
        if (!commandHandled) {
            onCommandRecognized?.invoke(command)
        }
    }

    private fun restartListening() {
        if (isPersistentListening && !isListening && !isRestarting) {
            isRestarting = true
            try {
                Log.d("VoiceRecognition", "Restarting speech recognition...")
                createNewSpeechRecognizer()
                startListening()
            } catch (e: Exception) {
                Log.e("VoiceRecognition", "Error restarting speech recognition: ${e.message}")
                // Try again after a longer delay
                scope.launch {
                    delay(3000)
                    isRestarting = false
                    restartListening()
                }
            } finally {
                // Reset restart flag after a short delay
                scope.launch {
                    delay(1000)
                    isRestarting = false
                }
            }
        }
    }

    // Add debounced state update method
    private fun updateListeningState(listening: Boolean) {
        val currentTime = System.currentTimeMillis()
        if (currentTime - lastStateChange > stateChangeDebounceTime) {
            isListening = listening
            _isListeningState.value = listening
            lastStateChange = currentTime
            Log.d("VoiceRecognition", "State updated to: $listening")
        }
    }

    private fun initializeTextToSpeech() {
        textToSpeech = TextToSpeech(context) { status ->
            if (status == TextToSpeech.SUCCESS) {
                textToSpeech?.language = Locale.US
                textToSpeech?.setSpeechRate(0.8f)
                textToSpeech?.setPitch(1.0f)
                Log.d("VoiceRecognition", "TextToSpeech initialized successfully")

                // Announce that voice recognition is ready
                scope.launch {
                    delay(1000) // Give a moment for everything to settle
                    speak("Voice recognition ready. Say test to verify.")
                }
            } else {
                Log.e("VoiceRecognition", "TextToSpeech initialization failed")
            }
        }
    }

    fun startListening() {
        Log.d("VoiceRecognition", "startListening called - isListening: $isListening, isPersistentListening: $isPersistentListening")

        if (!SpeechRecognizer.isRecognitionAvailable(context)) {
            Log.e("VoiceRecognition", "Speech recognition not available on this device")
            speak("Speech recognition is not available")
            return
        }

        if (!isListening && isPersistentListening && !isRestarting) {
            // Ensure we have a valid speech recognizer
            if (speechRecognizer == null) {
                Log.d("VoiceRecognition", "Creating new speech recognizer before starting")
                createNewSpeechRecognizer()
            }

            // Update state with debouncing
            updateListeningState(true)

            try {
                speechRecognizer?.startListening(createListeningIntent())
                lastListeningStart = System.currentTimeMillis()
                Log.d("VoiceRecognition", "Started listening successfully")
            } catch (e: Exception) {
                Log.e("VoiceRecognition", "Error starting speech recognition: ${e.message}")
                updateListeningState(false)
                // Try to restart after error
                if (isPersistentListening && !isRestarting) {
                    scope.launch {
                        delay(2000) // Longer delay for stability
                        createNewSpeechRecognizer() // Create fresh recognizer
                        restartListening()
                    }
                }
            }
        } else {
            Log.d("VoiceRecognition", "Skipping start - already listening, persistent listening disabled, or restarting")
        }
    }

    fun stopListening() {
        updateListeningState(false)
        speechRecognizer?.stopListening()
        Log.d("VoiceRecognition", "Stopped listening")
    }

    fun enablePersistentListening() {
        Log.d("VoiceRecognition", "Enabling persistent listening")
        isPersistentListening = true
        restartAttempts = 0 // Reset restart attempts when enabling
        isRestarting = false // Reset restart flag

        // Ensure speech recognizer is properly initialized
        if (speechRecognizer == null) {
            createNewSpeechRecognizer()
        }

        if (!isListening) {
            scope.launch {
                delay(1500) // Longer delay to ensure everything is ready
                startListening()
            }
        }
        startMonitoring()
    }

    fun resetRestartAttempts() {
        restartAttempts = 0
        Log.d("VoiceRecognition", "Restart attempts reset")
    }

    // Simplified monitoring - single mechanism instead of multiple competing ones
    private fun startMonitoring() {
        monitoringHandler.removeCallbacksAndMessages(null)
        val monitoringRunnable = object : Runnable {
            override fun run() {
                if (isPersistentListening) {
                    val currentTime = System.currentTimeMillis()

                    // Only restart if not listening and not currently restarting
                    if (!isListening && !isRestarting && restartAttempts < maxRestartAttempts) {
                        Log.d("VoiceRecognition", "Monitoring: Voice recognition not active, restarting...")
                        restartListening()
                    }

                    // Force restart only after very long sessions to prevent memory leaks
                    if (isListening && (currentTime - lastListeningStart > maxListeningDuration)) {
                        Log.d("VoiceRecognition", "Monitoring: Force restarting after ${maxListeningDuration / 1000} second session")
                        stopListening()
                        scope.launch {
                            delay(2000) // Pause before restart
                            restartListening()
                        }
                    }

                    // Schedule next monitoring check
                    monitoringHandler.postDelayed(this, monitoringInterval)
                }
            }
        }
        monitoringHandler.postDelayed(monitoringRunnable, monitoringInterval)
    }

    fun disablePersistentListening() {
        isPersistentListening = false
        monitoringHandler.removeCallbacksAndMessages(null)
        stopListening()
    }

    fun speak(text: String, onComplete: (() -> Unit)? = null) {
        lastSpokenText = text
        val utteranceId = "utterance_${System.currentTimeMillis()}"

        // Temporarily pause listening while speaking to avoid interference
        val wasListening = isListening
        if (wasListening) {
            Log.d("VoiceRecognition", "Pausing listening for TTS: $text")
            speechRecognizer?.stopListening() // Don't update state, just pause
        }

        textToSpeech?.setOnUtteranceProgressListener(object : UtteranceProgressListener() {
            override fun onStart(utteranceId: String?) {
                Log.d("VoiceRecognition", "TTS started: $text")
            }
            override fun onDone(utteranceId: String?) {
                Log.d("VoiceRecognition", "TTS completed: $text")
                // Resume listening after TTS completes if it was listening before
                if (wasListening && isPersistentListening && !isRestarting) {
                    scope.launch {
                        delay(500) // Longer delay to ensure TTS audio has finished
                        if (speechRecognizer == null) {
                            createNewSpeechRecognizer()
                        }
                        speechRecognizer?.startListening(createListeningIntent())
                        lastListeningStart = System.currentTimeMillis()
                        Log.d("VoiceRecognition", "Resumed listening after TTS")
                    }
                }
                onComplete?.invoke()
            }
            override fun onError(utteranceId: String?) {
                Log.e("VoiceRecognition", "TTS error for: $text")
                // Resume listening even on TTS error
                if (wasListening && isPersistentListening && !isRestarting) {
                    scope.launch {
                        delay(500)
                        if (speechRecognizer == null) {
                            createNewSpeechRecognizer()
                        }
                        speechRecognizer?.startListening(createListeningIntent())
                        lastListeningStart = System.currentTimeMillis()
                    }
                }
                onComplete?.invoke()
            }
        })

        textToSpeech?.speak(text, TextToSpeech.QUEUE_FLUSH, null, utteranceId)
    }

    // Helper method to create consistent listening intent
    private fun createListeningIntent(): Intent {
        return Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
            putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
            putExtra(RecognizerIntent.EXTRA_LANGUAGE, Locale.getDefault())
            putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 3)
            putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true)
            putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_MINIMUM_LENGTH_MILLIS, 100L)
            putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS, 3000L)
            putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_POSSIBLY_COMPLETE_SILENCE_LENGTH_MILLIS, 3000L)
            putExtra("android.speech.extra.DICTATION_MODE", true)
            putExtra("android.speech.extra.PREFER_OFFLINE", false)
        }
    }

    fun setCommandListener(listener: (String) -> Unit) {
        onCommandRecognized = listener
    }

    fun getContext(): Context {
        return context
    }

    fun isCurrentlyListening(): Boolean {
        return isListening && isPersistentListening
    }

    fun setGlobalCommandListener(listener: (String) -> Boolean) {
        globalCommandListener = listener
    }

    fun setActivitySpecificListener(listener: (String) -> Boolean) {
        activitySpecificListener = listener
    }

    fun setCurrentActivity(activity: Activity) {
        currentActivity = activity
    }

    fun cleanup() {
        isPersistentListening = false
        isRestarting = false
        stopListening()
        monitoringHandler.removeCallbacksAndMessages(null)
        speechRecognizer?.destroy()
        speechRecognizer = null
        textToSpeech?.stop()
        textToSpeech?.shutdown()
        scope.cancel()
    }
}