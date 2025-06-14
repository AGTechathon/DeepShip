package com.example.vocaleyesnew.facerecognition

import android.Manifest
import android.content.pm.PackageManager
import android.os.Bundle
import android.util.Log
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.core.content.ContextCompat
import com.example.vocaleyesnew.VoiceRecognitionManager
import com.example.vocaleyesnew.ui.theme.VocalEyesNewTheme

class FaceRecognitionActivity : ComponentActivity() {
    private lateinit var voiceRecognitionManager: VoiceRecognitionManager
    private lateinit var faceRecognitionManager: FaceRecognitionManager
    
    private val requestPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { isGranted: Boolean ->
        if (isGranted) {
            Log.d("FaceRecognition", "Camera permission granted")
        } else {
            Log.e("FaceRecognition", "Camera permission denied")
            finish()
        }
    }
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        voiceRecognitionManager = VoiceRecognitionManager.getInstance(this)
        voiceRecognitionManager.setCurrentActivity(this)
        faceRecognitionManager = FaceRecognitionManager(this)
        
        setupVoiceCommands()
        
        // Check camera permission
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA) 
            != PackageManager.PERMISSION_GRANTED) {
            requestPermissionLauncher.launch(Manifest.permission.CAMERA)
        }
        
        setContent {
            VocalEyesNewTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    var hasPermission by remember {
                        mutableStateOf(
                            ContextCompat.checkSelfPermission(
                                applicationContext,
                                Manifest.permission.CAMERA
                            ) == PackageManager.PERMISSION_GRANTED
                        )
                    }
                    
                    if (hasPermission) {
                        FaceRecognitionScreen(
                            faceRecognitionManager = faceRecognitionManager,
                            voiceRecognitionManager = voiceRecognitionManager
                        )
                    } else {
                        // Show permission request UI
                        PermissionRequestScreen {
                            requestPermissionLauncher.launch(Manifest.permission.CAMERA)
                            hasPermission = ContextCompat.checkSelfPermission(
                                applicationContext,
                                Manifest.permission.CAMERA
                            ) == PackageManager.PERMISSION_GRANTED
                        }
                    }
                }
            }
        }
    }
    
    private fun setupVoiceCommands() {
        voiceRecognitionManager.setActivitySpecificListener { command ->
            when {
                command.contains("add person") || command.contains("add face") -> {
                    voiceRecognitionManager.speak("Switching to add person mode. Please position the face in the camera and say the person's name.")
                    true
                }
                command.contains("recognize") || command.contains("identify") -> {
                    voiceRecognitionManager.speak("Switching to recognition mode. Point the camera at a face to identify them.")
                    true
                }
                command.contains("capture") || command.contains("save face") -> {
                    voiceRecognitionManager.speak("Capturing face. Please say the person's name.")
                    true
                }
                command.contains("list people") || command.contains("show people") -> {
                    voiceRecognitionManager.speak("Showing list of saved people")
                    true
                }
                else -> false
            }
        }
    }
    
    override fun onResume() {
        super.onResume()
        voiceRecognitionManager.setCurrentActivity(this)
        setupVoiceCommands()
    }
    
    override fun onDestroy() {
        super.onDestroy()
        faceRecognitionManager.cleanup()
    }
}

@Composable
fun PermissionRequestScreen(onRequestPermission: () -> Unit) {
    // Simple permission request UI - you can enhance this
    androidx.compose.foundation.layout.Column(
        modifier = Modifier.fillMaxSize(),
        horizontalAlignment = androidx.compose.ui.Alignment.CenterHorizontally,
        verticalArrangement = androidx.compose.foundation.layout.Arrangement.Center
    ) {
        androidx.compose.material3.Text(
            text = "Camera permission is required for face recognition",
            style = MaterialTheme.typography.headlineSmall
        )
        androidx.compose.foundation.layout.Spacer(modifier = Modifier.height(16.dp))
        androidx.compose.material3.Button(
            onClick = onRequestPermission
        ) {
            androidx.compose.material3.Text("Grant Permission")
        }
    }
}
