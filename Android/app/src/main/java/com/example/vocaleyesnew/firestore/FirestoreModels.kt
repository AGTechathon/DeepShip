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
