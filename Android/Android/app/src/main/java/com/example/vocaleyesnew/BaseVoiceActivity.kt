package com.example.vocaleyesnew

import android.Manifest
import android.content.pm.PackageManager
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.content.ContextCompat

/**
 * Base activity that provides consistent voice recognition functionality
 * across all activities in the VocalEyes app.
 */
abstract class BaseVoiceActivity : ComponentActivity() {
    protected lateinit var voiceRecognitionManager: VoiceRecognitionManager
    
    private val permissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { isGranted ->
        if (isGranted) {
            onAudioPermissionGranted()
        } else {
            onAudioPermissionDenied()
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        voiceRecognitionManager = VoiceRecognitionManager.getInstance(this)
        voiceRecognitionManager.setCurrentActivity(this)
        checkAudioPermission()
    }

    override fun onResume() {
        super.onResume()
        voiceRecognitionManager.setCurrentActivity(this)
        setupActivityVoiceCommands()
        voiceRecognitionManager.enablePersistentListening()
    }

    override fun onPause() {
        super.onPause()
        // Don't disable listening when pausing - keep it active for blind users
    }

    private fun checkAudioPermission() {
        when {
            ContextCompat.checkSelfPermission(
                this,
                Manifest.permission.RECORD_AUDIO
            ) == PackageManager.PERMISSION_GRANTED -> {
                onAudioPermissionGranted()
            }
            else -> {
                permissionLauncher.launch(Manifest.permission.RECORD_AUDIO)
            }
        }
    }

    protected open fun onAudioPermissionGranted() {
        setupActivityVoiceCommands()
    }

    protected open fun onAudioPermissionDenied() {
        voiceRecognitionManager.speak("Audio permission is required for voice navigation. Please grant permission in settings.")
    }

    /**
     * Override this method to set up activity-specific voice commands
     */
    protected abstract fun setupActivityVoiceCommands()

    /**
     * Convenience method to speak text using the voice recognition manager
     */
    protected fun speak(text: String, onComplete: (() -> Unit)? = null) {
        voiceRecognitionManager.speak(text, onComplete)
    }

    /**
     * Check if voice recognition is currently listening
     */
    protected fun isListening(): Boolean {
        return voiceRecognitionManager.isCurrentlyListening()
    }
}
