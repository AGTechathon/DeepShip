package com.example.vocaleyesnew.facerecognition

import android.graphics.Bitmap
import android.util.Log
import androidx.camera.core.ImageProxy
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CameraAlt
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.PersonAdd
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.vocaleyesnew.VoiceRecognitionManager
import com.example.vocaleyesnew.navigation.CameraPreviewWithAnalysis
import com.example.vocaleyesnew.textextraction.toBitmap
import com.google.mlkit.vision.face.Face
import kotlinx.coroutines.launch

enum class FaceRecognitionMode {
    RECOGNIZE,
    ADD_PERSON
}

@Composable
fun FaceRecognitionScreen(
    faceRecognitionManager: FaceRecognitionManager,
    voiceRecognitionManager: VoiceRecognitionManager
) {
    var mode by remember { mutableStateOf(FaceRecognitionMode.RECOGNIZE) }
    var detectedFaces by remember { mutableStateOf<List<Face>>(emptyList()) }
    var recognitionResults by remember { mutableStateOf<List<FaceRecognitionManager.FaceRecognitionResult>>(emptyList()) }
    var isProcessing by remember { mutableStateOf(false) }
    var statusMessage by remember { mutableStateOf("Point camera at a face to recognize") }
    var currentBitmap by remember { mutableStateOf<Bitmap?>(null) }
    var awaitingPersonName by remember { mutableStateOf(false) }
    var pendingFace by remember { mutableStateOf<Face?>(null) }
    var lastAnnouncementTime by remember { mutableStateOf(0L) }
    var lastRecognizedName by remember { mutableStateOf<String?>(null) }

    val scope = rememberCoroutineScope()
    val context = LocalContext.current
    
    // Voice command handling for person name input
    LaunchedEffect(awaitingPersonName) {
        if (awaitingPersonName) {
            voiceRecognitionManager.setActivitySpecificListener { command ->
                if (pendingFace != null && currentBitmap != null) {
                    val personName = command.trim().lowercase()

                    // Filter out command words and only accept actual names
                    val commandWords = listOf("capture", "save", "add", "person", "face", "recognition", "recognize", "identify", "cancel", "back", "home")
                    val isValidName = personName.isNotEmpty() &&
                                     personName.length >= 2 &&
                                     !commandWords.any { personName.contains(it) }

                    if (isValidName) {
                        Log.d("FaceRecognition", "Processing person name: $personName")
                        scope.launch {
                            val success = faceRecognitionManager.saveFace(pendingFace!!, currentBitmap!!, personName)
                            if (success) {
                                voiceRecognitionManager.speak("Face saved for $personName. You can now recognize this person.")
                                statusMessage = "Face saved for $personName"
                                // Switch back to recognition mode after saving
                                mode = FaceRecognitionMode.RECOGNIZE
                            } else {
                                voiceRecognitionManager.speak("Failed to save face. Please try again.")
                                statusMessage = "Failed to save face"
                            }
                            awaitingPersonName = false
                            pendingFace = null
                        }
                        true
                    } else {
                        // Give feedback for invalid names
                        if (personName.length < 2) {
                            voiceRecognitionManager.speak("Please say a longer name")
                        } else if (commandWords.any { personName.contains(it) }) {
                            voiceRecognitionManager.speak("Please say just the person's name")
                        }
                        false
                    }
                } else {
                    false
                }
            }
        }
    }
    
    Box(modifier = Modifier.fillMaxSize()) {
        // Camera preview
        CameraPreviewWithAnalysis { imageProxy ->
            if (!isProcessing) {
                isProcessing = true
                scope.launch {
                    try {
                        val bitmap = imageProxy.toBitmap()
                        if (bitmap != null) {
                            currentBitmap = bitmap
                            val result = faceRecognitionManager.detectFaces(bitmap)
                            detectedFaces = result.faces
                            
                            when (mode) {
                                FaceRecognitionMode.RECOGNIZE -> {
                                    if (result.faces.isNotEmpty()) {
                                        val results = mutableListOf<FaceRecognitionManager.FaceRecognitionResult>()
                                        result.faces.forEach { face ->
                                            val recognitionResult = faceRecognitionManager.recognizeFace(face)
                                            recognitionResult?.let { results.add(it) }
                                        }
                                        recognitionResults = results
                                        
                                        // Announce recognition results with throttling
                                        val recognizedPeople = results.filter { it.personName != null }
                                        if (recognizedPeople.isNotEmpty()) {
                                            val names = recognizedPeople.map { it.personName }.distinct()
                                            val currentName = names.firstOrNull()
                                            val currentTime = System.currentTimeMillis()

                                            val message = if (names.size == 1) {
                                                "I can see ${names.first()}"
                                            } else {
                                                "I can see ${names.joinToString(", ")}"
                                            }
                                            statusMessage = message

                                            // Only announce if it's a different person or enough time has passed
                                            if (currentName != lastRecognizedName ||
                                                currentTime - lastAnnouncementTime > 3000) { // 3 second throttle
                                                voiceRecognitionManager.speak(message)
                                                lastAnnouncementTime = currentTime
                                                lastRecognizedName = currentName
                                            }
                                        } else {
                                            statusMessage = "Unknown person detected"
                                            // Reset last recognized name when no one is recognized
                                            if (lastRecognizedName != null) {
                                                lastRecognizedName = null
                                            }
                                        }
                                    } else {
                                        statusMessage = "No faces detected"
                                        recognitionResults = emptyList()
                                    }
                                }
                                FaceRecognitionMode.ADD_PERSON -> {
                                    if (result.faces.isNotEmpty()) {
                                        statusMessage = "${result.faces.size} face(s) detected. Say 'capture' to save."
                                    } else {
                                        statusMessage = "No faces detected. Position face in camera."
                                    }
                                }
                            }
                        }
                    } catch (e: Exception) {
                        Log.e("FaceRecognition", "Error processing image", e)
                        statusMessage = "Error processing image"
                    } finally {
                        isProcessing = false
                        imageProxy.close()
                    }
                }
            } else {
                imageProxy.close()
            }
        }
        
        // Face detection overlay
        Canvas(modifier = Modifier.fillMaxSize()) {
            detectedFaces.forEach { face ->
                val rect = face.boundingBox
                drawRect(
                    color = when (mode) {
                        FaceRecognitionMode.RECOGNIZE -> Color.Green
                        FaceRecognitionMode.ADD_PERSON -> Color.Blue
                    },
                    topLeft = androidx.compose.ui.geometry.Offset(rect.left.toFloat(), rect.top.toFloat()),
                    size = androidx.compose.ui.geometry.Size(
                        rect.width().toFloat(),
                        rect.height().toFloat()
                    ),
                    style = Stroke(width = 4.dp.toPx())
                )
            }
        }
        
        // Top status bar
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
                .align(Alignment.TopCenter),
            colors = CardDefaults.cardColors(
                containerColor = MaterialTheme.colorScheme.surface.copy(alpha = 0.9f)
            )
        ) {
            Column(
                modifier = Modifier.padding(16.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text(
                    text = when (mode) {
                        FaceRecognitionMode.RECOGNIZE -> "Face Recognition Mode"
                        FaceRecognitionMode.ADD_PERSON -> "Add Person Mode"
                    },
                    style = MaterialTheme.typography.titleMedium,
                    color = when (mode) {
                        FaceRecognitionMode.RECOGNIZE -> Color.Green
                        FaceRecognitionMode.ADD_PERSON -> Color.Blue
                    }
                )
                Text(
                    text = statusMessage,
                    style = MaterialTheme.typography.bodyMedium,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.padding(top = 8.dp)
                )
                
                if (awaitingPersonName) {
                    Text(
                        text = "Please say the person's name",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.primary,
                        modifier = Modifier.padding(top = 4.dp)
                    )
                }
            }
        }
        
        // Bottom controls
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
                .align(Alignment.BottomCenter),
            colors = CardDefaults.cardColors(
                containerColor = MaterialTheme.colorScheme.surface.copy(alpha = 0.9f)
            )
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                horizontalArrangement = Arrangement.SpaceEvenly
            ) {
                // Mode toggle button
                Button(
                    onClick = {
                        mode = if (mode == FaceRecognitionMode.RECOGNIZE) {
                            FaceRecognitionMode.ADD_PERSON
                        } else {
                            FaceRecognitionMode.RECOGNIZE
                        }
                        statusMessage = when (mode) {
                            FaceRecognitionMode.RECOGNIZE -> "Point camera at a face to recognize"
                            FaceRecognitionMode.ADD_PERSON -> "Position face in camera and say 'capture'"
                        }
                        voiceRecognitionManager.speak(statusMessage)
                    },
                    colors = ButtonDefaults.buttonColors(
                        containerColor = when (mode) {
                            FaceRecognitionMode.RECOGNIZE -> MaterialTheme.colorScheme.primary
                            FaceRecognitionMode.ADD_PERSON -> MaterialTheme.colorScheme.secondary
                        }
                    )
                ) {
                    Icon(
                        imageVector = when (mode) {
                            FaceRecognitionMode.RECOGNIZE -> Icons.Default.PersonAdd
                            FaceRecognitionMode.ADD_PERSON -> Icons.Default.Person
                        },
                        contentDescription = null
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        when (mode) {
                            FaceRecognitionMode.RECOGNIZE -> "Add Person"
                            FaceRecognitionMode.ADD_PERSON -> "Recognize"
                        }
                    )
                }
                
                // Capture button (only in add person mode)
                if (mode == FaceRecognitionMode.ADD_PERSON && detectedFaces.isNotEmpty()) {
                    Button(
                        onClick = {
                            val face = detectedFaces.firstOrNull()
                            if (face != null && currentBitmap != null) {
                                pendingFace = face
                                awaitingPersonName = true
                                voiceRecognitionManager.speak("Please say the person's name")
                                statusMessage = "Say the person's name"
                            }
                        },
                        colors = ButtonDefaults.buttonColors(
                            containerColor = MaterialTheme.colorScheme.tertiary
                        )
                    ) {
                        Icon(
                            imageVector = Icons.Default.CameraAlt,
                            contentDescription = null
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Capture")
                    }
                }
            }
        }
    }
}
