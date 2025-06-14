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
import androidx.compose.ui.graphics.Brush
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
fun LoginScreen(
    authViewModel: AuthViewModel,
    onNavigateToSignup: () -> Unit,
    onLoginSuccess: () -> Unit,
    modifier: Modifier = Modifier
) {
    val loginFormState by authViewModel.loginFormState.collectAsState()
    val authState by authViewModel.authState.collectAsState()
    val authEvent by authViewModel.authEvent.collectAsState()
    
    val focusManager = LocalFocusManager.current
    val keyboardController = LocalSoftwareKeyboardController.current
    val passwordFocusRequester = remember { FocusRequester() }
    
    var passwordVisible by remember { mutableStateOf(false) }
    var showForgotPassword by remember { mutableStateOf(false) }
    
    // Animation states
    val animatedVisibilityState = remember { MutableTransitionState(false) }
    animatedVisibilityState.targetState = true
    
    // Handle auth events
    LaunchedEffect(authEvent) {
        when (authEvent) {
            is AuthEvent.LoginSuccess -> {
                onLoginSuccess()
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
            onLoginSuccess()
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
                    }, label = "logo_animation"
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
                            text = "Welcome back",
                            style = MaterialTheme.typography.bodyLarge,
                            color = Color.White.copy(alpha = 0.8f)
                        )
                    }
                }

                // Login Form Card
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
                            text = "Sign In",
                            style = MaterialTheme.typography.headlineSmall.copy(
                                fontWeight = FontWeight.Bold
                            ),
                            color = AuthOnSurface,
                            modifier = Modifier.padding(bottom = 24.dp)
                        )

                        // Email Field
                        AuthTextField(
                            value = loginFormState.email,
                            onValueChange = authViewModel::updateLoginEmail,
                            label = "Email",
                            leadingIcon = Icons.Default.Email,
                            keyboardOptions = KeyboardOptions(
                                keyboardType = KeyboardType.Email,
                                imeAction = ImeAction.Next
                            ),
                            keyboardActions = KeyboardActions(
                                onNext = { passwordFocusRequester.requestFocus() }
                            ),
                            isError = !loginFormState.isEmailValid,
                            errorMessage = loginFormState.emailError,
                            modifier = Modifier.fillMaxWidth()
                        )

                        Spacer(modifier = Modifier.height(16.dp))

                        // Password Field
                        AuthTextField(
                            value = loginFormState.password,
                            onValueChange = authViewModel::updateLoginPassword,
                            label = "Password",
                            leadingIcon = Icons.Default.Lock,
                            trailingIcon = if (passwordVisible) Icons.Default.VisibilityOff else Icons.Default.Visibility,
                            onTrailingIconClick = { passwordVisible = !passwordVisible },
                            visualTransformation = if (passwordVisible) VisualTransformation.None else PasswordVisualTransformation(),
                            keyboardOptions = KeyboardOptions(
                                keyboardType = KeyboardType.Password,
                                imeAction = ImeAction.Done
                            ),
                            keyboardActions = KeyboardActions(
                                onDone = {
                                    keyboardController?.hide()
                                    focusManager.clearFocus()
                                    authViewModel.signInWithEmailPassword()
                                }
                            ),
                            isError = !loginFormState.isPasswordValid,
                            errorMessage = loginFormState.passwordError,
                            modifier = Modifier
                                .fillMaxWidth()
                                .focusRequester(passwordFocusRequester)
                        )

                        Spacer(modifier = Modifier.height(16.dp))

                        // Remember Me and Forgot Password
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Checkbox(
                                    checked = loginFormState.rememberMe,
                                    onCheckedChange = authViewModel::updateRememberMe,
                                    colors = CheckboxDefaults.colors(
                                        checkedColor = AuthPrimary
                                    )
                                )
                                Text(
                                    text = "Remember me",
                                    style = MaterialTheme.typography.bodyMedium,
                                    color = AuthOnSurface
                                )
                            }

                            TextButton(
                                onClick = { showForgotPassword = true }
                            ) {
                                Text(
                                    text = "Forgot Password?",
                                    color = AuthPrimary
                                )
                            }
                        }

                        Spacer(modifier = Modifier.height(24.dp))

                        // Sign In Button
                        AuthButton(
                            text = "Sign In",
                            onClick = { authViewModel.signInWithEmailPassword() },
                            isLoading = loginFormState.isLoading,
                            enabled = loginFormState.isEmailValid && 
                                     loginFormState.isPasswordValid &&
                                     loginFormState.email.isNotEmpty() &&
                                     loginFormState.password.isNotEmpty(),
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

                        // Google Sign In Button
                        SocialLoginButton(
                            text = "Continue with Google",
                            icon = Icons.Default.AccountCircle,
                            onClick = { authViewModel.signInWithGoogle() },
                            backgroundColor = Color.White,
                            contentColor = AuthOnSurface,
                            borderColor = InputBorder,
                            modifier = Modifier.fillMaxWidth()
                        )

                        Spacer(modifier = Modifier.height(24.dp))

                        // Sign Up Link
                        Row(
                            horizontalArrangement = Arrangement.Center
                        ) {
                            Text(
                                text = "Don't have an account? ",
                                style = MaterialTheme.typography.bodyMedium,
                                color = AuthOnSurface.copy(alpha = 0.7f)
                            )
                            Text(
                                text = "Sign Up",
                                style = MaterialTheme.typography.bodyMedium.copy(
                                    fontWeight = FontWeight.Bold
                                ),
                                color = AuthPrimary,
                                modifier = Modifier.clickable { onNavigateToSignup() }
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

    // Forgot Password Dialog
    if (showForgotPassword) {
        ForgotPasswordDialog(
            onDismiss = { showForgotPassword = false },
            onResetPassword = { email ->
                authViewModel.resetPassword(email)
                showForgotPassword = false
            }
        )
    }
}
