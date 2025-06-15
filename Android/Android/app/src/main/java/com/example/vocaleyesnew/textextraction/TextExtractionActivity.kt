package com.example.vocaleyesnew.textextraction

import android.graphics.Bitmap
import android.os.Bundle
import android.speech.tts.TextToSpeech
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.camera.core.ImageCapture
import androidx.camera.core.ImageCaptureException
import androidx.camera.core.ImageProxy
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.core.content.ContextCompat
import com.example.vocaleyesnew.ui.theme.VocalEyesNewTheme
import com.example.vocaleyesnew.VoiceRecognitionManager
import kotlinx.coroutines.launch
import java.util.*

class TextExtractionActivity : ComponentActivity(), TextToSpeech.OnInitListener {
    private lateinit var textToSpeech: TextToSpeech
    private lateinit var voiceRecognitionManager: VoiceRecognitionManager

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        textToSpeech = TextToSpeech(this, this)
        voiceRecognitionManager = VoiceRecognitionManager.getInstance(this)
        voiceRecognitionManager.setCurrentActivity(this)

        setContent {
            VocalEyesNewTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    MainScreen()
                }
            }
        }
    }

    override fun onResume() {
        super.onResume()
        voiceRecognitionManager.setCurrentActivity(this)
        setupVoiceCommands()
    }

    override fun onInit(status: Int) {
        if (status == TextToSpeech.SUCCESS) {
            textToSpeech.language = Locale.getDefault()
            voiceRecognitionManager.speak(
                "Welcome to book reading mode. Say capture to take a photo and read text, stop reading to stop, or repeat to repeat last text. Say go back to return."
            )
            setupVoiceCommands()
        }
    }

    private fun setupVoiceCommands() {
        voiceRecognitionManager.setActivitySpecificListener { command ->
            when {
                command.contains("capture") || command.contains("take photo") || command.contains("read") -> {
                    // Trigger capture functionality
                    voiceRecognitionManager.speak("Capturing text")
                    true
                }
                command.contains("stop reading") || command.contains("stop") -> {
                    textToSpeech.stop()
                    voiceRecognitionManager.speak("Stopped reading")
                    true
                }
                command.contains("repeat") || command.contains("repeat last") -> {
                    // This will be handled by the global repeat command
                    false
                }
                else -> false
            }
        }
    }

    override fun onDestroy() {
        textToSpeech.stop()
        textToSpeech.shutdown()
        super.onDestroy()
    }

    @Composable
    fun MainScreen() {
        var recognizedText by remember { mutableStateOf("") }
        var showCamera by remember { mutableStateOf(true) }
        var errorMessage by remember { mutableStateOf<String?>(null) }
        var capturedImageCapture by remember { mutableStateOf<ImageCapture?>(null) }
        val textRecognizer = remember { TextRecognizer() }
        val scope = rememberCoroutineScope()
        val context = LocalContext.current
        var tapCount by remember { mutableStateOf(0) }
        var lastTapTime by remember { mutableStateOf(0L) }
        var tapResetJob by remember { mutableStateOf<kotlinx.coroutines.Job?>(null) }

        Box(
            modifier = Modifier
                .fillMaxSize()
                .pointerInput(Unit) {
                    detectTapGestures(
                        onTap = {
                            val currentTime = System.currentTimeMillis()
                            
                            tapResetJob?.cancel()
                            
                            if (currentTime - lastTapTime > 800) {
                                tapCount = 1
                            } else {
                                tapCount++
                            }
                            lastTapTime = currentTime

                            tapResetJob = scope.launch {
                                kotlinx.coroutines.delay(800)
                                when (tapCount) {
                                    2 -> { // Double tap
                                        if (showCamera && capturedImageCapture != null) {
                                            captureAndRecognizeText(
                                                imageCapture = capturedImageCapture!!,
                                                scope = scope,
                                                context = context,
                                                textRecognizer = textRecognizer,
                                                onTextRecognized = { text ->
                                                    recognizedText = text
                                                    showCamera = false
                                                    textToSpeech.speak(text, TextToSpeech.QUEUE_FLUSH, null, null)
                                                },
                                                onError = { exception ->
                                                    errorMessage = exception.message
                                                }
                                            )
                                        } else if (!showCamera) {
                                            recognizedText = ""
                                            showCamera = true
                                        }
                                    }
                                    3 -> { // Triple tap
                                        if (!showCamera) {
                                            textToSpeech.stop()
                                        }
                                    }
                                    4 -> { // Four taps
                                        if (!showCamera && recognizedText.isNotEmpty()) {
                                            textToSpeech.speak(recognizedText, TextToSpeech.QUEUE_FLUSH, null, null)
                                        }
                                    }
                                }
                                tapCount = 0
                            }
                        }
                    )
                }
        ) {
            if (showCamera) {
                CameraPreview(
                    onImageCaptured = { imageCapture ->
                        capturedImageCapture = imageCapture
                    },
                    onError = { exception ->
                        errorMessage = exception.message
                        showCamera = false
                    }
                )
            }

            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(16.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                errorMessage?.let { error ->
                    Text(
                        text = error,
                        color = MaterialTheme.colorScheme.error,
                        modifier = Modifier.padding(bottom = 16.dp)
                    )
                }

                if (recognizedText.isNotEmpty()) {
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .fillMaxWidth()
                    ) {
                        Text(
                            text = recognizedText,
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(bottom = 16.dp)
                                .verticalScroll(rememberScrollState())
                        )
                    }
                }
            }
        }
    }

    private fun captureAndRecognizeText(
        imageCapture: ImageCapture,
        scope: kotlinx.coroutines.CoroutineScope,
        context: android.content.Context,
        textRecognizer: TextRecognizer,
        onTextRecognized: (String) -> Unit,
        onError: (Exception) -> Unit
    ) {
        imageCapture.takePicture(
            ContextCompat.getMainExecutor(context),
            object : ImageCapture.OnImageCapturedCallback() {
                override fun onCaptureSuccess(image: ImageProxy) {
                    val bitmap = image.toBitmap()
                    scope.launch {
                        try {
                            val text = textRecognizer.recognizeText(bitmap)
                            onTextRecognized(text)
                        } catch (e: Exception) {
                            onError(e)
                        } finally {
                            image.close()
                        }
                    }
                }

                override fun onError(exception: ImageCaptureException) {
                    onError(exception)
                }
            }
        )
    }
} 