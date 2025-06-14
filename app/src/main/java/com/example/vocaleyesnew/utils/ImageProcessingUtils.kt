package com.example.vocaleyesnew.utils

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Matrix
import android.util.Log
import androidx.camera.core.ImageProxy
import java.nio.ByteBuffer

object ImageProcessingUtils {
    
    /**
     * Convert ImageProxy to Bitmap with proper rotation handling
     */
    fun ImageProxy.toBitmap(): Bitmap? {
        return try {
            when (format) {
                android.graphics.ImageFormat.YUV_420_888 -> {
                    // Handle YUV format (most common for camera)
                    convertYuv420ToBitmap()
                }
                android.graphics.ImageFormat.JPEG -> {
                    // Handle JPEG format
                    val buffer = planes[0].buffer
                    val bytes = ByteArray(buffer.remaining())
                    buffer.get(bytes)
                    val bitmap = BitmapFactory.decodeByteArray(bytes, 0, bytes.size)
                    rotateBitmap(bitmap, imageInfo.rotationDegrees)
                }
                else -> {
                    Log.w("ImageProcessing", "Unsupported image format: $format")
                    null
                }
            }
        } catch (e: Exception) {
            Log.e("ImageProcessing", "Error converting ImageProxy to Bitmap", e)
            null
        }
    }
    
    /**
     * Convert YUV_420_888 format to Bitmap
     */
    private fun ImageProxy.convertYuv420ToBitmap(): Bitmap? {
        return try {
            val yBuffer = planes[0].buffer // Y
            val uBuffer = planes[1].buffer // U
            val vBuffer = planes[2].buffer // V
            
            val ySize = yBuffer.remaining()
            val uSize = uBuffer.remaining()
            val vSize = vBuffer.remaining()
            
            val nv21 = ByteArray(ySize + uSize + vSize)
            
            // Copy Y plane
            yBuffer.get(nv21, 0, ySize)
            
            // Copy UV planes
            val uvPixelStride = planes[1].pixelStride
            if (uvPixelStride == 1) {
                uBuffer.get(nv21, ySize, uSize)
                vBuffer.get(nv21, ySize + uSize, vSize)
            } else {
                // Handle interleaved UV
                val uvBuffer = ByteArray(uSize + vSize)
                uBuffer.get(uvBuffer, 0, uSize)
                vBuffer.get(uvBuffer, uSize, vSize)
                
                var uvIndex = 0
                for (i in ySize until nv21.size step 2) {
                    nv21[i] = uvBuffer[uvIndex]
                    nv21[i + 1] = uvBuffer[uvIndex + 1]
                    uvIndex += 2
                }
            }
            
            // Convert to RGB bitmap
            val yuvImage = android.graphics.YuvImage(
                nv21,
                android.graphics.ImageFormat.NV21,
                width,
                height,
                null
            )
            
            val out = java.io.ByteArrayOutputStream()
            yuvImage.compressToJpeg(
                android.graphics.Rect(0, 0, width, height),
                100,
                out
            )
            
            val imageBytes = out.toByteArray()
            val bitmap = BitmapFactory.decodeByteArray(imageBytes, 0, imageBytes.size)
            
            // Apply rotation
            rotateBitmap(bitmap, imageInfo.rotationDegrees)
            
        } catch (e: Exception) {
            Log.e("ImageProcessing", "Error converting YUV to Bitmap", e)
            null
        }
    }
    
    /**
     * Rotate bitmap based on rotation degrees
     */
    private fun rotateBitmap(bitmap: Bitmap, rotationDegrees: Int): Bitmap {
        return if (rotationDegrees != 0) {
            val matrix = Matrix().apply {
                postRotate(rotationDegrees.toFloat())
            }
            Bitmap.createBitmap(
                bitmap,
                0,
                0,
                bitmap.width,
                bitmap.height,
                matrix,
                true
            ).also {
                if (it != bitmap) {
                    bitmap.recycle()
                }
            }
        } else {
            bitmap
        }
    }
    
    /**
     * Enhance image for better face detection
     */
    fun enhanceImageForFaceDetection(bitmap: Bitmap): Bitmap {
        return try {
            val enhanced = bitmap.copy(Bitmap.Config.ARGB_8888, true)
            
            // Apply histogram equalization for better contrast
            val canvas = android.graphics.Canvas(enhanced)
            val paint = android.graphics.Paint().apply {
                colorFilter = android.graphics.ColorMatrixColorFilter(
                    android.graphics.ColorMatrix().apply {
                        // Enhance contrast and brightness
                        set(floatArrayOf(
                            1.3f, 0f, 0f, 0f, 15f,  // Red
                            0f, 1.3f, 0f, 0f, 15f,  // Green
                            0f, 0f, 1.3f, 0f, 15f,  // Blue
                            0f, 0f, 0f, 1f, 0f      // Alpha
                        ))
                    }
                )
            }
            
            canvas.drawBitmap(enhanced, 0f, 0f, paint)
            enhanced
        } catch (e: Exception) {
            Log.w("ImageProcessing", "Failed to enhance image, using original", e)
            bitmap
        }
    }
    
    /**
     * Validate if bitmap is suitable for face detection
     */
    fun isValidForFaceDetection(bitmap: Bitmap?): Boolean {
        if (bitmap == null) return false
        
        // Check minimum size requirements
        val minSize = 100
        if (bitmap.width < minSize || bitmap.height < minSize) {
            Log.w("ImageProcessing", "Image too small for face detection: ${bitmap.width}x${bitmap.height}")
            return false
        }
        
        // Check if bitmap is recycled
        if (bitmap.isRecycled) {
            Log.w("ImageProcessing", "Bitmap is recycled")
            return false
        }
        
        return true
    }
    
    /**
     * Resize bitmap while maintaining aspect ratio
     */
    fun resizeBitmapForProcessing(bitmap: Bitmap, maxSize: Int = 1024): Bitmap {
        val width = bitmap.width
        val height = bitmap.height
        
        if (width <= maxSize && height <= maxSize) {
            return bitmap
        }
        
        val ratio = minOf(maxSize.toFloat() / width, maxSize.toFloat() / height)
        val newWidth = (width * ratio).toInt()
        val newHeight = (height * ratio).toInt()
        
        return Bitmap.createScaledBitmap(bitmap, newWidth, newHeight, true)
    }
}
