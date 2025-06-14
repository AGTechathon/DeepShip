package com.example.vocaleyesnew.auth

import com.google.firebase.auth.FirebaseUser

/**
 * Represents the authentication state of the user
 */
sealed class AuthState {
    object Loading : AuthState()
    object Unauthenticated : AuthState()
    data class Authenticated(val user: FirebaseUser) : AuthState()
    data class Error(val message: String) : AuthState()
}

/**
 * Represents the state of login form
 */
data class LoginFormState(
    val email: String = "",
    val password: String = "",
    val isEmailValid: Boolean = true,
    val isPasswordValid: Boolean = true,
    val emailError: String? = null,
    val passwordError: String? = null,
    val isLoading: Boolean = false,
    val rememberMe: Boolean = false
)

/**
 * Represents the state of signup form
 */
data class SignupFormState(
    val email: String = "",
    val password: String = "",
    val confirmPassword: String = "",
    val fullName: String = "",
    val isEmailValid: Boolean = true,
    val isPasswordValid: Boolean = true,
    val isConfirmPasswordValid: Boolean = true,
    val isFullNameValid: Boolean = true,
    val emailError: String? = null,
    val passwordError: String? = null,
    val confirmPasswordError: String? = null,
    val fullNameError: String? = null,
    val isLoading: Boolean = false,
    val acceptTerms: Boolean = false
)

/**
 * Represents different authentication methods
 */
enum class AuthMethod {
    EMAIL_PASSWORD,
    GOOGLE,
    BIOMETRIC
}

/**
 * Represents authentication events
 */
sealed class AuthEvent {
    object LoginSuccess : AuthEvent()
    object SignupSuccess : AuthEvent()
    object LogoutSuccess : AuthEvent()
    data class AuthError(val message: String) : AuthEvent()
    object BiometricAuthSuccess : AuthEvent()
    object BiometricAuthError : AuthEvent()
}
