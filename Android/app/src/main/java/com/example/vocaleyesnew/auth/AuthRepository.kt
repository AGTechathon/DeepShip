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
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.tasks.await
import java.security.MessageDigest
import java.util.UUID

class AuthRepository(private val context: Context) {
    private val auth = FirebaseAuth.getInstance()
    private val credentialManager = CredentialManager.create(context)
    
    companion object {
        private const val TAG = "AuthRepository"
        // Replace with your actual web client ID from Google Cloud Console
        private const val WEB_CLIENT_ID = "your-web-client-id.googleusercontent.com"
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
            
            val googleIdOption = GetGoogleIdOption.Builder()
                .setFilterByAuthorizedAccounts(false)
                .setServerClientId(WEB_CLIENT_ID)
                .setAutoSelectEnabled(true)
                .setNonce(generateNonce())
                .build()

            val request = GetCredentialRequest.Builder()
                .addCredentialOption(googleIdOption)
                .build()

            val result = credentialManager.getCredential(
                request = request,
                context = context
            )

            val credential = GoogleIdTokenCredential.createFrom(result.credential.data)
            val googleCredential = GoogleAuthProvider.getCredential(credential.idToken, null)
            
            val authResult = auth.signInWithCredential(googleCredential).await()
            authResult.user?.let { user ->
                emit(AuthState.Authenticated(user))
            } ?: emit(AuthState.Error("Google sign in failed"))
            
        } catch (e: GetCredentialException) {
            Log.e(TAG, "Google sign in failed", e)
            emit(AuthState.Error("Google sign in failed: ${e.message}"))
        } catch (e: Exception) {
            Log.e(TAG, "Google sign in failed", e)
            emit(AuthState.Error(e.message ?: "Google sign in failed"))
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
