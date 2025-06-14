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


}
