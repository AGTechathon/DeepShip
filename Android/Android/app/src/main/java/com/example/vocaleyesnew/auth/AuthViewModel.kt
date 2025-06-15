package com.example.vocaleyesnew.auth

import android.content.Context
import androidx.compose.runtime.mutableStateOf
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class AuthViewModel(context: Context) : ViewModel() {
    private val authRepository = AuthRepository(context)
    
    // Auth state
    private val _authState = MutableStateFlow<AuthState>(AuthState.Unauthenticated)
    val authState: StateFlow<AuthState> = _authState.asStateFlow()
    
    // Login form state
    private val _loginFormState = MutableStateFlow(LoginFormState())
    val loginFormState: StateFlow<LoginFormState> = _loginFormState.asStateFlow()
    
    // Signup form state
    private val _signupFormState = MutableStateFlow(SignupFormState())
    val signupFormState: StateFlow<SignupFormState> = _signupFormState.asStateFlow()
    
    // Auth events
    private val _authEvent = MutableStateFlow<AuthEvent?>(null)
    val authEvent: StateFlow<AuthEvent?> = _authEvent.asStateFlow()
    
    // Loading states
    val isLoading = mutableStateOf(false)
    val showBiometricPrompt = mutableStateOf(false)

    init {
        checkAuthState()
    }

    /**
     * Check current authentication state
     */
    private fun checkAuthState() {
        val currentUser = authRepository.getCurrentUser()
        _authState.value = if (currentUser != null) {
            AuthState.Authenticated(currentUser)
        } else {
            AuthState.Unauthenticated
        }
    }

    /**
     * Update login form email
     */
    fun updateLoginEmail(email: String) {
        val isValid = authRepository.isValidEmail(email)
        _loginFormState.value = _loginFormState.value.copy(
            email = email,
            isEmailValid = isValid,
            emailError = if (isValid || email.isEmpty()) null else "Invalid email format"
        )
    }

    /**
     * Update login form password
     */
    fun updateLoginPassword(password: String) {
        val isValid = authRepository.isValidPassword(password)
        _loginFormState.value = _loginFormState.value.copy(
            password = password,
            isPasswordValid = isValid,
            passwordError = if (isValid || password.isEmpty()) null else "Password must be at least 6 characters"
        )
    }

    /**
     * Update remember me preference
     */
    fun updateRememberMe(remember: Boolean) {
        _loginFormState.value = _loginFormState.value.copy(rememberMe = remember)
    }

    /**
     * Sign in with email and password
     */
    fun signInWithEmailPassword() {
        val currentState = _loginFormState.value
        if (!currentState.isEmailValid || !currentState.isPasswordValid) {
            return
        }

        viewModelScope.launch {
            _loginFormState.value = currentState.copy(isLoading = true)
            authRepository.signInWithEmailPassword(
                currentState.email,
                currentState.password
            ).collect { authState ->
                _authState.value = authState
                _loginFormState.value = currentState.copy(isLoading = false)
                
                when (authState) {
                    is AuthState.Authenticated -> _authEvent.value = AuthEvent.LoginSuccess
                    is AuthState.Error -> _authEvent.value = AuthEvent.AuthError(authState.message)
                    else -> {}
                }
            }
        }
    }

    /**
     * Sign in with Google
     */
    fun signInWithGoogle() {
        viewModelScope.launch {
            isLoading.value = true
            authRepository.signInWithGoogle().collect { authState ->
                _authState.value = authState
                isLoading.value = false
                
                when (authState) {
                    is AuthState.Authenticated -> _authEvent.value = AuthEvent.LoginSuccess
                    is AuthState.Error -> _authEvent.value = AuthEvent.AuthError(authState.message)
                    else -> {}
                }
            }
        }
    }

    /**
     * Update signup form fields
     */
    fun updateSignupEmail(email: String) {
        val isValid = authRepository.isValidEmail(email)
        _signupFormState.value = _signupFormState.value.copy(
            email = email,
            isEmailValid = isValid,
            emailError = if (isValid || email.isEmpty()) null else "Invalid email format"
        )
    }

    fun updateSignupPassword(password: String) {
        val isValid = authRepository.isValidPassword(password)
        _signupFormState.value = _signupFormState.value.copy(
            password = password,
            isPasswordValid = isValid,
            passwordError = if (isValid || password.isEmpty()) null else authRepository.getPasswordStrengthMessage(password)
        )
    }

    fun updateSignupConfirmPassword(confirmPassword: String) {
        val currentPassword = _signupFormState.value.password
        val isValid = confirmPassword == currentPassword
        _signupFormState.value = _signupFormState.value.copy(
            confirmPassword = confirmPassword,
            isConfirmPasswordValid = isValid,
            confirmPasswordError = if (isValid || confirmPassword.isEmpty()) null else "Passwords do not match"
        )
    }

    fun updateSignupFullName(fullName: String) {
        val isValid = fullName.trim().length >= 2
        _signupFormState.value = _signupFormState.value.copy(
            fullName = fullName,
            isFullNameValid = isValid,
            fullNameError = if (isValid || fullName.isEmpty()) null else "Name must be at least 2 characters"
        )
    }

    fun updateAcceptTerms(accept: Boolean) {
        _signupFormState.value = _signupFormState.value.copy(acceptTerms = accept)
    }

    /**
     * Sign up with email and password
     */
    fun signUpWithEmailPassword() {
        val currentState = _signupFormState.value
        if (!currentState.isEmailValid || !currentState.isPasswordValid || 
            !currentState.isConfirmPasswordValid || !currentState.isFullNameValid ||
            !currentState.acceptTerms) {
            return
        }

        viewModelScope.launch {
            _signupFormState.value = currentState.copy(isLoading = true)
            authRepository.signUpWithEmailPassword(
                currentState.email,
                currentState.password,
                currentState.fullName
            ).collect { authState ->
                _authState.value = authState
                _signupFormState.value = currentState.copy(isLoading = false)
                
                when (authState) {
                    is AuthState.Authenticated -> _authEvent.value = AuthEvent.SignupSuccess
                    is AuthState.Error -> _authEvent.value = AuthEvent.AuthError(authState.message)
                    else -> {}
                }
            }
        }
    }

    /**
     * Sign out
     */
    fun signOut() {
        viewModelScope.launch {
            authRepository.signOut().collect { authState ->
                _authState.value = authState
                if (authState is AuthState.Unauthenticated) {
                    _authEvent.value = AuthEvent.LogoutSuccess
                }
            }
        }
    }

    /**
     * Reset password
     */
    fun resetPassword(email: String) {
        viewModelScope.launch {
            authRepository.resetPassword(email).collect { success ->
                if (success) {
                    _authEvent.value = AuthEvent.AuthError("Password reset email sent")
                } else {
                    _authEvent.value = AuthEvent.AuthError("Failed to send password reset email")
                }
            }
        }
    }

    /**
     * Clear auth event
     */
    fun clearAuthEvent() {
        _authEvent.value = null
    }

    /**
     * Clear form states
     */
    fun clearLoginForm() {
        _loginFormState.value = LoginFormState()
    }

    fun clearSignupForm() {
        _signupFormState.value = SignupFormState()
    }
}
