package com.example.vocaleyesnew.bluetooth

import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.PackageManager
import android.os.Build
import android.util.Log
import androidx.core.content.ContextCompat
import com.example.vocaleyesnew.firestore.FirestoreRepository
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

/**
 * Manages Bluetooth state monitoring and synchronization with Firebase Firestore
 * Tracks when Bluetooth is enabled/disabled and updates the user's document in Firestore
 */
class BluetoothStateManager private constructor(private val context: Context) {
    
    private val bluetoothManager = context.getSystemService(Context.BLUETOOTH_SERVICE) as? BluetoothManager
    private val bluetoothAdapter = bluetoothManager?.adapter
    private val firestoreRepository = FirestoreRepository(context)
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main)
    
    // State flow for Bluetooth status
    private val _bluetoothState = MutableStateFlow(false)
    val bluetoothState: StateFlow<Boolean> = _bluetoothState.asStateFlow()
    
    private var isReceiverRegistered = false
    
    companion object {
        private const val TAG = "BluetoothStateManager"
        
        @Volatile
        private var INSTANCE: BluetoothStateManager? = null
        
        fun getInstance(context: Context): BluetoothStateManager {
            return INSTANCE ?: synchronized(this) {
                INSTANCE ?: BluetoothStateManager(context.applicationContext).also { INSTANCE = it }
            }
        }
    }
    
    /**
     * Broadcast receiver to listen for Bluetooth state changes
     */
    private val bluetoothStateReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
            when (intent?.action) {
                BluetoothAdapter.ACTION_STATE_CHANGED -> {
                    val state = intent.getIntExtra(
                        BluetoothAdapter.EXTRA_STATE,
                        BluetoothAdapter.ERROR
                    )
                    
                    when (state) {
                        BluetoothAdapter.STATE_ON -> {
                            Log.d(TAG, "Bluetooth enabled")
                            updateBluetoothState(true)
                        }
                        BluetoothAdapter.STATE_OFF -> {
                            Log.d(TAG, "Bluetooth disabled")
                            updateBluetoothState(false)
                        }
                        BluetoothAdapter.STATE_TURNING_ON -> {
                            Log.d(TAG, "Bluetooth turning on...")
                        }
                        BluetoothAdapter.STATE_TURNING_OFF -> {
                            Log.d(TAG, "Bluetooth turning off...")
                        }
                    }
                }
            }
        }
    }
    
    /**
     * Initialize Bluetooth state monitoring
     */
    fun initialize() {
        if (!hasBluetoothSupport()) {
            Log.w(TAG, "Device does not support Bluetooth")
            return
        }
        
        // Check initial Bluetooth state
        val initialState = getCurrentBluetoothState()
        _bluetoothState.value = initialState
        
        // Update Firestore with initial state
        updateFirestoreBluetoothState(initialState)
        
        // Register broadcast receiver
        registerBluetoothReceiver()
        
        Log.d(TAG, "BluetoothStateManager initialized. Initial state: $initialState")
    }
    
    /**
     * Check if device supports Bluetooth
     */
    private fun hasBluetoothSupport(): Boolean {
        return context.packageManager.hasSystemFeature(PackageManager.FEATURE_BLUETOOTH)
    }
    
    /**
     * Get current Bluetooth state
     */
    private fun getCurrentBluetoothState(): Boolean {
        return try {
            if (hasBluetoothPermissions()) {
                bluetoothAdapter?.isEnabled == true
            } else {
                Log.w(TAG, "Missing Bluetooth permissions")
                false
            }
        } catch (e: SecurityException) {
            Log.e(TAG, "Security exception when checking Bluetooth state", e)
            false
        } catch (e: Exception) {
            Log.e(TAG, "Error checking Bluetooth state", e)
            false
        }
    }
    
    /**
     * Check if app has required Bluetooth permissions
     */
    private fun hasBluetoothPermissions(): Boolean {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            // Android 12+ requires BLUETOOTH_CONNECT permission
            ContextCompat.checkSelfPermission(
                context,
                android.Manifest.permission.BLUETOOTH_CONNECT
            ) == PackageManager.PERMISSION_GRANTED
        } else {
            // Pre-Android 12 requires BLUETOOTH permission
            ContextCompat.checkSelfPermission(
                context,
                android.Manifest.permission.BLUETOOTH
            ) == PackageManager.PERMISSION_GRANTED
        }
    }
    
    /**
     * Register broadcast receiver for Bluetooth state changes
     */
    private fun registerBluetoothReceiver() {
        if (!isReceiverRegistered) {
            try {
                val filter = IntentFilter(BluetoothAdapter.ACTION_STATE_CHANGED)
                context.registerReceiver(bluetoothStateReceiver, filter)
                isReceiverRegistered = true
                Log.d(TAG, "Bluetooth state receiver registered")
            } catch (e: Exception) {
                Log.e(TAG, "Failed to register Bluetooth receiver", e)
            }
        }
    }
    
    /**
     * Unregister broadcast receiver
     */
    private fun unregisterBluetoothReceiver() {
        if (isReceiverRegistered) {
            try {
                context.unregisterReceiver(bluetoothStateReceiver)
                isReceiverRegistered = false
                Log.d(TAG, "Bluetooth state receiver unregistered")
            } catch (e: Exception) {
                Log.e(TAG, "Failed to unregister Bluetooth receiver", e)
            }
        }
    }
    
    /**
     * Update local Bluetooth state and sync with Firestore
     */
    private fun updateBluetoothState(enabled: Boolean) {
        _bluetoothState.value = enabled
        updateFirestoreBluetoothState(enabled)
        Log.d(TAG, "Bluetooth state updated: $enabled")
    }
    
    /**
     * Update Bluetooth state in Firestore
     */
    private fun updateFirestoreBluetoothState(enabled: Boolean) {
        scope.launch {
            try {
                val result = firestoreRepository.updateBluetoothState(enabled)
                if (result.isSuccess) {
                    Log.d(TAG, "Successfully updated Bluetooth state in Firestore: $enabled")
                } else {
                    Log.e(TAG, "Failed to update Bluetooth state in Firestore: ${result.exceptionOrNull()?.message}")
                }
            } catch (e: Exception) {
                Log.e(TAG, "Exception updating Bluetooth state in Firestore", e)
            }
        }
    }
    
    /**
     * Get current Bluetooth state
     */
    fun isBluetoothEnabled(): Boolean {
        return _bluetoothState.value
    }
    
    /**
     * Manually refresh Bluetooth state
     */
    fun refreshBluetoothState() {
        val currentState = getCurrentBluetoothState()
        if (currentState != _bluetoothState.value) {
            updateBluetoothState(currentState)
        }
    }
    
    /**
     * Clean up resources
     */
    fun cleanup() {
        unregisterBluetoothReceiver()
        Log.d(TAG, "BluetoothStateManager cleaned up")
    }
}
