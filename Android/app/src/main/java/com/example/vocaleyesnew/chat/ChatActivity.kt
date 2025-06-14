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
import java.util.*

@OptIn(ExperimentalMaterial3Api::class)
class ChatActivity : ComponentActivity() {
    private val viewModel: ChatViewModel by viewModels()
    private var speechRecognizer: SpeechRecognizer? = null
    private var isListening = false

    private val permissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { isGranted ->
        if (isGranted) {
            startListening()
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        viewModel.initialize(this)
        setupSpeechRecognizer()
        checkPermissionAndStartVoiceRecognition()

        setContent {
            VocalEyesNewTheme {
                ChatScreen(
                    viewModel = viewModel,
                    activity = this,
                    isListening = isListening,
                    onStartListening = { startListening() },
                    onStopListening = { stopListening() }
                )
            }
        }
    }

    private fun setupSpeechRecognizer() {
        if (!SpeechRecognizer.isRecognitionAvailable(this)) {
            Log.e("ChatActivity", "Speech recognition is not available on this device")
            return
        }

        speechRecognizer = SpeechRecognizer.createSpeechRecognizer(this)
        speechRecognizer?.setRecognitionListener(object : RecognitionListener {
            override fun onReadyForSpeech(params: Bundle?) {
                isListening = true
            }

            override fun onResults(results: Bundle?) {
                val matches = results?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
                if (!matches.isNullOrEmpty()) {
                    val text = matches[0]
                    viewModel.sendMessage(text)
                }
                isListening = false
            }

            override fun onError(error: Int) {
                isListening = false
            }

            override fun onBeginningOfSpeech() {}
            override fun onRmsChanged(rmsdB: Float) {}
            override fun onBufferReceived(buffer: ByteArray?) {}
            override fun onEndOfSpeech() {}
            override fun onPartialResults(partialResults: Bundle?) {}
            override fun onEvent(eventType: Int, params: Bundle?) {}
        })
    }

    private fun checkPermissionAndStartVoiceRecognition() {
        when {
            ContextCompat.checkSelfPermission(
                this,
                Manifest.permission.RECORD_AUDIO
            ) == PackageManager.PERMISSION_GRANTED -> {
                startListening()
            }
            else -> {
                permissionLauncher.launch(Manifest.permission.RECORD_AUDIO)
            }
        }
    }

    private fun startListening() {
        if (isListening) return // Avoid starting multiple times
        
        val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
            putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
            putExtra(RecognizerIntent.EXTRA_LANGUAGE, Locale.getDefault())
            putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 1)
            putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, false)
        }
        speechRecognizer?.startListening(intent)
    }

    private fun stopListening() {
        speechRecognizer?.stopListening()
        isListening = false
    }

    override fun onDestroy() {
        super.onDestroy()
        speechRecognizer?.destroy()
        speechRecognizer = null
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ChatScreen(
    viewModel: ChatViewModel,
    activity: ComponentActivity,
    isListening: Boolean,
    onStartListening: () -> Unit,
    onStopListening: () -> Unit
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
        modifier = Modifier
            .fillMaxSize()
            .pointerInput(Unit) {
                detectTapGestures(
                    onDoubleTap = {
                        if (!isListening) {
                            onStartListening()
                        }
                    }
                )
            },
        topBar = {
            TopAppBar(
                title = { Text("AI Assistant (Double-tap to speak)") },
                navigationIcon = {
                    IconButton(onClick = { activity.finish() }) {
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
                    IconButton(
                        onClick = { if (isListening) onStopListening() else onStartListening() },
                        modifier = Modifier.size(56.dp)
                    ) {
                        Icon(
                            imageVector = if (isListening) Icons.Default.Stop else Icons.Default.Mic,
                            contentDescription = if (isListening) "Stop Listening" else "Start Listening",
                            modifier = Modifier.size(32.dp)
                        )
                    }
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = if (isListening) "Listening..." else "Double-tap screen to speak",
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