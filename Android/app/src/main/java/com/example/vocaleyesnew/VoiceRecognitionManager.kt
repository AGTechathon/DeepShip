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
    private val restartHandler = Handler(Looper.getMainLooper())
    private val heartbeatHandler = Handler(Looper.getMainLooper())
    private val forceRestartHandler = Handler(Looper.getMainLooper())
    private var lastHeartbeat = 0L
    private val heartbeatInterval = 1000L // Check every 1 second (very aggressive)
    private var lastListeningStart = 0L
    private val maxListeningDuration = 4000L // Force restart after 4 seconds
    private val forceRestartInterval = 8000L // Force restart every 8 seconds

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
                _isListeningState.value = false
                isListening = false

                // Handle permission errors specially
                if (error == SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS) {
                    Log.e("VoiceRecognition", "Microphone permission denied")
                    speak("Please grant microphone permission for voice commands to work")
                    return
                }

                // For timeout and no match errors, restart immediately
                // These are normal and expected in always-on listening
                if (isPersistentListening) {
                    val restartDelay = when (error) {
                        SpeechRecognizer.ERROR_NO_MATCH,
                        SpeechRecognizer.ERROR_SPEECH_TIMEOUT -> 50L // Very fast restart for timeouts
                        SpeechRecognizer.ERROR_AUDIO,
                        SpeechRecognizer.ERROR_RECOGNIZER_BUSY -> 200L // Very short delay for audio issues
                        else -> 500L // Much shorter delay for other errors
                    }

                    scope.launch {
                        delay(restartDelay)
                        restartListening()
                    }
                }
            }

            override fun onResults(results: Bundle?) {
                val matches = results?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
                if (!matches.isNullOrEmpty()) {
                    val recognizedText = matches[0].lowercase().trim()
                    _recognizedText.value = recognizedText
                    Log.d("VoiceRecognition", "Recognized: $recognizedText")

                    // Process command through hierarchy
                    processCommand(recognizedText)
                }

                _isListeningState.value = false

                // Continue listening if persistent listening is enabled
                if (isPersistentListening) {
                    scope.launch {
                        delay(100) // Minimal pause before restarting for continuous listening
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
        if (isPersistentListening && !isListening) {
            try {
                createNewSpeechRecognizer()
                startListening()
            } catch (e: Exception) {
                Log.e("VoiceRecognition", "Error restarting speech recognition: ${e.message}")
                // Try again after a longer delay
                scope.launch {
                    delay(3000)
                    restartListening()
                }
            }
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

        if (!isListening && isPersistentListening) {
            // Ensure we have a valid speech recognizer
            if (speechRecognizer == null) {
                Log.d("VoiceRecognition", "Creating new speech recognizer before starting")
                createNewSpeechRecognizer()
            }

            isListening = true
            _isListeningState.value = true

            val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
                putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
                putExtra(RecognizerIntent.EXTRA_LANGUAGE, Locale.getDefault())
                putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 3)
                putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true)
                // Set shorter timeout values for more responsive restart
                putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_MINIMUM_LENGTH_MILLIS, 50L)
                putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS, 2000L) // 2 seconds
                putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_POSSIBLY_COMPLETE_SILENCE_LENGTH_MILLIS, 2000L) // 2 seconds
                // Add additional parameters to keep listening active
                putExtra("android.speech.extra.DICTATION_MODE", true)
                putExtra("android.speech.extra.PREFER_OFFLINE", false)
            }
            try {
                speechRecognizer?.startListening(intent)
                lastListeningStart = System.currentTimeMillis()
                Log.d("VoiceRecognition", "Started listening successfully with enhanced error handling")
            } catch (e: Exception) {
                Log.e("VoiceRecognition", "Error starting speech recognition: ${e.message}")
                isListening = false
                _isListeningState.value = false
                // Try to restart after error
                if (isPersistentListening) {
                    scope.launch {
                        delay(1000) // Shorter delay for faster recovery
                        createNewSpeechRecognizer() // Create fresh recognizer
                        restartListening()
                    }
                }
            }
        } else {
            Log.d("VoiceRecognition", "Skipping start - already listening or persistent listening disabled")
        }
    }

    fun stopListening() {
        isListening = false
        _isListeningState.value = false
        speechRecognizer?.stopListening()
        Log.d("VoiceRecognition", "Stopped listening")
    }

    fun enablePersistentListening() {
        Log.d("VoiceRecognition", "Enabling persistent listening")
        isPersistentListening = true

        // Ensure speech recognizer is properly initialized
        if (speechRecognizer == null) {
            createNewSpeechRecognizer()
        }

        if (!isListening) {
            scope.launch {
                delay(500) // Small delay to ensure everything is ready
                startListening()
            }
        }
        startHeartbeat()
        startForceRestart()
    }

    private fun startHeartbeat() {
        heartbeatHandler.removeCallbacksAndMessages(null)
        val heartbeatRunnable = object : Runnable {
            override fun run() {
                if (isPersistentListening) {
                    val currentTime = System.currentTimeMillis()

                    // Check if we haven't been listening for more than heartbeat interval
                    if (!isListening && (currentTime - lastHeartbeat > heartbeatInterval)) {
                        Log.d("VoiceRecognition", "Heartbeat: Restarting voice recognition - not listening")
                        restartListening()
                    }

                    // Check if we've been listening too long without restart (force restart)
                    if (isListening && (currentTime - lastListeningStart > maxListeningDuration)) {
                        Log.d("VoiceRecognition", "Heartbeat: Force restarting after long listening session")
                        stopListening()
                        scope.launch {
                            delay(100) // Very brief pause before restart
                            restartListening()
                        }
                    }

                    lastHeartbeat = currentTime
                    heartbeatHandler.postDelayed(this, heartbeatInterval)
                }
            }
        }
        heartbeatHandler.postDelayed(heartbeatRunnable, heartbeatInterval)
    }

    private fun startForceRestart() {
        forceRestartHandler.removeCallbacksAndMessages(null)
        val forceRestartRunnable = object : Runnable {
            override fun run() {
                if (isPersistentListening) {
                    Log.d("VoiceRecognition", "Force restart: Proactively restarting speech recognition")
                    stopListening()
                    scope.launch {
                        delay(50) // Minimal delay
                        restartListening()
                    }
                    forceRestartHandler.postDelayed(this, forceRestartInterval)
                }
            }
        }
        forceRestartHandler.postDelayed(forceRestartRunnable, forceRestartInterval)
    }

    fun disablePersistentListening() {
        isPersistentListening = false
        heartbeatHandler.removeCallbacksAndMessages(null)
        forceRestartHandler.removeCallbacksAndMessages(null)
        stopListening()
    }

    fun speak(text: String, onComplete: (() -> Unit)? = null) {
        lastSpokenText = text
        val utteranceId = "utterance_${System.currentTimeMillis()}"

        // Temporarily stop listening while speaking to avoid interference
        val wasListening = isListening
        if (wasListening) {
            stopListening()
        }

        textToSpeech?.setOnUtteranceProgressListener(object : UtteranceProgressListener() {
            override fun onStart(utteranceId: String?) {
                Log.d("VoiceRecognition", "TTS started: $text")
            }
            override fun onDone(utteranceId: String?) {
                Log.d("VoiceRecognition", "TTS completed: $text")
                // Restart listening after TTS completes
                if (wasListening && isPersistentListening) {
                    scope.launch {
                        delay(300) // Brief delay to ensure TTS audio has finished
                        startListening()
                    }
                }
                onComplete?.invoke()
            }
            override fun onError(utteranceId: String?) {
                Log.e("VoiceRecognition", "TTS error for: $text")
                // Restart listening even on TTS error
                if (wasListening && isPersistentListening) {
                    scope.launch {
                        delay(300)
                        startListening()
                    }
                }
                onComplete?.invoke()
            }
        })

        textToSpeech?.speak(text, TextToSpeech.QUEUE_FLUSH, null, utteranceId)
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
        stopListening()
        restartHandler.removeCallbacksAndMessages(null)
        heartbeatHandler.removeCallbacksAndMessages(null)
        forceRestartHandler.removeCallbacksAndMessages(null)
        speechRecognizer?.destroy()
        speechRecognizer = null
        textToSpeech?.stop()
        textToSpeech?.shutdown()
        scope.cancel()
    }
}