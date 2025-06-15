# 🏥 Health Monitoring Dashboard

A comprehensive health monitoring web application built with Next.js, featuring real-time health tracking, medicine alerts, 3D visualizations, and Google Fit integration.

## ✨ Features

### 🎯 Core Features
- **Real-time Health Dashboard** - Monitor heart rate, steps, and vital statistics
- **3D Heart Animation** - Interactive 3D heart with realistic beating animation synchronized to heart rate
- **Medicine Alerts & Scheduling** - Smart medication reminders with customizable schedules
- **Health Reports** - Generate and download comprehensive health reports as PDFs
- **Live Location Tracking** - Real-time location monitoring with interactive maps
- **Google Fit Integration** - Seamless integration with Google Fit API for health data

### 🎨 UI/UX Features
- **Responsive Design** - Optimized for desktop, tablet, and mobile devices
- **Framer Motion Animations** - Smooth, engaging animations throughout the application
- **Modern UI Components** - Built with Radix UI and Tailwind CSS
- **Dark/Light Theme Support** - Automatic theme switching based on user preference
- **Interactive Charts** - Real-time data visualization with Recharts

### 🔐 Authentication & Security
- **Firebase Authentication** - Secure email/password and Google OAuth login
- **Protected Routes** - Role-based access control
- **Firestore Security Rules** - User-specific data isolation
- **Session Management** - Persistent login with remember me functionality

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI
- **Animations**: Framer Motion
- **3D Graphics**: Three.js
- **Charts**: Recharts
- **Maps**: React Leaflet

### Backend & Database
- **Authentication**: Firebase Auth
- **Database**: Firebase Firestore
- **Real-time Database**: Firebase Realtime Database
- **File Storage**: Firebase Storage
- **Analytics**: Firebase Analytics

### External APIs
- **Google Fit API** - Health and fitness data integration
- **Geolocation API** - Location tracking services

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm, yarn, or pnpm
- Firebase project with enabled services
- Google Cloud Console project (for Google Fit API)

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd Web\ App
```

2. **Install dependencies**
```bash
npm install
# or
yarn install
# or
pnpm install
```

3. **Environment Setup**
Create a `.env.local` file in the root directory:
```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://your_project.firebaseio.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id

# Google APIs
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_key
```

4. **Firebase Setup**
   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com)
   - Enable Authentication (Email/Password and Google)
   - Enable Firestore Database
   - Enable Realtime Database
   - Deploy the Firestore security rules from `firestore.rules`

5. **Google Fit API Setup**
   - Enable Google Fit API in Google Cloud Console
   - Configure OAuth consent screen
   - Add authorized domains

6. **Run the development server**
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 📱 Application Structure

### Pages & Routes
```
/                    # Landing page with authentication
/dashboard          # Main health dashboard
/reports            # Health reports and analytics
/alerts             # Medicine alerts and scheduling
/location           # Live location tracking
/login              # Login page
/signup             # Registration page
```

### Key Components
- **Dashboard** - Real-time health metrics with 3D heart animation
- **Health Reports** - Comprehensive health data analysis and PDF generation
- **Medicine Alerts** - Smart medication scheduling and reminders
- **Live Location** - Real-time GPS tracking with map visualization
- **3D Heart** - Interactive Three.js heart animation with realistic beating
- **Navigation Sidebar** - Responsive navigation with user profile

## 🎯 Core Features Detailed

### 🫀 3D Heart Animation
- **Realistic Beating Pattern** - Lub-dub heartbeat simulation
- **Heart Rate Synchronization** - Animation speed matches actual BPM
- **Dynamic Lighting** - Pulsing glow effects and rim lighting
- **Interactive Controls** - Hover effects and smooth transitions
- **Real-time Updates** - Responds to live heart rate data

### 📊 Health Dashboard
- **Real-time Metrics** - Live heart rate, steps, and activity tracking
- **Interactive Charts** - Historical data visualization with Recharts
- **Google Fit Integration** - Automatic data sync from Google Fit
- **Status Indicators** - Health status badges and alerts
- **Medicine Schedule** - Daily medication tracking and reminders

### 💊 Medicine Management
- **Smart Scheduling** - Flexible medication timing with custom intervals
- **Visual Indicators** - Color-coded status for taken, missed, and upcoming doses
- **Alert System** - Browser notifications and visual reminders
- **History Tracking** - Complete medication adherence history
- **Firestore Integration** - Cloud-synced data across devices

### 📍 Location Tracking
- **Real-time GPS** - Live location updates with high accuracy
- **Interactive Maps** - Leaflet-powered maps with custom markers
- **Location History** - Track movement patterns and visited locations
- **Privacy Controls** - User-controlled location sharing settings
- **Emergency Features** - Quick location sharing for emergencies

### 📈 Health Reports
- **Comprehensive Analytics** - Detailed health metrics analysis
- **PDF Generation** - Professional health reports with charts
- **Data Export** - Export health data in multiple formats
- **Trend Analysis** - Long-term health pattern recognition
- **Custom Date Ranges** - Flexible reporting periods

## 🔧 Development

### Project Structure
```
Web App/
├── app/                    # Next.js App Router pages
│   ├── (dashboard)/       # Dashboard layout group
│   ├── login/            # Authentication pages
│   ├── signup/
│   └── globals.css       # Global styles
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   ├── dashboard.tsx     # Main dashboard
│   ├── heart-3d.tsx      # 3D heart component
│   └── ...               # Other feature components
├── lib/                  # Utility libraries
│   ├── firebase.ts       # Firebase configuration
│   ├── utils.ts          # Helper functions
│   └── pdf-generator.ts  # PDF generation utilities
├── hooks/                # Custom React hooks
├── public/               # Static assets
└── styles/               # Additional stylesheets
```

### Available Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Code Style & Standards
- **TypeScript** - Strict type checking enabled
- **ESLint** - Code linting and formatting
- **Prettier** - Code formatting (recommended)
- **Component Structure** - Functional components with hooks
- **File Naming** - kebab-case for files, PascalCase for components

## 🚀 Deployment

### Vercel (Recommended)
1. **Connect Repository**
   - Import project to Vercel
   - Connect your Git repository

2. **Environment Variables**
   - Add all environment variables from `.env.local`
   - Configure Firebase and Google API keys

3. **Build Settings**
   - Framework: Next.js
   - Build Command: `npm run build`
   - Output Directory: `.next`

4. **Deploy**
   - Automatic deployments on git push
   - Preview deployments for pull requests

### Firebase Hosting
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
npm run build
firebase deploy
```

### Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 🔒 Security & Privacy

### Data Protection
- **User Data Isolation** - Firestore security rules ensure user-specific data access
- **Authentication Required** - All health data requires user authentication
- **HTTPS Only** - All communications encrypted in transit
- **No Sensitive Data Logging** - Health information excluded from logs

### Privacy Features
- **Location Control** - Users can disable location tracking
- **Data Export** - Users can export their data
- **Account Deletion** - Complete data removal on account deletion
- **Minimal Data Collection** - Only necessary health metrics collected

## 🤝 Contributing

### Getting Started
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests and linting
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed
- Ensure responsive design compatibility

### Code Review Process
- All changes require pull request review
- Automated tests must pass
- Code style checks must pass
- Security review for sensitive changes

## 📋 API Documentation

### Firebase Collections
```typescript
// User document structure
users/{userId} {
  uid: string
  email: string
  profile: UserProfile
  preferences: UserPreferences
  createdAt: timestamp
  lastLoginAt: timestamp
}

// Medicine alerts subcollection
users/{userId}/medicine_alerts/{alertId} {
  medicineName: string
  dosage: string
  frequency: string
  times: string[]
  startDate: timestamp
  endDate?: timestamp
  isActive: boolean
}

// Medicine schedules subcollection
users/{userId}/medicine_schedules/{scheduleId} {
  date: string
  medicines: MedicineSchedule[]
  completedCount: number
  totalCount: number
}
```

### Google Fit API Integration
- **Scopes Required**: `fitness.heart_rate.read`, `fitness.activity.read`
- **Data Types**: Heart rate, step count, activity sessions
- **Update Frequency**: Real-time when available, fallback to periodic sync

## 🐛 Troubleshooting

### Common Issues

**Firebase Connection Issues**
```bash
# Check Firebase configuration
npm run build
# Verify environment variables are set correctly
```

**Google Fit API Errors**
- Ensure OAuth consent screen is configured
- Verify API is enabled in Google Cloud Console
- Check scopes in authentication request

**3D Heart Animation Performance**
- Reduce animation complexity on low-end devices
- Check WebGL support in browser
- Monitor memory usage with Three.js

**Location Tracking Issues**
- Verify HTTPS is enabled (required for geolocation)
- Check browser permissions
- Ensure location services are enabled

## 📊 Performance Optimization

### Bundle Size Optimization
- **Dynamic Imports** - Lazy load heavy components
- **Tree Shaking** - Remove unused code
- **Image Optimization** - Next.js automatic image optimization
- **Code Splitting** - Route-based code splitting

### Runtime Performance
- **React.memo** - Prevent unnecessary re-renders
- **useMemo/useCallback** - Optimize expensive calculations
- **Virtual Scrolling** - Handle large data lists efficiently
- **Service Worker** - Cache static assets

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Team

**Team Deepship**
- Health monitoring application development
- 3D visualization and animation
- Firebase integration and security
- UI/UX design and implementation

## 🙏 Acknowledgments

- **Next.js Team** - Amazing React framework
- **Firebase Team** - Comprehensive backend services
- **Three.js Community** - 3D graphics library
- **Framer Motion** - Smooth animations
- **Radix UI** - Accessible UI components
- **Tailwind CSS** - Utility-first CSS framework

## 📞 Support

For support and questions:
- Create an issue in the repository
- Check existing documentation
- Review troubleshooting guide
- Contact the development team

---

**Built with ❤️ by Team Deepship**
