package com.example.vocaleyesnew.auth

import android.content.Intent
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.viewModels
import androidx.compose.animation.core.*
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.RemoveRedEye
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import com.example.vocaleyesnew.MainActivity
import com.example.vocaleyesnew.ui.theme.*
import kotlinx.coroutines.delay

class SplashActivity : ComponentActivity() {
    
    private val authViewModel: AuthViewModel by viewModels {
        object : ViewModelProvider.Factory {
            @Suppress("UNCHECKED_CAST")
            override fun <T : ViewModel> create(modelClass: Class<T>): T {
                return AuthViewModel(applicationContext) as T
            }
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        setContent {
            VocalEyesNewTheme {
                SplashScreen(
                    onNavigateToLogin = {
                        startActivity(Intent(this@SplashActivity, LoginActivity::class.java))
                        finish()
                    },
                    onNavigateToMain = {
                        startActivity(Intent(this@SplashActivity, MainActivity::class.java))
                        finish()
                    },
                    authViewModel = authViewModel
                )
            }
        }
    }
}

@Composable
fun SplashScreen(
    onNavigateToLogin: () -> Unit,
    onNavigateToMain: () -> Unit,
    authViewModel: AuthViewModel
) {
    val authState by authViewModel.authState.collectAsState()
    
    // Animation for logo
    val infiniteTransition = rememberInfiniteTransition(label = "splash_animation")
    val scale by infiniteTransition.animateFloat(
        initialValue = 0.8f,
        targetValue = 1.2f,
        animationSpec = infiniteRepeatable(
            animation = tween(2000, easing = EaseInOutSine),
            repeatMode = RepeatMode.Reverse
        ),
        label = "scale"
    )
    
    val alpha by infiniteTransition.animateFloat(
        initialValue = 0.5f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(1500, easing = EaseInOutSine),
            repeatMode = RepeatMode.Reverse
        ),
        label = "alpha"
    )

    // Handle navigation based on auth state
    LaunchedEffect(authState) {
        delay(2000) // Show splash for at least 2 seconds
        when (authState) {
            is AuthState.Authenticated -> onNavigateToMain()
            is AuthState.Unauthenticated -> onNavigateToLogin()
            is AuthState.Loading -> {
                // Wait for auth state to resolve
            }
            is AuthState.Error -> onNavigateToLogin()
        }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(
                brush = Brush.verticalGradient(
                    colors = listOf(GradientStart, GradientEnd)
                )
            ),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Icon(
                imageVector = Icons.Default.RemoveRedEye,
                contentDescription = "VocalEyes Logo",
                modifier = Modifier
                    .size(120.dp)
                    .scale(scale),
                tint = Color.White.copy(alpha = alpha)
            )
            
            Spacer(modifier = Modifier.height(24.dp))
            
            Text(
                text = "VocalEyes",
                style = MaterialTheme.typography.headlineLarge.copy(
                    fontWeight = FontWeight.Bold,
                    fontSize = 36.sp
                ),
                color = Color.White.copy(alpha = alpha)
            )
            
            Spacer(modifier = Modifier.height(8.dp))
            
            Text(
                text = "Empowering Vision Through Voice",
                style = MaterialTheme.typography.bodyLarge,
                color = Color.White.copy(alpha = 0.8f)
            )
            
            Spacer(modifier = Modifier.height(48.dp))
            
            // Loading indicator
            if (authState is AuthState.Loading) {
                CircularProgressIndicator(
                    color = Color.White,
                    modifier = Modifier.size(32.dp)
                )
            }
        }
    }
}
