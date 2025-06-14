package com.example.vocaleyesnew.facerecognition

import android.content.Context
import android.graphics.Bitmap
import android.graphics.PointF
import android.graphics.Rect
import android.util.Log
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.face.Face
import com.google.mlkit.vision.face.FaceDetection
import com.google.mlkit.vision.face.FaceDetector
import com.google.mlkit.vision.face.FaceDetectorOptions
import com.google.mlkit.vision.face.FaceLandmark
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.coroutines.flow.first
import org.json.JSONArray
import org.json.JSONObject
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException
import kotlin.math.pow
import kotlin.math.sqrt
import com.example.vocaleyesnew.firestore.FirestoreRepository

class FaceRecognitionManager(private val context: Context) {
    private val faceDao = FaceDatabase.getDatabase(context).faceDao()
    private val firestoreRepository = FirestoreRepository(context)
    
    private val detector: FaceDetector by lazy {
        val options = FaceDetectorOptions.Builder()
            .setPerformanceMode(FaceDetectorOptions.PERFORMANCE_MODE_ACCURATE)
            .setLandmarkMode(FaceDetectorOptions.LANDMARK_MODE_ALL)
            .setClassificationMode(FaceDetectorOptions.CLASSIFICATION_MODE_ALL)
            .setMinFaceSize(0.15f)
            .enableTracking()
            .build()
        FaceDetection.getClient(options)
    }
    
    data class FaceDetectionResult(
        val faces: List<Face>,
        val bitmap: Bitmap
    )
    
    data class FaceRecognitionResult(
        val personName: String?,
        val confidence: Float,
        val boundingBox: Rect,
        val isNewFace: Boolean = false
    )
    
    suspend fun detectFaces(bitmap: Bitmap): FaceDetectionResult = suspendCancellableCoroutine { continuation ->
        val image = InputImage.fromBitmap(bitmap, 0)
        
        detector.process(image)
            .addOnSuccessListener { faces ->
                continuation.resume(FaceDetectionResult(faces, bitmap))
            }
            .addOnFailureListener { e ->
                Log.e("FaceRecognition", "Face detection failed", e)
                continuation.resumeWithException(e)
            }
    }
    
    suspend fun saveFace(face: Face, bitmap: Bitmap, personName: String): Boolean {
        return withContext(Dispatchers.IO) {
            try {
                Log.d("FaceRecognition", "Starting to save face for person: $personName")

                val faceEmbedding = extractFaceFeatures(face)
                Log.d("FaceRecognition", "Extracted face features: ${faceEmbedding.length} characters")

                val faceEntity = FaceEntity(
                    personName = personName.trim(),
                    faceEmbedding = faceEmbedding,
                    confidence = 1.0f // High confidence for manually added faces
                )

                val insertedId = faceDao.insertFace(faceEntity)
                Log.d("FaceRecognition", "Face saved with ID: $insertedId for person: $personName")

                // Also save to Firestore
                val firestoreResult = firestoreRepository.saveRegisteredFace(
                    personName = personName.trim(),
                    faceEmbedding = faceEmbedding,
                    confidence = 1.0f
                )

                if (firestoreResult.isSuccess) {
                    Log.d("FaceRecognition", "Face also saved to Firestore for person: $personName")
                } else {
                    Log.w("FaceRecognition", "Failed to save face to Firestore: ${firestoreResult.exceptionOrNull()?.message}")
                }

                // Verify the face was saved by checking count
                val totalFaces = faceDao.getFaceCount()
                Log.d("FaceRecognition", "Total faces in database: $totalFaces")

                true
            } catch (e: Exception) {
                Log.e("FaceRecognition", "Failed to save face for $personName", e)
                false
            }
        }
    }
    
    suspend fun recognizeFace(face: Face, context: String = "face_recognition"): FaceRecognitionResult? {
        return withContext(Dispatchers.IO) {
            try {
                val currentFeatures = extractFaceFeatures(face)
                Log.d("FaceRecognition", "Extracted features for recognition: ${currentFeatures.length} chars")

                // Get all stored faces from database
                val storedFaces = getAllStoredFaces()
                Log.d("FaceRecognition", "Found ${storedFaces.size} stored faces in database")

                var bestMatch: FaceEntity? = null
                var bestSimilarity = 0.0f
                val threshold = 0.6f // Lower threshold for better matching

                // Compare current face with all stored faces
                storedFaces.forEach { storedFace ->
                    val similarity = calculateSimilarity(currentFeatures, storedFace.faceEmbedding)
                    Log.d("FaceRecognition", "Similarity with ${storedFace.personName}: $similarity")

                    if (similarity > bestSimilarity) {
                        bestSimilarity = similarity
                        bestMatch = storedFace
                    }
                }

                val boundingBox = face.boundingBox

                val result = if (bestMatch != null && bestSimilarity > threshold) {
                    Log.d("FaceRecognition", "Match found: ${bestMatch!!.personName} with confidence $bestSimilarity")
                    FaceRecognitionResult(
                        personName = bestMatch!!.personName,
                        confidence = bestSimilarity,
                        boundingBox = boundingBox
                    )
                } else {
                    Log.d("FaceRecognition", "No match found. Best similarity: $bestSimilarity")
                    FaceRecognitionResult(
                        personName = null,
                        confidence = bestSimilarity,
                        boundingBox = boundingBox,
                        isNewFace = true
                    )
                }

                // Log the recognition event to Firestore
                logRecognitionEvent(result, context)

                result
            } catch (e: Exception) {
                Log.e("FaceRecognition", "Face recognition failed", e)
                null
            }
        }
    }

    private suspend fun getAllStoredFaces(): List<FaceEntity> {
        return try {
            // Convert Flow to List by collecting first emission
            faceDao.getAllFaces().first()
        } catch (e: Exception) {
            Log.e("FaceRecognition", "Error getting stored faces", e)
            emptyList()
        }
    }
    
    private fun extractFaceFeatures(face: Face): String {
        val features = JSONObject()
        
        // Add bounding box
        val boundingBox = JSONObject().apply {
            put("left", face.boundingBox.left)
            put("top", face.boundingBox.top)
            put("right", face.boundingBox.right)
            put("bottom", face.boundingBox.bottom)
        }
        features.put("boundingBox", boundingBox)
        
        // Add landmarks
        val landmarks = JSONArray()
        face.allLandmarks.forEach { landmark ->
            val landmarkObj = JSONObject().apply {
                put("type", landmark.landmarkType)
                put("x", landmark.position.x)
                put("y", landmark.position.y)
            }
            landmarks.put(landmarkObj)
        }
        features.put("landmarks", landmarks)
        
        // Add head pose
        val headPose = JSONObject().apply {
            put("rotX", face.headEulerAngleX)
            put("rotY", face.headEulerAngleY)
            put("rotZ", face.headEulerAngleZ)
        }
        features.put("headPose", headPose)
        
        // Add smile probability
        face.smilingProbability?.let {
            features.put("smilingProbability", it)
        }
        
        // Add eye open probabilities
        face.leftEyeOpenProbability?.let {
            features.put("leftEyeOpenProbability", it)
        }
        face.rightEyeOpenProbability?.let {
            features.put("rightEyeOpenProbability", it)
        }
        
        return features.toString()
    }
    
    private fun calculateSimilarity(features1: String, features2: String): Float {
        try {
            val json1 = JSONObject(features1)
            val json2 = JSONObject(features2)

            var totalSimilarity = 0.0f
            var componentCount = 0

            // Compare landmarks if available
            val landmarks1 = json1.optJSONArray("landmarks")
            val landmarks2 = json2.optJSONArray("landmarks")

            if (landmarks1 != null && landmarks2 != null && landmarks1.length() > 0 && landmarks2.length() > 0) {
                val landmarkSimilarity = compareLandmarks(landmarks1, landmarks2)
                totalSimilarity += landmarkSimilarity * 0.7f // 70% weight for landmarks
                componentCount++
                Log.d("FaceRecognition", "Landmark similarity: $landmarkSimilarity")
            }

            // Compare bounding box proportions
            val bbox1 = json1.optJSONObject("boundingBox")
            val bbox2 = json2.optJSONObject("boundingBox")

            if (bbox1 != null && bbox2 != null) {
                val bboxSimilarity = compareBoundingBoxes(bbox1, bbox2)
                totalSimilarity += bboxSimilarity * 0.2f // 20% weight for bounding box
                componentCount++
                Log.d("FaceRecognition", "Bounding box similarity: $bboxSimilarity")
            }

            // Compare head pose
            val pose1 = json1.optJSONObject("headPose")
            val pose2 = json2.optJSONObject("headPose")

            if (pose1 != null && pose2 != null) {
                val poseSimilarity = compareHeadPose(pose1, pose2)
                totalSimilarity += poseSimilarity * 0.1f // 10% weight for head pose
                componentCount++
                Log.d("FaceRecognition", "Head pose similarity: $poseSimilarity")
            }

            val finalSimilarity = if (componentCount > 0) totalSimilarity / componentCount else 0.0f
            Log.d("FaceRecognition", "Final similarity: $finalSimilarity (components: $componentCount)")

            return finalSimilarity.coerceIn(0.0f, 1.0f)

        } catch (e: Exception) {
            Log.e("FaceRecognition", "Error calculating similarity", e)
            return 0.0f
        }
    }

    private fun compareLandmarks(landmarks1: JSONArray, landmarks2: JSONArray): Float {
        try {
            // Create maps for easier lookup
            val map1 = mutableMapOf<Int, Pair<Double, Double>>()
            val map2 = mutableMapOf<Int, Pair<Double, Double>>()

            for (i in 0 until landmarks1.length()) {
                val landmark = landmarks1.getJSONObject(i)
                val type = landmark.getInt("type")
                val x = landmark.getDouble("x")
                val y = landmark.getDouble("y")
                map1[type] = Pair(x, y)
            }

            for (i in 0 until landmarks2.length()) {
                val landmark = landmarks2.getJSONObject(i)
                val type = landmark.getInt("type")
                val x = landmark.getDouble("x")
                val y = landmark.getDouble("y")
                map2[type] = Pair(x, y)
            }

            // Compare common landmarks
            var totalDistance = 0.0
            var count = 0

            for ((type, pos1) in map1) {
                map2[type]?.let { pos2 ->
                    val dx = pos1.first - pos2.first
                    val dy = pos1.second - pos2.second
                    val distance = sqrt(dx.pow(2) + dy.pow(2))
                    totalDistance += distance
                    count++
                }
            }

            if (count > 0) {
                val avgDistance = totalDistance / count
                // Convert distance to similarity with adjusted scaling
                return (1.0f / (1.0f + avgDistance.toFloat() / 50.0f)).coerceIn(0.0f, 1.0f)
            }

            return 0.0f
        } catch (e: Exception) {
            Log.e("FaceRecognition", "Error comparing landmarks", e)
            return 0.0f
        }
    }

    private fun compareBoundingBoxes(bbox1: JSONObject, bbox2: JSONObject): Float {
        try {
            val width1 = bbox1.getInt("right") - bbox1.getInt("left")
            val height1 = bbox1.getInt("bottom") - bbox1.getInt("top")
            val width2 = bbox2.getInt("right") - bbox2.getInt("left")
            val height2 = bbox2.getInt("bottom") - bbox2.getInt("top")

            val ratio1 = width1.toFloat() / height1.toFloat()
            val ratio2 = width2.toFloat() / height2.toFloat()

            val ratioDiff = kotlin.math.abs(ratio1 - ratio2)
            return (1.0f - ratioDiff).coerceIn(0.0f, 1.0f)
        } catch (e: Exception) {
            return 0.5f // Neutral similarity if comparison fails
        }
    }

    private fun compareHeadPose(pose1: JSONObject, pose2: JSONObject): Float {
        try {
            val rotX1 = pose1.getDouble("rotX")
            val rotY1 = pose1.getDouble("rotY")
            val rotZ1 = pose1.getDouble("rotZ")

            val rotX2 = pose2.getDouble("rotX")
            val rotY2 = pose2.getDouble("rotY")
            val rotZ2 = pose2.getDouble("rotZ")

            val diffX = kotlin.math.abs(rotX1 - rotX2)
            val diffY = kotlin.math.abs(rotY1 - rotY2)
            val diffZ = kotlin.math.abs(rotZ1 - rotZ2)

            val avgDiff = (diffX + diffY + diffZ) / 3.0
            return (1.0f - (avgDiff / 180.0).toFloat()).coerceIn(0.0f, 1.0f)
        } catch (e: Exception) {
            return 0.5f // Neutral similarity if comparison fails
        }
    }
    
    suspend fun getAllPersonNames(): List<String> {
        return withContext(Dispatchers.IO) {
            faceDao.getAllPersonNames()
        }
    }
    
    suspend fun deletePerson(personName: String) {
        withContext(Dispatchers.IO) {
            faceDao.deleteFacesByName(personName)
        }
    }
    
    /**
     * Log face recognition event to Firestore
     */
    private suspend fun logRecognitionEvent(result: FaceRecognitionResult, context: String) {
        try {
            firestoreRepository.logFaceRecognitionEvent(
                recognizedPersonName = result.personName,
                confidence = result.confidence,
                isNewFace = result.isNewFace,
                detectionContext = context
            )
        } catch (e: Exception) {
            Log.w("FaceRecognition", "Failed to log recognition event: ${e.message}")
        }
    }

    /**
     * Get all registered faces from Firestore
     */
    suspend fun getRegisteredFacesFromFirestore(): List<com.example.vocaleyesnew.firestore.RegisteredFace> {
        return try {
            val result = firestoreRepository.getRegisteredFaces()
            if (result.isSuccess) {
                result.getOrNull() ?: emptyList()
            } else {
                Log.e("FaceRecognition", "Failed to get faces from Firestore: ${result.exceptionOrNull()?.message}")
                emptyList()
            }
        } catch (e: Exception) {
            Log.e("FaceRecognition", "Error getting faces from Firestore", e)
            emptyList()
        }
    }

    fun cleanup() {
        // Cleanup resources if needed
    }
}
