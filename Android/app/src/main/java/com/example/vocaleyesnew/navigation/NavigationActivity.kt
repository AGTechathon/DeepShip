package com.example.vocaleyesnew.navigation

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.ui.Modifier
import com.example.vocaleyesnew.ui.theme.VocalEyesNewTheme
import com.example.vocaleyesnew.VoiceRecognitionManager


class NavigationActivity : ComponentActivity() {
    private lateinit var voiceRecognitionManager: VoiceRecognitionManager

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        voiceRecognitionManager = VoiceRecognitionManager.getInstance(this)
        voiceRecognitionManager.setCurrentActivity(this)
        setupVoiceCommands()

        setContent {
            VocalEyesNewTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    BlindModeScreen(
                        voiceRecognitionManager = voiceRecognitionManager
                    )
                }
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
                command.contains("describe") || command.contains("what do you see") -> {
                    voiceRecognitionManager.speak("Analyzing scene for navigation assistance")
                    true
                }
                command.contains("where am i") || command.contains("location") -> {
                    voiceRecognitionManager.speak("Providing location information")
                    true
                }
                else -> false
            }
        }

        voiceRecognitionManager.speak("Navigation mode ready. I will continuously describe your surroundings to help you navigate. Say go back to return.")
    }
}