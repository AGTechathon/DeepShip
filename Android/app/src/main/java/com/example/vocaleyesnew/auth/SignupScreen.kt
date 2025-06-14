package com.example.vocaleyesnew.auth

import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.platform.LocalSoftwareKeyboardController
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.vocaleyesnew.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SignupScreen(
    authViewModel: AuthViewModel,
    onNavigateToLogin: () -> Unit,
    onSignupSuccess: () -> Unit,
    modifier: Modifier = Modifier
) {
    val signupFormState by authViewModel.signupFormState.collectAsState()
    val authState by authViewModel.authState.collectAsState()
    val authEvent by authViewModel.authEvent.collectAsState()
    
    val focusManager = LocalFocusManager.current
    val keyboardController = LocalSoftwareKeyboardController.current
    
    val emailFocusRequester = remember { FocusRequester() }
    val passwordFocusRequester = remember { FocusRequester() }
    val confirmPasswordFocusRequester = remember { FocusRequester() }
    
    var passwordVisible by remember { mutableStateOf(false) }
    var confirmPasswordVisible by remember { mutableStateOf(false) }
    
    // Animation states
    val animatedVisibilityState = remember { MutableTransitionState(false) }
    animatedVisibilityState.targetState = true
    
    // Handle auth events
    LaunchedEffect(authEvent) {
        when (authEvent) {
            is AuthEvent.SignupSuccess -> {
                onSignupSuccess()
                authViewModel.clearAuthEvent()
            }
            is AuthEvent.AuthError -> {
                // Error will be shown in UI
            }
            else -> {}
        }
    }

    // Handle auth state changes
    LaunchedEffect(authState) {
        if (authState is AuthState.Authenticated) {
            onSignupSuccess()
        }
    }

    AnimatedGradientBackground {
        AnimatedVisibility(
            visibleState = animatedVisibilityState,
            enter = slideInVertically(
                initialOffsetY = { it },
                animationSpec = tween(800, easing = EaseOutCubic)
            ) + fadeIn(animationSpec = tween(800))
        ) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(24.dp)
                    .verticalScroll(rememberScrollState()),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center
            ) {
                // Logo and Title
                AnimatedContent(
                    targetState = true,
                    transitionSpec = {
                        slideInVertically(
                            initialOffsetY = { -it },
                            animationSpec = tween(600, delayMillis = 200)
                        ) with slideOutVertically(
                            targetOffsetY = { -it },
                            animationSpec = tween(600)
                        )
                    }, label = "signup_logo_animation"
                ) {
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        modifier = Modifier.padding(bottom = 32.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.RemoveRedEye,
                            contentDescription = "VocalEyes Logo",
                            modifier = Modifier.size(80.dp),
                            tint = Color.White
                        )
                        Spacer(modifier = Modifier.height(16.dp))
                        Text(
                            text = "VocalEyes",
                            style = MaterialTheme.typography.headlineLarge.copy(
                                fontWeight = FontWeight.Bold,
                                fontSize = 32.sp
                            ),
                            color = Color.White
                        )
                        Text(
                            text = "Create your account",
                            style = MaterialTheme.typography.bodyLarge,
                            color = Color.White.copy(alpha = 0.8f)
                        )
                    }
                }

                // Signup Form Card
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .animateContentSize(),
                    shape = RoundedCornerShape(24.dp),
                    colors = CardDefaults.cardColors(
                        containerColor = Color.White
                    ),
                    elevation = CardDefaults.cardElevation(defaultElevation = 8.dp)
                ) {
                    Column(
                        modifier = Modifier.padding(24.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text(
                            text = "Sign Up",
                            style = MaterialTheme.typography.headlineSmall.copy(
                                fontWeight = FontWeight.Bold
                            ),
                            color = AuthOnSurface,
                            modifier = Modifier.padding(bottom = 24.dp)
                        )

                        // Full Name Field
                        AuthTextField(
                            value = signupFormState.fullName,
                            onValueChange = authViewModel::updateSignupFullName,
                            label = "Full Name",
                            leadingIcon = Icons.Default.Person,
                            keyboardOptions = KeyboardOptions(
                                keyboardType = KeyboardType.Text,
                                imeAction = ImeAction.Next
                            ),
                            keyboardActions = KeyboardActions(
                                onNext = { emailFocusRequester.requestFocus() }
                            ),
                            isError = !signupFormState.isFullNameValid,
                            errorMessage = signupFormState.fullNameError,
                            modifier = Modifier.fillMaxWidth()
                        )

                        Spacer(modifier = Modifier.height(16.dp))

                        // Email Field
                        AuthTextField(
                            value = signupFormState.email,
                            onValueChange = authViewModel::updateSignupEmail,
                            label = "Email",
                            leadingIcon = Icons.Default.Email,
                            keyboardOptions = KeyboardOptions(
                                keyboardType = KeyboardType.Email,
                                imeAction = ImeAction.Next
                            ),
                            keyboardActions = KeyboardActions(
                                onNext = { passwordFocusRequester.requestFocus() }
                            ),
                            isError = !signupFormState.isEmailValid,
                            errorMessage = signupFormState.emailError,
                            modifier = Modifier
                                .fillMaxWidth()
                                .focusRequester(emailFocusRequester)
                        )

                        Spacer(modifier = Modifier.height(16.dp))

                        // Password Field
                        AuthTextField(
                            value = signupFormState.password,
                            onValueChange = authViewModel::updateSignupPassword,
                            label = "Password",
                            leadingIcon = Icons.Default.Lock,
                            trailingIcon = if (passwordVisible) Icons.Default.VisibilityOff else Icons.Default.Visibility,
                            onTrailingIconClick = { passwordVisible = !passwordVisible },
                            visualTransformation = if (passwordVisible) VisualTransformation.None else PasswordVisualTransformation(),
                            keyboardOptions = KeyboardOptions(
                                keyboardType = KeyboardType.Password,
                                imeAction = ImeAction.Next
                            ),
                            keyboardActions = KeyboardActions(
                                onNext = { confirmPasswordFocusRequester.requestFocus() }
                            ),
                            isError = !signupFormState.isPasswordValid,
                            errorMessage = signupFormState.passwordError,
                            modifier = Modifier
                                .fillMaxWidth()
                                .focusRequester(passwordFocusRequester)
                        )

                        Spacer(modifier = Modifier.height(16.dp))

                        // Confirm Password Field
                        AuthTextField(
                            value = signupFormState.confirmPassword,
                            onValueChange = authViewModel::updateSignupConfirmPassword,
                            label = "Confirm Password",
                            leadingIcon = Icons.Default.Lock,
                            trailingIcon = if (confirmPasswordVisible) Icons.Default.VisibilityOff else Icons.Default.Visibility,
                            onTrailingIconClick = { confirmPasswordVisible = !confirmPasswordVisible },
                            visualTransformation = if (confirmPasswordVisible) VisualTransformation.None else PasswordVisualTransformation(),
                            keyboardOptions = KeyboardOptions(
                                keyboardType = KeyboardType.Password,
                                imeAction = ImeAction.Done
                            ),
                            keyboardActions = KeyboardActions(
                                onDone = {
                                    keyboardController?.hide()
                                    focusManager.clearFocus()
                                }
                            ),
                            isError = !signupFormState.isConfirmPasswordValid,
                            errorMessage = signupFormState.confirmPasswordError,
                            modifier = Modifier
                                .fillMaxWidth()
                                .focusRequester(confirmPasswordFocusRequester)
                        )

                        Spacer(modifier = Modifier.height(16.dp))

                        // Terms and Conditions
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Checkbox(
                                checked = signupFormState.acceptTerms,
                                onCheckedChange = authViewModel::updateAcceptTerms,
                                colors = CheckboxDefaults.colors(
                                    checkedColor = AuthPrimary
                                )
                            )
                            Text(
                                text = "I agree to the Terms of Service and Privacy Policy",
                                style = MaterialTheme.typography.bodySmall,
                                color = AuthOnSurface.copy(alpha = 0.7f),
                                modifier = Modifier.padding(start = 8.dp)
                            )
                        }

                        Spacer(modifier = Modifier.height(24.dp))

                        // Sign Up Button
                        AuthButton(
                            text = "Create Account",
                            onClick = { authViewModel.signUpWithEmailPassword() },
                            isLoading = signupFormState.isLoading,
                            enabled = signupFormState.isEmailValid && 
                                     signupFormState.isPasswordValid &&
                                     signupFormState.isConfirmPasswordValid &&
                                     signupFormState.isFullNameValid &&
                                     signupFormState.email.isNotEmpty() &&
                                     signupFormState.password.isNotEmpty() &&
                                     signupFormState.confirmPassword.isNotEmpty() &&
                                     signupFormState.fullName.isNotEmpty() &&
                                     signupFormState.acceptTerms,
                            modifier = Modifier.fillMaxWidth()
                        )

                        Spacer(modifier = Modifier.height(16.dp))

                        // Divider
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Divider(modifier = Modifier.weight(1f))
                            Text(
                                text = "or",
                                modifier = Modifier.padding(horizontal = 16.dp),
                                style = MaterialTheme.typography.bodyMedium,
                                color = AuthOnSurface.copy(alpha = 0.6f)
                            )
                            Divider(modifier = Modifier.weight(1f))
                        }

                        Spacer(modifier = Modifier.height(16.dp))

                        // Google Sign Up Button
                        SocialLoginButton(
                            text = "Sign up with Google",
                            icon = Icons.Default.AccountCircle,
                            onClick = { authViewModel.signInWithGoogle() },
                            backgroundColor = Color.White,
                            contentColor = AuthOnSurface,
                            borderColor = InputBorder,
                            modifier = Modifier.fillMaxWidth()
                        )

                        Spacer(modifier = Modifier.height(24.dp))

                        // Login Link
                        Row(
                            horizontalArrangement = Arrangement.Center
                        ) {
                            Text(
                                text = "Already have an account? ",
                                style = MaterialTheme.typography.bodyMedium,
                                color = AuthOnSurface.copy(alpha = 0.7f)
                            )
                            Text(
                                text = "Sign In",
                                style = MaterialTheme.typography.bodyMedium.copy(
                                    fontWeight = FontWeight.Bold
                                ),
                                color = AuthPrimary,
                                modifier = Modifier.clickable { onNavigateToLogin() }
                            )
                        }
                    }
                }

                // Error Message
                authEvent?.let { event ->
                    if (event is AuthEvent.AuthError) {
                        Spacer(modifier = Modifier.height(16.dp))
                        Card(
                            colors = CardDefaults.cardColors(
                                containerColor = AuthError.copy(alpha = 0.1f)
                            ),
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(12.dp)
                        ) {
                            Text(
                                text = event.message,
                                color = AuthError,
                                style = MaterialTheme.typography.bodyMedium,
                                textAlign = TextAlign.Center,
                                modifier = Modifier.padding(16.dp)
                            )
                        }
                    }
                }
            }
        }
    }
}
