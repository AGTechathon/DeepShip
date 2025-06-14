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
import androidx.compose.material.icons.filled.ExitToApp
import androidx.compose.material.icons.filled.Mic
import androidx.compose.material.icons.filled.MicOff
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.role
import androidx.compose.ui.semantics.semantics
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
        Log.d("MainActivity", "Starting voice recognition setup")
        voiceRecognitionManager.apply {
            // Set up global command listener for MainActivity
            setGlobalCommandListener { command ->
                Log.d("MainActivity", "Voice command received: $command")
                when {
                    command.contains("test") || command.contains("hello") -> {
                        speak("Voice recognition is working perfectly! You said: $command")
                        true
                    }
                    command.contains("object") || command.contains("detection") -> {
                        speak("Opening object detection") {
                            startActivity(Intent(this@MainActivity, ObjectDetectionActivity::class.java))
                        }
                        true
                    }
                    command.contains("navigation") || command.contains("navigate") -> {
                        speak("Opening navigation") {
                            startActivity(Intent(this@MainActivity, NavigationActivity::class.java))
                        }
                        true
                    }

                    command.contains("book") || command.contains("reading") || command.contains("text") || command.contains("read") -> {
                        speak("Opening book reading") {
                            startActivity(Intent(this@MainActivity, TextExtractionActivity::class.java))
                        }
                        true
                    }
                    command.contains("currency") || command.contains("money") || command.contains("rupee") || command.contains("cash") -> {
                        speak("Opening currency reader") {
                            startActivity(Intent(this@MainActivity, com.example.vocaleyesnew.currency.CurrencyDetectionActivity::class.java))
                        }
                        true
                    }
                    command.contains("assistant") || command.contains("chat") || command.contains("ai") -> {
                        speak("Opening AI Assistant") {
                            startActivity(Intent(this@MainActivity, ChatActivity::class.java))
                        }
                        true
                    }
                    command.contains("help") || command.contains("options") || command.contains("commands") -> {
                        speak("Available commands are: test, object detection, navigation, book reading, currency reader, and AI assistant. Say go back to return to previous screen, or go home to return to main menu.")
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
    val context = LocalContext.current
    var isFirstLaunch by remember { mutableStateOf(true) }
    var showLogoutDialog by remember { mutableStateOf(false) }
    val isListening by voiceRecognitionManager.isListeningState.collectAsState()
    val authState by authViewModel.authState.collectAsState()

    LaunchedEffect(isFirstLaunch) {
        if (isFirstLaunch) {
            delay(1500) // Wait for TTS and voice recognition to initialize
            // Startup voice message removed as requested
            isFirstLaunch = false
        }
    }

    // Monitor auth state for logout
    LaunchedEffect(authState) {
        if (authState is AuthState.Unauthenticated) {
            // User logged out, redirect to login
            val intent = Intent(context, LoginActivity::class.java)
            intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
            context.startActivity(intent)
        }
    }

    // Simplified voice recognition setup - let VoiceRecognitionManager handle monitoring
    LaunchedEffect(Unit) {
        // Initial delay to let everything settle
        delay(2000)
        voiceRecognitionManager.enablePersistentListening()
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

                    // Logout button with improved accessibility
                    IconButton(
                        onClick = { showLogoutDialog = true },
                        modifier = Modifier.semantics {
                            contentDescription = "Logout button. Double tap to logout from the application."
                            role = Role.Button
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

            FeatureButton(
                text = "Object Detection",
                description = "Object Detection feature. Identifies and describes objects in your camera view. Say 'object detection' or tap to open."
            ) {
                voiceRecognitionManager.speak("Opening object detection") {
                    context.startActivity(Intent(context, ObjectDetectionActivity::class.java))
                }
            }

            FeatureButton(
                text = "Navigation",
                description = "Navigation assistance feature. Provides voice-guided navigation help. Say 'navigation' or tap to open."
            ) {
                voiceRecognitionManager.speak("Opening navigation") {
                    context.startActivity(Intent(context, NavigationActivity::class.java))
                }
            }



            FeatureButton(
                text = "Book Reading",
                description = "Book Reading feature. Extracts and reads text from images. Say 'book reading' or tap to open."
            ) {
                voiceRecognitionManager.speak("Opening book reading") {
                    context.startActivity(Intent(context, TextExtractionActivity::class.java))
                }
            }

            FeatureButton(
                text = "Currency Reader",
                description = "Currency Reader feature. Identifies and announces currency denominations. Say 'currency reader' or tap to open."
            ) {
                voiceRecognitionManager.speak("Opening currency reader") {
                    context.startActivity(Intent(context, com.example.vocaleyesnew.currency.CurrencyDetectionActivity::class.java))
                }
            }

            FeatureButton(
                text = "AI Assistant",
                description = "AI Assistant feature. Chat with an AI assistant for help and information. Say 'AI assistant' or tap to open."
            ) {
                voiceRecognitionManager.speak("Opening AI Assistant") {
                    context.startActivity(Intent(context, ChatActivity::class.java))
                }
            }

            Spacer(modifier = Modifier.height(24.dp))

            Text(
                text = "Say 'Help' for available commands or 'Test' to verify voice recognition",
                style = MaterialTheme.typography.bodyLarge,
                textAlign = TextAlign.Center,
                modifier = Modifier.fillMaxWidth()
            )
        }
    }

    // Logout confirmation dialog
    if (showLogoutDialog) {
        AlertDialog(
            onDismissRequest = { showLogoutDialog = false },
            title = { Text("Logout") },
            text = { Text("Are you sure you want to logout?") },
            confirmButton = {
                TextButton(
                    onClick = {
                        showLogoutDialog = false
                        scope.launch {
                            authViewModel.signOut()
                        }
                    }
                ) {
                    Text("Yes")
                }
            },
            dismissButton = {
                TextButton(
                    onClick = { showLogoutDialog = false }
                ) {
                    Text("Cancel")
                }
            }
        )
    }
}

@Composable
fun FeatureButton(
    text: String,
    description: String,
    onClick: () -> Unit
) {
    val hapticFeedback = LocalHapticFeedback.current

    Button(
        onClick = {
            hapticFeedback.performHapticFeedback(HapticFeedbackType.LongPress)
            onClick()
        },
        modifier = Modifier
            .fillMaxWidth()
            .height(72.dp)
            .semantics {
                contentDescription = description
                role = Role.Button
            }
    ) {
        Text(
            text = text,
            fontSize = 18.sp,
            textAlign = TextAlign.Center
        )
    }
}