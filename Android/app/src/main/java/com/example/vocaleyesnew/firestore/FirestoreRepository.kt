package com.example.vocaleyesnew.firestore

import android.content.Context
import android.os.Build
import android.util.Log
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.Query
import com.google.firebase.Timestamp
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.tasks.await
import java.util.UUID

class FirestoreRepository(private val context: Context) {
    private val firestore = FirebaseFirestore.getInstance()
    private val auth = FirebaseAuth.getInstance()
    
    companion object {
        private const val TAG = "FirestoreRepository"
        private const val USERS_COLLECTION = "users"
        private const val REGISTERED_FACES_COLLECTION = "RegisteredFaces"
        private const val FACE_RECOGNITION_EVENTS_COLLECTION = "FaceRecognitionEvents"
    }

    /**
     * Get current user ID
     */
    private fun getCurrentUserId(): String? = auth.currentUser?.uid

    /**
     * Create or update user document when user signs in
     */
    suspend fun createOrUpdateUser(): Result<UserDocument> {
        return try {
            val currentUser = auth.currentUser
            if (currentUser == null) {
                return Result.failure(Exception("No authenticated user"))
            }

            val userDocument = UserDocument(
                uid = currentUser.uid,
                email = currentUser.email ?: "",
                displayName = currentUser.displayName ?: "",
                photoURL = currentUser.photoUrl?.toString(),
                createdAt = Timestamp.now(),
                lastLoginAt = Timestamp.now(),
                preferences = UserPreferences()
            )

            firestore.collection(USERS_COLLECTION)
                .document(currentUser.uid)
                .set(userDocument)
                .await()

            Log.d(TAG, "User document created/updated for: ${currentUser.email}")
            Result.success(userDocument)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to create/update user document", e)
            Result.failure(e)
        }
    }

    /**
     * Save a registered face to Firestore
     */
    suspend fun saveRegisteredFace(
        personName: String,
        faceEmbedding: String,
        confidence: Float,
        imagePath: String? = null
    ): Result<RegisteredFace> {
        return try {
            val userId = getCurrentUserId()
            if (userId == null) {
                return Result.failure(Exception("No authenticated user"))
            }

            val faceId = UUID.randomUUID().toString()
            val registeredFace = RegisteredFace(
                faceId = faceId,
                personName = personName.trim(),
                faceEmbedding = faceEmbedding,
                confidence = confidence,
                imagePath = imagePath,
                dateAdded = Timestamp.now(),
                isActive = true,
                metadata = FaceMetadata(
                    detectionMethod = "mlkit",
                    deviceInfo = "${Build.MANUFACTURER} ${Build.MODEL}",
                    appVersion = getAppVersion(),
                    qualityScore = confidence
                )
            )

            firestore.collection(USERS_COLLECTION)
                .document(userId)
                .collection(REGISTERED_FACES_COLLECTION)
                .document(faceId)
                .set(registeredFace)
                .await()

            Log.d(TAG, "Registered face saved for person: $personName with ID: $faceId")
            Result.success(registeredFace)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to save registered face for $personName", e)
            Result.failure(e)
        }
    }

    /**
     * Get all registered faces for current user
     */
    suspend fun getRegisteredFaces(): Result<List<RegisteredFace>> {
        return try {
            val userId = getCurrentUserId()
            if (userId == null) {
                return Result.failure(Exception("No authenticated user"))
            }

            val snapshot = firestore.collection(USERS_COLLECTION)
                .document(userId)
                .collection(REGISTERED_FACES_COLLECTION)
                .whereEqualTo("isActive", true)
                .orderBy("dateAdded", Query.Direction.DESCENDING)
                .get()
                .await()

            val faces = snapshot.documents.mapNotNull { doc ->
                doc.toObject(RegisteredFace::class.java)
            }

            Log.d(TAG, "Retrieved ${faces.size} registered faces")
            Result.success(faces)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to get registered faces", e)
            Result.failure(e)
        }
    }

    /**
     * Log a face recognition event
     */
    suspend fun logFaceRecognitionEvent(
        recognizedPersonName: String?,
        confidence: Float,
        isNewFace: Boolean,
        detectionContext: String
    ): Result<FaceRecognitionEvent> {
        return try {
            val userId = getCurrentUserId()
            if (userId == null) {
                return Result.failure(Exception("No authenticated user"))
            }

            val eventId = UUID.randomUUID().toString()
            val event = FaceRecognitionEvent(
                eventId = eventId,
                recognizedPersonName = recognizedPersonName,
                confidence = confidence,
                isNewFace = isNewFace,
                detectionContext = detectionContext,
                timestamp = Timestamp.now(),
                deviceInfo = "${Build.MANUFACTURER} ${Build.MODEL}"
            )

            firestore.collection(USERS_COLLECTION)
                .document(userId)
                .collection(FACE_RECOGNITION_EVENTS_COLLECTION)
                .document(eventId)
                .set(event)
                .await()

            Log.d(TAG, "Face recognition event logged: $recognizedPersonName in $detectionContext")
            Result.success(event)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to log face recognition event", e)
            Result.failure(e)
        }
    }

    /**
     * Get face recognition events for current user
     */
    suspend fun getFaceRecognitionEvents(limit: Int = 50): Result<List<FaceRecognitionEvent>> {
        return try {
            val userId = getCurrentUserId()
            if (userId == null) {
                return Result.failure(Exception("No authenticated user"))
            }

            val snapshot = firestore.collection(USERS_COLLECTION)
                .document(userId)
                .collection(FACE_RECOGNITION_EVENTS_COLLECTION)
                .orderBy("timestamp", Query.Direction.DESCENDING)
                .limit(limit.toLong())
                .get()
                .await()

            val events = snapshot.documents.mapNotNull { doc ->
                doc.toObject(FaceRecognitionEvent::class.java)
            }

            Log.d(TAG, "Retrieved ${events.size} face recognition events")
            Result.success(events)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to get face recognition events", e)
            Result.failure(e)
        }
    }

    /**
     * Delete a registered face
     */
    suspend fun deleteRegisteredFace(faceId: String): Result<Unit> {
        return try {
            val userId = getCurrentUserId()
            if (userId == null) {
                return Result.failure(Exception("No authenticated user"))
            }

            firestore.collection(USERS_COLLECTION)
                .document(userId)
                .collection(REGISTERED_FACES_COLLECTION)
                .document(faceId)
                .update("isActive", false)
                .await()

            Log.d(TAG, "Registered face marked as inactive: $faceId")
            Result.success(Unit)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to delete registered face: $faceId", e)
            Result.failure(e)
        }
    }

    /**
     * Get app version
     */
    private fun getAppVersion(): String {
        return try {
            val packageInfo = context.packageManager.getPackageInfo(context.packageName, 0)
            packageInfo.versionName ?: "unknown"
        } catch (e: Exception) {
            "unknown"
        }
    }

    /**
     * Get registered faces as Flow for real-time updates
     */
    fun getRegisteredFacesFlow(): Flow<List<RegisteredFace>> = flow {
        val userId = getCurrentUserId()
        if (userId != null) {
            try {
                val snapshot = firestore.collection(USERS_COLLECTION)
                    .document(userId)
                    .collection(REGISTERED_FACES_COLLECTION)
                    .whereEqualTo("isActive", true)
                    .orderBy("dateAdded", Query.Direction.DESCENDING)
                    .get()
                    .await()

                val faces = snapshot.documents.mapNotNull { doc ->
                    doc.toObject(RegisteredFace::class.java)
                }
                emit(faces)
            } catch (e: Exception) {
                Log.e(TAG, "Error in getRegisteredFacesFlow", e)
                emit(emptyList())
            }
        } else {
            emit(emptyList())
        }
    }
}
