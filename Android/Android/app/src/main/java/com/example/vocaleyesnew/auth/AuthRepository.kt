package com.example.vocaleyesnew.auth

import android.content.Context
import android.util.Log
import androidx.credentials.CredentialManager
import androidx.credentials.GetCredentialRequest
import androidx.credentials.exceptions.GetCredentialException
import com.google.android.libraries.identity.googleid.GetGoogleIdOption
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.FirebaseUser
import com.google.firebase.auth.GoogleAuthProvider
import com.google.firebase.auth.UserProfileChangeRequest
import com.google.android.gms.common.GoogleApiAvailability
import com.google.android.gms.common.ConnectionResult
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.tasks.await
import java.security.MessageDigest
import java.util.UUID
import com.example.vocaleyesnew.firestore.FirestoreRepository

class AuthRepository(private val context: Context) {
    private val auth = FirebaseAuth.getInstance()
    private val credentialManager = CredentialManager.create(context)
    private val firestoreRepository = FirestoreRepository(context)
    
    companion object {
        private const val TAG = "AuthRepository"
        // Web client ID from google-services.json
        private const val WEB_CLIENT_ID = "391075985944-jd891lr9j6t21k03jg857s9f1pas5gli.apps.googleusercontent.com"
    }

    /**
     * Get current user
     */
    fun getCurrentUser(): FirebaseUser? = auth.currentUser

    /**
     * Check if user is authenticated
     */
    fun isUserAuthenticated(): Boolean = auth.currentUser != null

    /**
     * Sign in with email and password
     */
    suspend fun signInWithEmailPassword(email: String, password: String): Flow<AuthState> = flow {
        try {
            emit(AuthState.Loading)
            val result = auth.signInWithEmailAndPassword(email, password).await()
            result.user?.let { user ->
                // Create/update user document in Firestore
                firestoreRepository.createOrUpdateUser()
                emit(AuthState.Authenticated(user))
            } ?: emit(AuthState.Error("Authentication failed"))
        } catch (e: Exception) {
            Log.e(TAG, "Sign in failed", e)
            emit(AuthState.Error(e.message ?: "Sign in failed"))
        }
    }

    /**
     * Sign up with email and password
     */
    suspend fun signUpWithEmailPassword(
        email: String, 
        password: String, 
        fullName: String
    ): Flow<AuthState> = flow {
        try {
            emit(AuthState.Loading)
            val result = auth.createUserWithEmailAndPassword(email, password).await()
            result.user?.let { user ->
                // Update user profile with full name
                val profileUpdates = UserProfileChangeRequest.Builder()
                    .setDisplayName(fullName)
                    .build()
                user.updateProfile(profileUpdates).await()

                // Create user document in Firestore
                firestoreRepository.createOrUpdateUser()
                emit(AuthState.Authenticated(user))
            } ?: emit(AuthState.Error("Account creation failed"))
        } catch (e: Exception) {
            Log.e(TAG, "Sign up failed", e)
            emit(AuthState.Error(e.message ?: "Sign up failed"))
        }
    }

    /**
     * Sign in with Google using Credential Manager
     */
    suspend fun signInWithGoogle(): Flow<AuthState> = flow {
        try {
            emit(AuthState.Loading)
            Log.d(TAG, "Starting Google Sign-In with Web Client ID: $WEB_CLIENT_ID")

            // Check if Google Play Services is available
            if (!isGooglePlayServicesAvailable()) {
                emit(AuthState.Error("Google Play Services is not available on this device"))
                return@flow
            }

            val googleIdOption = GetGoogleIdOption.Builder()
                .setFilterByAuthorizedAccounts(false)
                .setServerClientId(WEB_CLIENT_ID)
                .setAutoSelectEnabled(false) // Changed to false for better debugging
                .setNonce(generateNonce())
                .build()

            val request = GetCredentialRequest.Builder()
                .addCredentialOption(googleIdOption)
                .build()

            Log.d(TAG, "Requesting credentials from Credential Manager")
            val result = credentialManager.getCredential(
                request = request,
                context = context
            )

            Log.d(TAG, "Credential received, creating Google ID token credential")
            val credential = GoogleIdTokenCredential.createFrom(result.credential.data)
            val googleCredential = GoogleAuthProvider.getCredential(credential.idToken, null)

            Log.d(TAG, "Signing in with Firebase using Google credential")
            val authResult = auth.signInWithCredential(googleCredential).await()
            authResult.user?.let { user ->
                Log.d(TAG, "Google Sign-In successful for user: ${user.email}")
                // Create/update user document in Firestore
                firestoreRepository.createOrUpdateUser()
                emit(AuthState.Authenticated(user))
            } ?: emit(AuthState.Error("Google sign in failed - no user returned"))

        } catch (e: GetCredentialException) {
            Log.e(TAG, "GetCredentialException during Google sign in", e)
            val errorMessage = when {
                e.message?.contains("No credential available") == true -> "No Google credentials found. Please ensure you have a Google account set up on this device and that the app is properly configured in Firebase Console."
                e.message?.contains("canceled") == true -> "Google sign in was canceled by user"
                e.message?.contains("interrupted") == true -> "Google sign in was interrupted"
                else -> "Google sign in failed: ${e.message}. Please check Firebase configuration and ensure SHA-1 fingerprint is added."
            }
            emit(AuthState.Error(errorMessage))
        } catch (e: Exception) {
            Log.e(TAG, "Exception during Google sign in", e)
            emit(AuthState.Error("Google sign in failed: ${e.message}. Please check Firebase configuration and ensure SHA-1 fingerprint is added."))
        }
    }

    private fun isGooglePlayServicesAvailable(): Boolean {
        return try {
            val googleApiAvailability = GoogleApiAvailability.getInstance()
            val resultCode = googleApiAvailability.isGooglePlayServicesAvailable(context)
            resultCode == ConnectionResult.SUCCESS
        } catch (e: Exception) {
            Log.e(TAG, "Error checking Google Play Services availability", e)
            false
        }
    }

    /**
     * Sign out
     */
    suspend fun signOut(): Flow<AuthState> = flow {
        try {
            auth.signOut()
            emit(AuthState.Unauthenticated)
        } catch (e: Exception) {
            Log.e(TAG, "Sign out failed", e)
            emit(AuthState.Error(e.message ?: "Sign out failed"))
        }
    }

    /**
     * Reset password
     */
    suspend fun resetPassword(email: String): Flow<Boolean> = flow {
        try {
            auth.sendPasswordResetEmail(email).await()
            emit(true)
        } catch (e: Exception) {
            Log.e(TAG, "Password reset failed", e)
            emit(false)
        }
    }

    /**
     * Generate nonce for Google Sign-In
     */
    private fun generateNonce(): String {
        val bytes = UUID.randomUUID().toString().toByteArray()
        val md = MessageDigest.getInstance("SHA-256")
        val digest = md.digest(bytes)
        return digest.fold("") { str, it -> str + "%02x".format(it) }
    }

    /**
     * Validate email format
     */
    fun isValidEmail(email: String): Boolean {
        return android.util.Patterns.EMAIL_ADDRESS.matcher(email).matches()
    }

    /**
     * Validate password strength
     */
    fun isValidPassword(password: String): Boolean {
        return password.length >= 6
    }

    /**
     * Get password strength message
     */
    fun getPasswordStrengthMessage(password: String): String {
        return when {
            password.length < 6 -> "Password must be at least 6 characters"
            password.length < 8 -> "Weak password"
            !password.any { it.isDigit() } -> "Add numbers for stronger password"
            !password.any { it.isUpperCase() } -> "Add uppercase letters for stronger password"
            !password.any { !it.isLetterOrDigit() } -> "Add special characters for stronger password"
            else -> "Strong password"
        }
    }
}
