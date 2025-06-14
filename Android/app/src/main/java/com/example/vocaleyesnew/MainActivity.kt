package com.example.vocaleyesnew

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Bundle
import android.util.Log
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.activity.viewModels
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Mic
import androidx.compose.material.icons.filled.MicOff
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.ContextCompat
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import com.example.vocaleyesnew.auth.AuthState
import com.example.vocaleyesnew.auth.AuthViewModel
import com.example.vocaleyesnew.auth.LoginActivity
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

    private val authViewModel: AuthViewModel by viewModels {
        object : ViewModelProvider.Factory {
            @Suppress("UNCHECKED_CAST")
            override fun <T : ViewModel> create(modelClass: Class<T>): T {
                return AuthViewModel(applicationContext) as T
            }
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Check authentication state
        if (authViewModel.authState.value !is AuthState.Authenticated) {
            // User is not authenticated, redirect to login
            val intent = Intent(this, LoginActivity::class.java)
            intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
            startActivity(intent)
            finish()
            return
        }

        voiceRecognitionManager = VoiceRecognitionManager.getInstance(this)
        voiceRecognitionManager.setCurrentActivity(this)
        checkPermissionAndStartVoiceRecognition()

        setContent {
            VocalEyesNewTheme {
                HomeScreen(voiceRecognitionManager, authViewModel)
            }
        }
    }

    override fun onResume() {
        super.onResume()
        voiceRecognitionManager.setCurrentActivity(this)
        voiceRecognitionManager.enablePersistentListening()
    }

    override fun onPause() {
        super.onPause()
        // Keep voice recognition active even when paused for accessibility
        Log.d("MainActivity", "Activity paused but keeping voice recognition active")
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
            // Set up global command listener for MainActivity
            setGlobalCommandListener { command ->
                when {
                    command.contains("object") || command.contains("detection") -> {
                        speak("Opening object detection") {
                            startActivity(Intent(this@MainActivity, ObjectDetectionActivity::class.java))
                        }
                        true
                    }
                    command.contains("navigation") -> {
                        speak("Opening navigation") {
                            startActivity(Intent(this@MainActivity, NavigationActivity::class.java))
                        }
                        true
                    }
                    command.contains("face") || command.contains("recognition") -> {
                        speak("Opening face recognition")
                        // TODO: Launch face recognition activity
                        true
                    }
                    command.contains("book") || command.contains("reading") -> {
                        speak("Opening book reading") {
                            startActivity(Intent(this@MainActivity, TextExtractionActivity::class.java))
                        }
                        true
                    }
                    command.contains("assistant") || command.contains("chat") -> {
                        speak("Opening AI Assistant") {
                            startActivity(Intent(this@MainActivity, ChatActivity::class.java))
                        }
                        true
                    }
                    command.contains("help") || command.contains("options") -> {
                        speak("Available commands are: object detection, navigation, face recognition, book reading, and assistant. Say go back to return to previous screen, or go home to return to main menu.")
                        true
                    }
                    else -> false // Command not handled
                }
            }
            enablePersistentListening()
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        // Only cleanup if this is the last activity
        if (isFinishing) {
            voiceRecognitionManager.cleanup()
        }
    }
}

@Composable
fun HomeScreen(voiceRecognitionManager: VoiceRecognitionManager, authViewModel: AuthViewModel) {
    val scope = rememberCoroutineScope()
    var isFirstLaunch by remember { mutableStateOf(true) }
    val isListening by voiceRecognitionManager.isListeningState.collectAsState()
    val authState by authViewModel.authState.collectAsState()

    LaunchedEffect(isFirstLaunch) {
        if (isFirstLaunch) {
            delay(1500) // Wait for TTS and voice recognition to initialize
            voiceRecognitionManager.speak(
                "Welcome to VocalEyes. Voice recognition is always active. You can say: object detection, navigation, face recognition, book reading, or assistant. Say help for options. What would you like to do?",
            )
            isFirstLaunch = false
        }
    }

    // Monitor auth state for logout
    LaunchedEffect(authState) {
        if (authState is AuthState.Unauthenticated) {
            // User logged out, redirect to login
            val context = voiceRecognitionManager.getContext()
            val intent = Intent(context, LoginActivity::class.java)
            intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
            context.startActivity(intent)
        }
    }

    // Ensure voice recognition stays active with aggressive monitoring
    LaunchedEffect(Unit) {
        voiceRecognitionManager.enablePersistentListening()

        // Very aggressive monitoring - check every 1 second
        while (true) {
            delay(1000) // Check every 1 second
            if (!voiceRecognitionManager.isCurrentlyListening()) {
                Log.d("MainActivity", "Voice recognition not active, forcing immediate restart")
                voiceRecognitionManager.enablePersistentListening()
            }
        }
    }

    // Additional monitoring for microphone state
    LaunchedEffect(isListening) {
        if (!isListening && voiceRecognitionManager.isCurrentlyListening()) {
            Log.d("MainActivity", "Microphone state mismatch detected, forcing restart")
            voiceRecognitionManager.enablePersistentListening()
        }
    }

    Scaffold(
        modifier = Modifier.fillMaxSize(),
        topBar = {
            // Add a simple status bar showing voice recognition state
            Surface(
                modifier = Modifier.fillMaxWidth(),
                color = if (isListening) MaterialTheme.colorScheme.primaryContainer else MaterialTheme.colorScheme.errorContainer,
                tonalElevation = 4.dp
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(8.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = if (isListening) Icons.Default.Mic else Icons.Default.MicOff,
                            contentDescription = if (isListening) "Listening" else "Not Listening",
                            tint = if (isListening) MaterialTheme.colorScheme.onPrimaryContainer else MaterialTheme.colorScheme.onErrorContainer
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = if (isListening) "Voice Recognition Active" else "Voice Recognition Inactive",
                            style = MaterialTheme.typography.bodyMedium,
                            color = if (isListening) MaterialTheme.colorScheme.onPrimaryContainer else MaterialTheme.colorScheme.onErrorContainer
                        )
                    }

                    // Logout button
                    IconButton(
                        onClick = {
                            scope.launch {
                                authViewModel.signOut()
                            }
                        }
                    ) {
                        Icon(
                            imageVector = Icons.Default.ExitToApp,
                            contentDescription = "Logout",
                            tint = if (isListening) MaterialTheme.colorScheme.onPrimaryContainer else MaterialTheme.colorScheme.onErrorContainer
                        )
                    }
                }
            }
        }
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