Deployed Link:- https://vocal-eyes.vercel.app/

#VocalEyes – Empowering Vision Through AI

**VocalEyes** is an AI-powered accessibility platform designed to assist blind and visually impaired individuals. It features a powerful Android mobile application and a responsive WebApp for health monitoring and remote care.

---

## VocalEyes Android App

### Overview

VocalEyes leverages cutting-edge **computer vision**, **speech recognition**, and **AI assistants** to offer real-time support to visually impaired users. It's designed with a voice-first philosophy, enabling hands-free, seamless interaction.

### Core Mission

* Empower users through independence
* Enhance environmental awareness
* Simplify navigation and reading
* Provide an AI companion tailored to accessibility

---

### Architecture & Technologies

* **Platform**: Android (Kotlin, Jetpack Compose)
* **Pattern**: MVVM (Model-View-ViewModel)
* **Min SDK**: 24 (Android 7.0) | **Target SDK**: 34 (Android 14)

#### Core Tech Stack

* **Object Detection**: YOLOv8 with TensorFlow Lite
* **Text Recognition**: Google ML Kit OCR
* **AI Assistant**: Google Gemini AI
* **Voice Recognition**: Android SpeechRecognizer
* **Text-to-Speech**: Android TTS
* **Authentication**: Firebase Auth
* **Camera**: CameraX
---
### System Architecture
![Image](https://github.com/user-attachments/assets/20d1242f-c51b-4572-9bbf-a369f1d56015)
---
### Features

#### 🎤 Voice Recognition

* Global and context-specific voice commands
* Persistent listening with intelligent recovery
* Hands-free control of all app features

#### 📷 Object Detection

* 80+ object types with spatial awareness
* Real-time detection with voice feedback
* Pause/resume with voice command

#### Navigation Assistance

* Environmental description
* Obstacle and hazard detection
* Landmark recognition
* Step-by-step voice instructions

#### 📖 Text Extraction

* Multi-language OCR
* Document reading with sentence formatting
* Natural text-to-speech playback

#### Currency Detection

* Multiple currency support
* High-confidence denomination detection
* Instant voice announcements

#### AI Assistant

* Natural conversation interface
* Hands-free interaction using Google Gemini
* Context-aware responses
* Personalized experiences

#### Authentication

* Firebase-based login/signup
* Google Authentication
* Persistent sessions

---

### UI & Accessibility

* **Design Language**: Material 3 + Gradient Backgrounds
* **Accessibility First**: TalkBack, semantic labels, large touch targets
* **Voice-first**: Every action has spoken feedback

---

### Security & Privacy

* All AI and camera processing is **on-device**
* **No images stored** or uploaded
* **Encrypted storage** and **minimal data collection**
* Required Permissions: Camera, Microphone, Internet, Storage

---

### Accessibility Features

* TalkBack, screen reader, and semantic labeling
* Voice command shortcuts and feedback
* High contrast & large text modes
* Motion reduction options

---

### Planned Features

* Offline AI Assistant
* IoT & Smart Home Integration
* GPS-based outdoor navigation
* Social & community features
* Smartwatch & wearable compatibility

---

## VocalEyes WebApp

### Overview

The **WebApp** provides a dashboard for monitoring health data, issuing medicine alerts, viewing live location, and managing user reports. It's designed for caregivers, medical professionals, and guardians.

### 🛠 Tech Stack

* **Framework**: Next.js (React)
* **Styling**: TailwindCSS
* **Authentication**: Firebase Auth
* **Database**: Firebase Realtime Database
* **Real-time Location**: Geolocation + Firebase RTDB
* **3D Visualization**: Three.js (if applicable)

---

### WebApp Modules

#### Login & Signup

* Firebase Authentication
* Form validation and error handling
* Secure sessions and logout

#### Dashboard

* User profile display
* Overview of vital signs or activity
* Quick access to other modules

#### Medicine Alerts

* Daily/weekly medicine reminders
* Alert logs and update controls

#### Health Reports

* Graphs and charts of health metrics
* Exportable/downloadable reports
* Date-based filtering and summaries

#### Live Location

* Real-time map integration
* Location logs
* Voice feedback for events (planned)

---

### UI Design

* Clean, responsive interface
* Accessibility-conscious layout
* Navigation panel with tabbed modules
* Dashboard-first layout after login

---

### Folder Structure (WebApp)

```
WebApp/
│
├── components/       # Reusable UI components
├── pages/            # Next.js route-based pages
├── public/           # Static assets
├── firebase/         # Firebase configuration
├── styles/           # TailwindCSS or global styles
├── utils/            # Utility functions
├── app/              # Application layout
└── package.json      # Project config and dependencies
```

---

## Repository Structure

```
VocalEyes/
│
├── AndroidApp/       # Complete Kotlin-based app
├── WebApp/           # Web portal for caregivers
├── README.md         # Project overview
└── LICENSE           # Open-source license (if any)
```

---

## Target Audience

* **Blind/Visually Impaired Users**: For Android app usage
* **Caregivers/Family Members**: Via WebApp dashboard
* **Healthcare Providers**: For monitoring and support
* **Educational Institutions**: Accessibility training

---

## Impact

* Reduces dependency on others
* Enables confident navigation and self-help
* Bridges the digital accessibility gap
* Boosts quality of life through AI

---

## Contributing

Contributions, feedback, and feature suggestions are welcome!
Please create a pull request or open an issue.

---

## 📜 License

[MIT License](./LICENSE)

---

Let me know if you want the README in markdown file format or with images/logos for GitHub/website presentation.
