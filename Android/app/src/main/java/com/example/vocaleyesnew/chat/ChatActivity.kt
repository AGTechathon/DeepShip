package com.example.vocaleyesnew.chat

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Bundle
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import android.util.Log
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.activity.viewModels
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Mic
import androidx.compose.material.icons.filled.Stop
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.core.content.ContextCompat
import com.example.vocaleyesnew.ui.theme.VocalEyesNewTheme
import com.example.vocaleyesnew.VoiceRecognitionManager
import java.util.*

@OptIn(ExperimentalMaterial3Api::class)
class ChatActivity : ComponentActivity() {
    private val viewModel: ChatViewModel by viewModels()
    private lateinit var voiceRecognitionManager: VoiceRecognitionManager

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        viewModel.initialize(this)
        voiceRecognitionManager = VoiceRecognitionManager.getInstance(this)
        voiceRecognitionManager.setCurrentActivity(this)
        setupVoiceCommands()

        setContent {
            VocalEyesNewTheme {
                val isListening by voiceRecognitionManager.isListeningState.collectAsState()
                ChatScreen(
                    viewModel = viewModel,
                    activity = this,
                    isListening = isListening,
                    voiceRecognitionManager = voiceRecognitionManager
                )
            }
        }
    }

    override fun onResume() {
        super.onResume()
        voiceRecognitionManager.setCurrentActivity(this)
        setupVoiceCommands()
    }

    private fun setupVoiceCommands() {
        voiceRecognitionManager.setActivitySpecificListener { command ->
            when {
                command.contains("send message") || command.contains("send") -> {
                    voiceRecognitionManager.speak("Please speak your message")
                    true
                }
                command.contains("clear chat") || command.contains("clear") -> {
                    viewModel.clearConversation()
                    true
                }
                command.contains("repeat last") || command.contains("repeat") -> {
                    val messages = viewModel.messages.value
                    if (messages.isNotEmpty()) {
                        val lastMessage = messages.last()
                        voiceRecognitionManager.speak(lastMessage.content)
                    } else {
                        voiceRecognitionManager.speak("No messages to repeat")
                    }
                    true
                }
                else -> {
                    // Treat any unrecognized command as a message to send
                    viewModel.sendMessage(command)
                    true
                }
            }
        }

        voiceRecognitionManager.speak("AI Assistant ready. Speak your message or say help for commands.")
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ChatScreen(
    viewModel: ChatViewModel,
    activity: ComponentActivity,
    isListening: Boolean,
    voiceRecognitionManager: VoiceRecognitionManager
) {
    val messages by viewModel.messages.collectAsState()
    val isProcessing by viewModel.isProcessing.collectAsState()
    val listState = rememberLazyListState()

    LaunchedEffect(messages.size) {
        if (messages.isNotEmpty()) {
            listState.animateScrollToItem(0)
        }
    }

    Scaffold(
        modifier = Modifier.fillMaxSize(),
        topBar = {
            TopAppBar(
                title = { Text("AI Assistant (Always listening)") },
                navigationIcon = {
                    IconButton(onClick = {
                        voiceRecognitionManager.speak("Going back") {
                            activity.finish()
                        }
                    }) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                }
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
        ) {
            LazyColumn(
                modifier = Modifier
                    .weight(1f)
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp),
                state = listState,
                reverseLayout = true
            ) {
                items(messages.reversed()) { message ->
                    ChatMessage(message)
                }
            }

            if (isProcessing) {
                LinearProgressIndicator(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp)
                )
            }

            Surface(
                modifier = Modifier.fillMaxWidth(),
                tonalElevation = 8.dp
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    horizontalArrangement = Arrangement.Center,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        imageVector = if (isListening) Icons.Default.Mic else Icons.Default.Stop,
                        contentDescription = if (isListening) "Listening" else "Not Listening",
                        modifier = Modifier.size(32.dp),
                        tint = if (isListening) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = if (isListening) "Listening... Speak your message" else "Voice recognition paused",
                        style = MaterialTheme.typography.bodyMedium
                    )
                }
            }
        }
    }
}

@Composable
fun ChatMessage(message: ChatMessage) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp),
        horizontalAlignment = if (message.isUser) Alignment.End else Alignment.Start
    ) {
        Surface(
            color = if (message.isUser) MaterialTheme.colorScheme.primaryContainer
            else MaterialTheme.colorScheme.secondaryContainer,
            shape = MaterialTheme.shapes.medium,
            modifier = Modifier.widthIn(max = 300.dp)
        ) {
            Text(
                text = message.content,
                modifier = Modifier.padding(12.dp),
                color = if (message.isUser) MaterialTheme.colorScheme.onPrimaryContainer
                else MaterialTheme.colorScheme.onSecondaryContainer,
                textAlign = if (message.isUser) TextAlign.End else TextAlign.Start
            )
        }
    }
}

data class ChatMessage(
    val content: String,
    val isUser: Boolean
) 