# VocalEyes Authentication Setup

This document explains the authentication system implemented in the VocalEyes Android app.

## Features Implemented

### 🔐 Authentication Methods
- **Email/Password Authentication** - Traditional signup and login
- **Google Sign-In** - One-tap Google authentication using Credential Manager
- **Biometric Authentication** - Fingerprint/Face unlock support (framework ready)

### 🎨 Modern UI Design
- **Material 3 Design** - Latest Material Design components
- **Smooth Animations** - Entrance animations, loading states, and transitions
- **Gradient Backgrounds** - Animated gradient backgrounds
- **Form Validation** - Real-time validation with error messages
- **Responsive Design** - Optimized for different screen sizes

### 🔧 Technical Features
- **Firebase Integration** - Complete Firebase Auth setup
- **MVVM Architecture** - Clean architecture with ViewModel and Repository pattern
- **State Management** - Reactive state management with StateFlow
- **Error Handling** - Comprehensive error handling and user feedback
- **Auto-logout** - Automatic logout functionality
- **Remember Me** - Persistent login option

## File Structure

```
auth/
├── AuthState.kt           # Data classes for authentication states
├── AuthRepository.kt      # Repository for authentication operations
├── AuthViewModel.kt       # ViewModel for managing auth state
├── AuthComponents.kt      # Reusable UI components
├── LoginScreen.kt         # Login screen composable
├── SignupScreen.kt        # Signup screen composable
├── LoginActivity.kt       # Login activity
├── SignupActivity.kt      # Signup activity
└── SplashActivity.kt      # Splash screen with auth check
```

## Setup Instructions

### 1. Firebase Configuration
The app is already configured with Firebase. The `google-services.json` file is included with the following configuration:
- **Project ID**: ag-hackathon
- **Package Name**: com.example.vocaleyesnew
- **Web Client ID**: 391075985944-la8ap07i6bb0mep088366qnf24033uss.apps.googleusercontent.com

### 2. Dependencies Added
All necessary dependencies have been added to `build.gradle.kts`:
- Firebase BoM (v33.15.0)
- Firebase Auth
- Firebase Analytics
- Google Play Services Auth
- Credential Manager
- Lottie for animations
- Biometric authentication

### 3. App Flow
1. **SplashActivity** - Entry point, checks authentication state
2. **LoginActivity** - Login screen if user is not authenticated
3. **SignupActivity** - Registration screen
4. **MainActivity** - Main app screen for authenticated users

### 4. Authentication Features

#### Login Screen
- Email/password login
- Google Sign-In button
- Remember me checkbox
- Forgot password dialog
- Real-time form validation
- Smooth animations

#### Signup Screen
- Full name, email, password, confirm password fields
- Terms and conditions checkbox
- Google Sign-Up option
- Password strength validation
- Real-time validation feedback

#### Security Features
- Password strength validation
- Email format validation
- Secure password storage via Firebase
- Automatic session management
- Logout functionality

## Usage

### For Users
1. **First Time**: App opens to splash screen, then login
2. **Login**: Enter email/password or use Google Sign-In
3. **Signup**: Create new account with email or Google
4. **Main App**: Access all VocalEyes features
5. **Logout**: Tap logout button in top bar

### For Developers
1. **Authentication Check**: Use `AuthViewModel.authState` to check user status
2. **Login/Logout**: Call `authViewModel.signInWithEmailPassword()` or `authViewModel.signOut()`
3. **User Info**: Access current user via `authViewModel.authState.value`

## Customization

### Colors
Update colors in `ui/theme/Color.kt`:
- `AuthPrimary` - Primary brand color
- `AuthSecondary` - Secondary accent color
- `GradientStart/End` - Background gradient colors

### Animations
Modify animations in `AuthComponents.kt`:
- Loading animations
- Entrance transitions
- Form validation feedback

### Validation Rules
Update validation in `AuthRepository.kt`:
- Password requirements
- Email format rules
- Custom validation logic

## Testing

### Test Accounts
You can create test accounts or use Google Sign-In for testing.

### Error Scenarios
The app handles:
- Network connectivity issues
- Invalid credentials
- Account already exists
- Password reset failures
- Google Sign-In cancellation

## Security Considerations

1. **Firebase Rules**: Ensure proper Firestore security rules
2. **API Keys**: Keep API keys secure (already configured)
3. **Certificate**: Use proper release certificates for production
4. **Validation**: All inputs are validated client and server-side

## Future Enhancements

1. **Biometric Authentication**: Complete biometric login implementation
2. **Social Logins**: Add Facebook, Twitter, etc.
3. **Two-Factor Authentication**: SMS or email verification
4. **Profile Management**: User profile editing
5. **Password Policies**: Advanced password requirements

## Troubleshooting

### Common Issues
1. **Google Sign-In fails**: Check SHA-1 certificate in Firebase console
2. **Build errors**: Ensure all dependencies are synced
3. **Authentication fails**: Verify Firebase configuration
4. **UI issues**: Check theme and color configurations

### Debug Mode
Enable debug logging in `AuthRepository.kt` by setting log level to DEBUG.
