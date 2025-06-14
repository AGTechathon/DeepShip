package com.example.vocaleyesnew.firestore

import com.google.firebase.Timestamp
import com.google.firebase.firestore.DocumentId
import com.google.firebase.firestore.ServerTimestamp

/**
 * User document structure in Firestore
 * Collection: users/{userId}
 */
data class UserDocument(
    @DocumentId
    val uid: String = "",
    val email: String = "",
    val displayName: String = "",
    val photoURL: String? = null,
    val createdAt: Timestamp? = null,
    val lastLoginAt: Timestamp? = null,
    val preferences: UserPreferences = UserPreferences()
)

/**
 * User preferences nested object
 */
data class UserPreferences(
    val emailAlerts: Boolean = true,
    val language: String = "en",
    val notifications: Boolean = true,
    val theme: String = "system"
)

/**
 * Registered Face document structure in Firestore
 * Collection: users/{userId}/RegisteredFaces/{faceId}
 */
data class RegisteredFace(
    @DocumentId
    val faceId: String = "",
    val personName: String = "",
    val faceEmbedding: String = "", // JSON string of face features/landmarks
    val confidence: Float = 0.0f,
    val imagePath: String? = null, // Optional path to stored face image
    @ServerTimestamp
    val dateAdded: Timestamp? = null,
    val isActive: Boolean = true,
    val metadata: FaceMetadata = FaceMetadata()
)

/**
 * Face metadata nested object
 */
data class FaceMetadata(
    val detectionMethod: String = "mlkit", // "mlkit", "manual", etc.
    val deviceInfo: String = "",
    val appVersion: String = "",
    val qualityScore: Float = 0.0f,
    val landmarks: Map<String, Any> = emptyMap()
)

/**
 * Face Recognition Event - for logging recognition events
 * Collection: users/{userId}/FaceRecognitionEvents/{eventId}
 */
data class FaceRecognitionEvent(
    @DocumentId
    val eventId: String = "",
    val recognizedPersonName: String? = null,
    val confidence: Float = 0.0f,
    val isNewFace: Boolean = false,
    val detectionContext: String = "", // "navigation", "object_detection", "face_recognition"
    @ServerTimestamp
    val timestamp: Timestamp? = null,
    val location: String? = null,
    val deviceInfo: String = ""
)

/**
 * User Profile document for additional user information
 * Collection: users/{userId}/profile
 */
data class UserProfile(
    val name: String = "",
    val email: String = "",
    val uid: String = "",
    @ServerTimestamp
    val createdAt: Timestamp? = null,
    @ServerTimestamp
    val updatedAt: Timestamp? = null
)
