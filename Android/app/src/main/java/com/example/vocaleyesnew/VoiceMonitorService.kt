package com.example.vocaleyesnew

import android.app.Service
import android.content.Intent
import android.os.IBinder
import android.util.Log
import kotlinx.coroutines.*

/**
 * Background service to monitor and maintain voice recognition
 * This ensures the microphone stays active even if the main app loses focus
 */
class VoiceMonitorService : Service() {
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main)
    private lateinit var voiceRecognitionManager: VoiceRecognitionManager
    
    override fun onCreate() {
        super.onCreate()
        voiceRecognitionManager = VoiceRecognitionManager.getInstance(this)
        startMonitoring()
        Log.d("VoiceMonitorService", "Voice monitoring service started")
    }
    
    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        return START_STICKY // Restart if killed
    }
    
    override fun onBind(intent: Intent?): IBinder? {
        return null
    }
    
    private fun startMonitoring() {
        scope.launch {
            while (true) {
                try {
                    // Check every 30 seconds - less aggressive monitoring
                    delay(30000)

                    // Only restart if voice recognition is completely inactive
                    if (!voiceRecognitionManager.isCurrentlyListening()) {
                        Log.d("VoiceMonitorService", "Voice recognition inactive for extended period, attempting restart...")
                        voiceRecognitionManager.enablePersistentListening()
                    }
                } catch (e: Exception) {
                    Log.e("VoiceMonitorService", "Error in monitoring: ${e.message}")
                    delay(60000) // Wait much longer on error (1 minute)
                }
            }
        }
    }
    
    override fun onDestroy() {
        super.onDestroy()
        scope.cancel()
        Log.d("VoiceMonitorService", "Voice monitoring service destroyed")
    }
}
