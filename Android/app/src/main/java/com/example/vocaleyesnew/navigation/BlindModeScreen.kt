package com.example.vocaleyesnew.navigation

import android.Manifest
import android.app.Activity
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.speech.tts.TextToSpeech
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalLifecycleOwner
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import kotlinx.coroutines.launch
import java.util.Locale
import java.util.concurrent.Executors
import com.example.vocaleyesnew.facerecognition.FaceRecognitionManager
import com.example.vocaleyesnew.VoiceRecognitionManager
import android.graphics.Bitmap
import android.util.Log

@Composable
fun BlindModeScreen(
    faceRecognitionManager: FaceRecognitionManager,
    voiceRecognitionManager: VoiceRecognitionManager
) {
    val cameraExecutor = remember { Executors.newSingleThreadExecutor() }
    val context = LocalContext.current
    LocalLifecycleOwner.current
    var hasPermission by remember {
        mutableStateOf(
            ContextCompat.checkSelfPermission(
                context,
                Manifest.permission.CAMERA
            ) == PackageManager.PERMISSION_GRANTED
        )
    }
    val coroutineScope = rememberCoroutineScope()
    var sessionStarted by remember { mutableStateOf(true) }
    var analysisResult by remember { mutableStateOf("") }
    var displayText by remember { mutableStateOf("Initializing...") }
    val tts = remember { mutableStateOf<TextToSpeech?>(null) }
    var lastSpokenIndex by remember { mutableStateOf(0) }
    var lastProcessedTimestamp by remember { mutableStateOf(0L) }
    val frameInterval = 12000 // Process a frame every 12 seconds
    val scrollState = rememberScrollState()

    LaunchedEffect(context) {
        tts.value = TextToSpeech(context) { status ->
            if (status != TextToSpeech.ERROR) {
                tts.value?.language = Locale.US
                tts.value?.setSpeechRate(1.5f)
            }
        }
    }

    DisposableEffect(Unit) {
        onDispose {
            cameraExecutor.shutdown()
            tts.value?.stop()
            tts.value?.shutdown()
        }
    }

    Box(modifier = Modifier.fillMaxSize()) {
        if (hasPermission) {
            if (sessionStarted) {
                CameraPreviewWithAnalysis { imageProxy ->
                    val currentTimestamp = System.currentTimeMillis()
                    if (currentTimestamp - lastProcessedTimestamp >= frameInterval) {
                        coroutineScope.launch {
                            val bitmap = imageProxy.toBitmap()
                            if (bitmap != null) {
                                // First, check for faces in the image
                                try {
                                    val faceResult = faceRecognitionManager.detectFaces(bitmap)
                                    if (faceResult.faces.isNotEmpty()) {
                                        faceResult.faces.forEach { face ->
                                            val recognitionResult = faceRecognitionManager.recognizeFace(face, "navigation")
                                            recognitionResult?.let { result ->
                                                if (result.personName != null) {
                                                    val faceMessage = "I can see ${result.personName} in front of you."
                                                    voiceRecognitionManager.speak(faceMessage)
                                                    Log.d("Navigation", "Recognized face: ${result.personName}")
                                                } else if (result.isNewFace) {
                                                    val unknownFaceMessage = "I can see an unknown person in front of you."
                                                    voiceRecognitionManager.speak(unknownFaceMessage)
                                                    Log.d("Navigation", "Unknown face detected")
                                                }
                                            }
                                        }
                                    }
                                } catch (e: Exception) {
                                    Log.e("Navigation", "Face recognition error: ${e.message}")
                                }

                                // Then proceed with scene analysis
                                sendFrameToGeminiAI(bitmap, { partialResult ->
                                    analysisResult += " $partialResult"
                                    val newText = analysisResult.substring(lastSpokenIndex)
                                    displayText = analysisResult // Show complete analysis result
                                    tts.value?.speak(newText, TextToSpeech.QUEUE_ADD, null, null)
                                    lastSpokenIndex = analysisResult.length
                                }, { error ->
                                    displayText = "Error: $error"
                                })
                                lastProcessedTimestamp = currentTimestamp
                            }
                            imageProxy.close()
                        }
                    } else {
                        imageProxy.close()
                    }
                }
            }
        } else {
            ActivityCompat.requestPermissions(
                (context as Activity),
                arrayOf(Manifest.permission.CAMERA),
                1
            )
        }

        // Text overlay at the bottom with scrolling
        Box(
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .fillMaxWidth()
                .heightIn(min = 100.dp, max = 200.dp)
                .background(Color.Black.copy(alpha = 0.8f))
                .padding(16.dp)
        ) {
            Text(
                text = displayText,
                color = Color.White,
                fontSize = 20.sp,
                textAlign = TextAlign.Left,
                modifier = Modifier
                    .fillMaxWidth()
                    .verticalScroll(scrollState)
            )
        }
    }
} 