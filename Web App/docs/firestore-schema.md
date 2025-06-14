# Firestore Database Schema - HealthPulse Application

## Overview
This document describes the Firestore database structure for the HealthPulse application. Each user gets a structured set of collections and documents upon login.

## Collections Structure

### 1. `users` Collection
**Document ID**: User UID
**Purpose**: Store user profile and preferences

```typescript
{
  uid: string
  email: string
  displayName: string | null
  photoURL: string | null
  createdAt: number
  lastLoginAt: number
  isProfileComplete: boolean
  preferences: {
    notifications: boolean
    darkMode: boolean
    language: string
    timezone: string
  }
  healthProfile: {
    age: number | null
    gender: string | null
    height: number | null // in cm
    weight: number | null // in kg
    bloodType: string | null
    allergies: string[]
    medicalConditions: string[]
    emergencyContact: {
      name: string | null
      phone: string | null
      relationship: string | null
    }
  }
}
```

### 2. `Medicine Alerts` Collection
**Document ID**: Auto-generated
**Purpose**: Store medicine reminders and alerts

```typescript
{
  id?: string
  name: string
  time: string
  dosage: string
  status: "taken" | "missed" | "upcoming"
  date: string
  createdAt: number
  userId: string
  frequency: "daily" | "weekly" | "monthly" | "as-needed"
  notes?: string
  reminderEnabled: boolean
}
```

### 3. `locationHistory` Collection
**Document ID**: Auto-generated
**Purpose**: Store user location tracking history

```typescript
{
  id?: string
  userId: string
  lat: number
  lng: number
  timestamp: string
  address?: string
  accuracy?: number
  source: "manual" | "automatic" | "gps"
}
```

### 4. `healthReports` Collection
**Document ID**: Auto-generated
**Purpose**: Store generated health reports

```typescript
{
  id?: string
  userId: string
  reportType: "daily" | "weekly" | "monthly"
  generatedAt: number
  data: {
    steps: number
    heartRate: {
      average: number
      minimum: number
      maximum: number
      readings: Array<{ time: string; rate: number }>
    }
    location: {
      totalDistance: number
      placesVisited: number
      timeSpent: number
    }
    medications: {
      taken: number
      missed: number
      total: number
      adherenceRate: number
    }
    sleepData?: {
      duration: number
      quality: "poor" | "fair" | "good" | "excellent"
    }
    mood?: {
      rating: number // 1-10
      notes: string
    }
  }
  insights: string[]
  recommendations: string[]
}
```

### 5. `dashboardSettings` Collection
**Document ID**: User UID
**Purpose**: Store dashboard layout and preferences

```typescript
{
  userId: string
  layout: {
    widgets: Array<{
      id: string
      type: string
      position: { x: number; y: number }
      size: { width: number; height: number }
      visible: boolean
    }>
  }
  preferences: {
    refreshInterval: number // in seconds
    showNotifications: boolean
    compactMode: boolean
  }
  lastUpdated: number
}
```

## Security Rules

### Recommended Firestore Security Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own user document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Users can only access their own medicine alerts
    match /Medicine Alerts/{alertId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && 
        request.auth.uid == request.resource.data.userId;
    }
    
    // Users can only access their own location history
    match /locationHistory/{locationId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && 
        request.auth.uid == request.resource.data.userId;
    }
    
    // Users can only access their own health reports
    match /healthReports/{reportId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && 
        request.auth.uid == request.resource.data.userId;
    }
    
    // Users can only access their own dashboard settings
    match /dashboardSettings/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Initialization Process

When a user logs in for the first time, the following happens:

1. **User Profile Creation**: A document is created in the `users` collection with basic profile information
2. **Dashboard Settings**: Default dashboard layout and preferences are set up
3. **Sample Data**: Initial sample documents are created in each collection to help users understand the app
4. **Welcome Messages**: Sample medicine alert and location entry with welcome messages

## Data Flow

1. **Authentication**: User signs in via email/password or Google
2. **Initialization Check**: System checks if user exists in Firestore
3. **Data Setup**: If new user, complete schema is created
4. **Data Access**: User can now access and modify their data through the app
5. **Real-time Updates**: All data changes are synchronized in real-time across devices

## Backup and Migration

- All user data is stored in Firestore with automatic backups
- Data can be exported using Firestore export tools
- Migration scripts can be created to update schema if needed
- User data is portable and can be transferred between Firebase projects

## Performance Considerations

- Indexes are automatically created for common queries
- Data is structured to minimize read operations
- Pagination is implemented for large datasets
- Caching strategies are used for frequently accessed data
