package com.example.vocaleyesnew

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.ContextCompat
import com.example.vocaleyesnew.objectdetection.ObjectDetectionActivity
import com.example.vocaleyesnew.textextraction.TextExtractionActivity
import com.example.vocaleyesnew.chat.ChatActivity
import com.example.vocaleyesnew.navigation.NavigationActivity
import com.example.vocaleyesnew.ui.theme.VocalEyesNewTheme
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

class MainActivity : ComponentActivity() {
    private lateinit var voiceRecognitionManager: VoiceRecognitionManager
    private val permissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { isGranted ->
        if (isGranted) {
            startVoiceRecognition()
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        voiceRecognitionManager = VoiceRecognitionManager(this)
        checkPermissionAndStartVoiceRecognition()

        setContent {
            VocalEyesNewTheme {
                HomeScreen(voiceRecognitionManager)
            }
        }
    }

    private fun checkPermissionAndStartVoiceRecognition() {
        when {
            ContextCompat.checkSelfPermission(
                this,
                Manifest.permission.RECORD_AUDIO
            ) == PackageManager.PERMISSION_GRANTED -> {
                startVoiceRecognition()
            }
            else -> {
                permissionLauncher.launch(Manifest.permission.RECORD_AUDIO)
            }
        }
    }

    private fun startVoiceRecognition() {
        voiceRecognitionManager.apply {
            setCommandListener { command ->
                when {
                    command.contains("object") || command.contains("detection") -> {
                        speak("Opening object detection") {
                            startActivity(Intent(this@MainActivity, ObjectDetectionActivity::class.java))
                        }
                    }
                    command.contains("navigation") -> {
                        speak("Opening navigation") {
                            startActivity(Intent(this@MainActivity, NavigationActivity::class.java))
                        }
                    }
                    command.contains("face") || command.contains("recognition") -> {
                        speak("Opening face recognition")
                        // TODO: Launch face recognition activity
                    }
                    command.contains("book") || command.contains("reading") -> {
                        speak("Opening book reading") {
                            startActivity(Intent(this@MainActivity, TextExtractionActivity::class.java))
                        }
                    }
                    command.contains("assistant") || command.contains("chat") -> {
                        speak("Opening AI Assistant") {
                            startActivity(Intent(this@MainActivity, ChatActivity::class.java))
                        }
                    }
                    command.contains("help") || command.contains("options") -> {
                        speak("Available commands are: object detection, navigation, face recognition, book reading, and assistant. What would you like to do?")
                    }
                }
            }
            startListening()
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        voiceRecognitionManager.cleanup()
    }
}

@Composable
fun HomeScreen(voiceRecognitionManager: VoiceRecognitionManager) {
    val scope = rememberCoroutineScope()
    var isFirstLaunch by remember { mutableStateOf(true) }

    LaunchedEffect(isFirstLaunch) {
        if (isFirstLaunch) {
            delay(1000) // Wait for TTS to initialize
            voiceRecognitionManager.speak(
                "Welcome to VocalEyes. You can say: object detection, navigation, face recognition, book reading, or assistant. Say help for options. What would you like to do?",
            )
            isFirstLaunch = false
        }
    }

    Scaffold(
        modifier = Modifier.fillMaxSize()
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(24.dp)
        ) {
            Text(
                text = "VocalEyes",
                style = MaterialTheme.typography.headlineLarge,
                textAlign = TextAlign.Center,
                modifier = Modifier.fillMaxWidth()
            )

            Text(
                text = "Voice Commands Available:",
                style = MaterialTheme.typography.titleMedium,
                modifier = Modifier.padding(top = 16.dp)
            )

            FeatureButton("Object Detection") {
                scope.launch {
                    voiceRecognitionManager.speak("Opening object detection") {
                        val context = voiceRecognitionManager.getContext()
                        context.startActivity(Intent(context, ObjectDetectionActivity::class.java))
                    }
                }
            }

            FeatureButton("Navigation") {
                scope.launch {
                    voiceRecognitionManager.speak("Opening navigation") {
                        val context = voiceRecognitionManager.getContext()
                        context.startActivity(Intent(context, NavigationActivity::class.java))
                    }
                }
            }

            FeatureButton("Face Recognition") {
                scope.launch {
                    voiceRecognitionManager.speak("Opening face recognition")
                    // TODO: Launch face recognition activity
                }
            }

            FeatureButton("Book Reading") {
                scope.launch {
                    voiceRecognitionManager.speak("Opening book reading") {
                        val context = voiceRecognitionManager.getContext()
                        context.startActivity(Intent(context, TextExtractionActivity::class.java))
                    }
                }
            }

            FeatureButton("AI Assistant") {
                scope.launch {
                    voiceRecognitionManager.speak("Opening AI Assistant") {
                        val context = voiceRecognitionManager.getContext()
                        context.startActivity(Intent(context, ChatActivity::class.java))
                    }
                }
            }

            Spacer(modifier = Modifier.height(24.dp))

            Text(
                text = "Say 'Help' for available commands",
                style = MaterialTheme.typography.bodyLarge,
                textAlign = TextAlign.Center,
                modifier = Modifier.fillMaxWidth()
            )
        }
    }
}

@Composable
fun FeatureButton(text: String, onClick: () -> Unit) {
    Button(
        onClick = onClick,
        modifier = Modifier
            .fillMaxWidth()
            .height(72.dp)
    ) {
        Text(
            text = text,
            fontSize = 18.sp,
            textAlign = TextAlign.Center
        )
    }
}