# Firestore Face Recognition Implementation

## Overview
This document outlines the complete implementation of Firebase Firestore integration for user management and face recognition data storage, similar to the structure shown in the provided image.

## Database Structure

### 1. Users Collection
```
users/{userId}/
├── uid: "7bKXdl3MQqaQ8fcJBSivlE2nJlB3"
├── email: "akhilkaranpur25@gmail.com"
├── displayName: "Akhil Karanpur"
├── photoURL: "https://lh3.googleusercontent.com/a/ACg8ocJONNPsLuZhGnzc4Goa4zolPahvGSn-b-QoMbods-d6ymSG=s96-c"
├── createdAt: Timestamp
├── lastLoginAt: Timestamp
└── preferences: {
    ├── emailAlerts: true
    ├── language: "en"
    ├── notifications: true
    └── theme: "system"
}
```

### 2. RegisteredFaces Subcollection
```
users/{userId}/RegisteredFaces/{faceId}/
├── faceId: "auto-generated-uuid"
├── personName: "Person Name"
├── faceEmbedding: "JSON string of face features"
├── confidence: 0.95
├── imagePath: "optional/path/to/image"
├── dateAdded: Timestamp
├── isActive: true
└── metadata: {
    ├── detectionMethod: "mlkit"
    ├── deviceInfo: "Samsung Galaxy S21"
    ├── appVersion: "1.0.0"
    ├── qualityScore: 0.95
    └── landmarks: {}
}
```

### 3. FaceRecognitionEvents Subcollection
```
users/{userId}/FaceRecognitionEvents/{eventId}/
├── eventId: "auto-generated-uuid"
├── recognizedPersonName: "Person Name" | null
├── confidence: 0.87
├── isNewFace: false
├── detectionContext: "navigation" | "object_detection" | "face_recognition"
├── timestamp: Timestamp
├── location: "optional location"
└── deviceInfo: "Samsung Galaxy S21"
```

## Implementation Steps

### Step 1: Dependencies Added
```kotlin
// In app/build.gradle.kts
implementation("com.google.firebase:firebase-firestore-ktx")
```

### Step 2: Data Models Created
- `UserDocument`: Main user information
- `RegisteredFace`: Face data with embeddings and metadata
- `FaceRecognitionEvent`: Recognition event logging
- `UserPreferences`: User settings and preferences

### Step 3: Firestore Repository
Created `FirestoreRepository.kt` with methods:
- `createOrUpdateUser()`: Creates user document on sign-in
- `saveRegisteredFace()`: Saves face data to Firestore
- `getRegisteredFaces()`: Retrieves user's registered faces
- `logFaceRecognitionEvent()`: Logs recognition events
- `deleteRegisteredFace()`: Soft delete (marks as inactive)

### Step 4: Authentication Integration
Updated `AuthRepository.kt` to automatically create user documents:
- Email/password sign-in
- Google sign-in
- User registration

### Step 5: Face Recognition Integration
Updated `FaceRecognitionManager.kt` to:
- Save faces to both local Room database and Firestore
- Log recognition events to Firestore
- Support context-aware recognition (navigation, object detection, etc.)

### Step 6: Activity Integration
Updated activities to use face recognition with Firestore:

#### NavigationActivity
- Detects faces during navigation
- Announces recognized persons: "I can see [Person Name] in front of you"
- Announces unknown faces: "I can see an unknown person in front of you"
- Logs events with context "navigation"

#### ObjectDetectionActivity  
- Detects faces during object detection
- Announces recognized persons: "I can see [Person Name] here"
- Announces unknown faces: "I can see an unknown person here"
- Logs events with context "object_detection"

## Key Features

### 1. Automatic User Document Creation
When users sign in via Google or email/password, a user document is automatically created in Firestore with:
- User ID as document ID
- Email, display name, photo URL
- Creation and last login timestamps
- Default preferences

### 2. Dual Storage Strategy
Face data is stored in both:
- **Local Room Database**: For offline functionality and fast access
- **Firestore**: For cloud backup, sync across devices, and analytics

### 3. Context-Aware Recognition
Face recognition events are logged with context:
- `"navigation"`: When detected during navigation assistance
- `"object_detection"`: When detected during object detection
- `"face_recognition"`: When detected in dedicated face recognition mode

### 4. Voice Announcements
When faces are detected and recognized:
- **Known faces**: "I can see [Person Name] in front of you/here"
- **Unknown faces**: "I can see an unknown person in front of you/here"
- Announcements are spoken using the VoiceRecognitionManager

### 5. Comprehensive Logging
All face recognition events are logged with:
- Person name (if recognized)
- Confidence score
- Detection context
- Timestamp
- Device information

## Usage Flow

### 1. User Sign-In
```kotlin
// User signs in via Google or email/password
// AuthRepository automatically creates user document in Firestore
val userDocument = firestoreRepository.createOrUpdateUser()
```

### 2. Face Registration
```kotlin
// When user registers a face in FaceRecognitionActivity
val result = faceRecognitionManager.saveFace(personName, bitmap)
// Face is saved to both Room database and Firestore
```

### 3. Face Recognition During Navigation/Object Detection
```kotlin
// In NavigationActivity or ObjectDetectionActivity
val faceResult = faceRecognitionManager.detectFaces(bitmap)
faceResult.faces.forEach { face ->
    val recognitionResult = faceRecognitionManager.recognizeFace(face, "navigation")
    recognitionResult?.let { result ->
        if (result.personName != null) {
            voiceRecognitionManager.speak("I can see ${result.personName} in front of you")
        } else if (result.isNewFace) {
            voiceRecognitionManager.speak("I can see an unknown person in front of you")
        }
    }
}
```

### 4. Data Retrieval
```kotlin
// Get all registered faces for current user
val faces = firestoreRepository.getRegisteredFaces()

// Get recent recognition events
val events = firestoreRepository.getFaceRecognitionEvents(limit = 50)
```

## Security Considerations

### 1. User Data Isolation
- Each user's data is stored in their own document
- Firestore security rules ensure users can only access their own data

### 2. Face Data Privacy
- Face embeddings are stored as JSON strings (not raw images)
- Optional image paths for reference only
- Soft delete preserves data integrity while maintaining privacy

### 3. Authentication Required
- All Firestore operations require authenticated user
- No anonymous access to face data

## Benefits

### 1. Cloud Backup
- Face data is automatically backed up to Firestore
- No data loss if device is lost or app is reinstalled

### 2. Cross-Device Sync
- Users can access their registered faces across multiple devices
- Consistent experience regardless of device

### 3. Analytics and Insights
- Recognition events provide usage analytics
- Context-aware logging helps understand user behavior

### 4. Scalability
- Firestore handles scaling automatically
- No infrastructure management required

### 5. Real-time Updates
- Changes to face data can be synced in real-time
- Support for collaborative features in the future

## Testing

The implementation includes comprehensive error handling and logging:
- Network connectivity issues
- Firestore permission errors
- Face recognition failures
- Authentication state changes

All operations use Result types for proper error handling and user feedback.
