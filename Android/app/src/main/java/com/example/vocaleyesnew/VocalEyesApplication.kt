package com.example.vocaleyesnew

import android.app.Application
import androidx.camera.camera2.Camera2Config
import androidx.camera.core.CameraXConfig
import com.example.vocaleyesnew.bluetooth.BluetoothStateManager

class VocalEyesApplication : Application(), CameraXConfig.Provider {

    private lateinit var bluetoothStateManager: BluetoothStateManager

    override fun onCreate() {
        super.onCreate()

        // Initialize Bluetooth state monitoring
        bluetoothStateManager = BluetoothStateManager.getInstance(this)
        bluetoothStateManager.initialize()
    }

    override fun getCameraXConfig(): CameraXConfig {
        return CameraXConfig.Builder.fromConfig(Camera2Config.defaultConfig())
            .build()
    }

    override fun onTerminate() {
        super.onTerminate()
        // Clean up Bluetooth monitoring
        if (::bluetoothStateManager.isInitialized) {
            bluetoothStateManager.cleanup()
        }
    }
}