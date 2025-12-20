# 🌍 BookOnce - Complete Travel Booking Platform

> Revolutionizing travel planning with AI-powered, personalized journeys from your doorstep to destination and back.

## ✨ NEW: Interactive Journey Planner with Leaflet Maps!

**Complete door-to-door journey planning with integrated maps:**
- 🗺️ **Interactive Maps** - Leaflet + OpenStreetMap (free!)
- 📍 **Auto-Geocoding** - Converts city names to coordinates automatically
- 🛣️ **Route Visualization** - See your route with turn-by-turn directions
- ☁️ **Weather Forecast** - Open-Meteo (unlimited, free!)
- 🚗 **Multi-Modal Transport** - Walk, metro, flight, bus integration

**Map automatically appears when you plan a journey - no extra steps needed!**

**100% Free APIs - No credit card. No API keys. Just clone and run!**

See [MAP_INTEGRATION_COMPLETE.md](./MAP_INTEGRATION_COMPLETE.md) for details.

---

## 🎯 Vision

BookOnce is your complete travel booking platform. We're building an **intelligent travel companion** that helps you book your perfect journey in one place, with AI-powered planning, comprehensive booking options, and seamless travel experiences.

---

## 🚀 Core Innovation: Intent-Based Travel Planning

### Two Primary Travel Modes

#### 1️⃣ **Urgent Travel** ⚡
*When time is critical and efficiency is paramount*

**For First-Time Visitors:**
- **AI-Powered Fastest Route Planning**: Door-to-door optimization considering all transport modes (walk, metro, bus, train, flight)
- **Smart Layover Management**: Automatic booking of strategic rest stops and meals
- **Real-Time Route Optimization**: Dynamic rerouting based on traffic, delays, and disruptions
- **Essential Services Only**: Focus on speed with minimal but necessary comfort (quick meals, transit hotels)
- **Emergency Support**: 24/7 local assistance and crisis management

**For Returning Visitors:**
- **Saved Route Templates**: Reuse your proven fastest routes
- **Community Route Sharing**: Access routes saved by other users for the same destination
- **One-Click Rebooking**: Instant booking of previously used services
- **Route Improvement Suggestions**: AI learns from your feedback to optimize future trips

---

#### 2️⃣ **Leisure/Exploration Travel** 🎒
*When the journey is as important as the destination*

**For First-Time Visitors:**

**Option A: Popular Destinations** 🌟
- Curated itineraries for trending locations
- Balanced mix of must-see attractions and local experiences
- Optimized for comfort and comprehensive exploration
- Social proof through community ratings and reviews

**Option B: Hidden Gems & Cultural Heritage** 💎
- **Endangered Places Initiative**: Support culturally significant but lesser-known destinations
- **Sustainable Tourism**: Help preserve heritage sites through responsible travel
- **Authentic Experiences**: Connect with local communities and traditions
- **Off-the-Beaten-Path Adventures**: Discover places before they become mainstream

**Comprehensive Planning Includes:**
- Door-to-door route with scenic options
- Accommodation booking (hotels, homestays, unique stays)
- Restaurant reservations and food recommendations
- Local events and festivals
- Cultural workshops and experiences
- Guided tours and self-exploration options
- Photography spots and timing recommendations
- Shopping and souvenir guidance

**For Returning Visitors:**
- **Review & Contribute**: Share your experiences to help future travelers
- **Personalized Recommendations**: Based on your previous preferences
- **Loyalty Benefits**: Discounts at previously visited places
- **Route Customization**: Modify saved routes with new discoveries

---

## 🛡️ Safety & Trust Ecosystem

### Real-Time Safety Features

**1. Live Situation Monitoring**
- Natural disaster alerts (floods, earthquakes, storms)
- Political unrest and safety advisories
- Road closures and transport disruptions
- Health alerts and medical facility locations
- Crime hotspot avoidance

**2. Interactive Safety Heatmap** 🗺️
- **User-Generated Content**: Travelers geotag photos, videos, audio, and reviews
- **Real-Time Verification**: Community validates safety information
- **Visual Trust Indicators**: Color-coded safety zones
- **Incident Reporting**: Instant alerts for emerging situations
- **Historical Data**: Safety trends over time

### Local Support Network

**3. On-Ground Assistance**
- **Local Guides**: Verified community members for help
- **Translation Services**: Real-time language support
- **Bargaining Assistance**: Fair price guidance for local markets
- **Emergency Contacts**: Quick access to police, hospitals, embassies
- **Cultural Etiquette Guidance**: Avoid unintentional offenses

**4. Trust Building Mechanisms**
- Verified user profiles with travel history
- Community reputation scores
- Photo/video proof of experiences
- Moderated review system
- Dispute resolution support

---

## 🎨 Key Features & Capabilities

### 🤖 AI-Powered Intelligence
- **Vagabond AI Assistant**: 24/7 conversational travel companion
- **Predictive Planning**: Anticipates needs based on travel patterns
- **Dynamic Optimization**: Adjusts plans based on real-time conditions
- **Personalization Engine**: Learns preferences over time

### 🗺️ Comprehensive Route Planning
- **Multi-Modal Transport**: Seamless integration of walk, metro, bus, train, flight, taxi
- **Door-to-Door Navigation**: From your home to destination entrance
- **Layover Optimization**: Strategic stops for rest, meals, and exploration
- **Accessibility Options**: Routes for travelers with special needs

### 🏨 End-to-End Booking
- Hotels, hostels, homestays, unique accommodations
- Flights, trains, buses, car rentals
- Restaurant reservations
- Event tickets and experiences
- Travel insurance

### 📱 Smart Travel Tools
- **Offline Maps**: Navigate without internet
- **Currency Converter**: Real-time exchange rates
- **Expense Tracker**: Budget management
- **Itinerary Manager**: All bookings in one place
- **Travel Journal**: Document your journey

### 🌐 Community Features
- **Route Sharing**: Save and share successful itineraries
- **Travel Stories**: Inspire others with your experiences
- **Q&A Forums**: Get advice from experienced travelers
- **Meetup Coordination**: Connect with fellow travelers
- **Local Insights**: Tips from residents

---

## 🏗️ Complete Technical Stack

### 🎨 Frontend Technologies

#### Core Framework
- **React 18.3.1** - Modern UI library with hooks and concurrent features
- **TypeScript 5.8.3** - Type-safe development
- **Vite 5.4.19** - Lightning-fast build tool and dev server
- **React Router DOM 6.30.1** - Client-side routing

#### UI & Styling
- **TailwindCSS 3.4.17** - Utility-first CSS framework
- **shadcn/ui** - High-quality, accessible component library
  - Radix UI primitives (40+ components)
  - Alert Dialog, Dialog, Dropdown, Select, Toast, etc.
- **Framer Motion 11.18.2** - Production-ready animations
- **Lucide React 0.462.0** - Beautiful, consistent icons
- **class-variance-authority** - Component variant management
- **tailwind-merge** - Intelligent class merging
- **tailwindcss-animate** - Animation utilities

#### State Management
- **Zustand 5.0.9** - Lightweight, fast state management
- **TanStack Query 5.83.0** - Server state management, caching
- **React Hook Form 7.61.1** - Performant form handling
- **Zod 3.25.76** - Schema validation

#### Maps & Geolocation
- **Leaflet 1.9.4** - Open-source interactive maps
- **React-Leaflet 4.2.1** - React components for Leaflet
- **@types/leaflet** - TypeScript definitions
- **OpenStreetMap** - Free map tiles (no API key needed)
- **Nominatim** - Free geocoding service

#### 3D & Visualization
- **Three.js 0.181.2** - 3D graphics library
- **Postprocessing 6.38.0** - Post-processing effects
- **Recharts 2.15.4** - Composable charting library

#### AI & Intelligence
- **Google Generative AI SDK 0.24.1** - Gemini AI integration
- **Custom AI Service Layer** - Intelligent travel planning

#### Payment Processing
- **Stripe React 5.4.1** - Payment UI components
- **Stripe.js 8.5.3** - Secure payment handling

#### Utilities & Tools
- **date-fns 3.6.0** - Modern date utility library
- **canvas-confetti 1.9.4** - Celebration animations
- **ics 3.8.1** - Calendar event generation
- **qrcode.react 4.2.0** - QR code generation
- **input-otp 1.4.2** - OTP input component
- **cmdk 1.1.1** - Command menu component
- **embla-carousel-react 8.6.0** - Carousel component
- **react-day-picker 8.10.1** - Date picker
- **react-resizable-panels 2.1.9** - Resizable layouts
- **vaul 0.9.9** - Drawer component
- **sonner 1.7.4** - Toast notifications
- **next-themes 0.3.0** - Theme management

---

### 🤖 AI & Machine Learning Stack

#### Current Implementation
- **Google Gemini 1.5 Flash** (Free tier)
  - Conversational AI assistant
  - Natural language understanding
  - Context-aware responses
  - Multi-turn conversations

#### Future ML Models (Open Source & Free)

**1. Route Optimization Engine**
- **TensorFlow.js** - Browser-based ML
- **ONNX Runtime Web** - Cross-platform ML inference
- **Custom Route Prediction Model**:
  - Input: Origin, destination, time, user preferences
  - Output: Optimal multi-modal route
  - Training: Historical route data, traffic patterns
  - Algorithm: Reinforcement Learning (Q-Learning/DQN)

**2. Travel Time Prediction**
- **Prophet (Facebook)** - Time series forecasting
- **scikit-learn** - Classical ML algorithms
- Features: Historical travel times, weather, events, holidays
- Model: Gradient Boosting / Random Forest

**3. Recommendation System**
- **TensorFlow Recommenders** - Collaborative filtering
- **Surprise Library** - Recommendation algorithms
- Features: User preferences, past bookings, ratings
- Model: Matrix Factorization / Neural Collaborative Filtering

**4. Image Recognition (Safety Heatmap)**
- **TensorFlow.js MobileNet** - Pre-trained image classification
- **COCO-SSD** - Object detection
- Use: Verify user-uploaded photos, detect landmarks
- Runs in browser - no server needed

**5. Sentiment Analysis (Reviews)**
- **Hugging Face Transformers.js** - Browser-based NLP
- **BERT-tiny** - Lightweight sentiment model
- Analyze review sentiment in real-time
- Detect fake/spam reviews

**6. Language Translation**
- **Hugging Face Translation Models** - Free API
- **LibreTranslate** - Open-source translation API
- **Google Translate API** (Free tier: 500K chars/month)
- Offline: Pre-downloaded phrase books

**7. Price Prediction**
- **XGBoost** - Gradient boosting
- **LightGBM** - Fast gradient boosting
- Predict flight/hotel price trends
- Suggest best booking time

---

### 🗺️ Mapping & Routing APIs (Free/Open Source)

#### Map Providers
- **OpenStreetMap** - Free, community-driven maps
- **Mapbox GL JS** (Free tier: 50K loads/month)
- **Leaflet** - Open-source map library

#### Routing Services
- **OSRM (Open Source Routing Machine)** - Free routing
  - Car, bike, foot routing
  - Self-hostable
  - No API limits
- **GraphHopper** - Open-source routing engine
  - Multi-modal routing
  - Free tier: 500 requests/day
- **OpenRouteService** - Free routing API
  - Walking, driving, cycling
  - Free tier: 2000 requests/day
- **Valhalla** - Open-source routing engine
  - Multi-modal routing
  - Self-hostable

#### Geocoding
- **Nominatim** - Free geocoding (OpenStreetMap)
- **Photon** - Open-source geocoder
- **Pelias** - Open-source geocoding

#### Transit Data
- **GTFS (General Transit Feed Specification)** - Open transit data
- **Transitland** - Open transit data aggregator
- **OpenTripPlanner** - Open-source trip planner

---

### 🌐 Backend & APIs (Free/Open Source)

#### Backend Framework (Future)
- **Node.js + Express** - JavaScript backend
- **FastAPI (Python)** - High-performance API
- **Supabase** - Open-source Firebase alternative
  - PostgreSQL database
  - Authentication
  - Real-time subscriptions
  - Storage
  - Free tier: 500MB database, 1GB storage

#### Database
- **PostgreSQL** - Open-source relational database
- **Redis** - In-memory caching
- **MongoDB** - Document database (free tier)

#### Authentication
- **Supabase Auth** - Free authentication
- **Auth.js (NextAuth)** - Open-source auth
- **Passport.js** - Authentication middleware

#### Real-Time Features
- **Socket.io** - Real-time bidirectional communication
- **Supabase Realtime** - Real-time database changes
- **WebSockets** - Native browser support

#### File Storage
- **Supabase Storage** - Free object storage
- **MinIO** - Open-source S3-compatible storage
- **Cloudinary** (Free tier: 25GB storage)

---

### 📊 Data & Analytics (Free)

#### Analytics
- **Plausible Analytics** - Privacy-friendly, open-source
- **Umami** - Simple, open-source analytics
- **Matomo** - Open-source Google Analytics alternative

#### Monitoring
- **Sentry** (Free tier) - Error tracking
- **LogRocket** (Free tier) - Session replay
- **Grafana** - Open-source monitoring dashboards

#### Performance
- **Lighthouse** - Google's performance tool
- **Web Vitals** - Core web vitals tracking
- **Bundle Analyzer** - Analyze bundle size

---

### 🔒 Security & Privacy

#### Security Tools
- **Helmet.js** - Secure HTTP headers
- **bcrypt** - Password hashing
- **jsonwebtoken** - JWT authentication
- **rate-limiter-flexible** - Rate limiting
- **DOMPurify** - XSS protection

#### Privacy Compliance
- **GDPR compliance** - Data protection
- **Cookie consent** - User consent management
- **Data encryption** - At rest and in transit

---

### 🧪 Testing & Quality

#### Testing Frameworks
- **Vitest 4.0.15** - Fast unit testing
- **Testing Library 16.3.0** - Component testing
- **Jest DOM 6.9.1** - DOM matchers
- **User Event 14.6.1** - User interaction simulation
- **Playwright** (Future) - E2E testing

#### Code Quality
- **ESLint 9.32.0** - Linting
- **TypeScript** - Type checking
- **Prettier** - Code formatting
- **Husky** - Git hooks

---

### 🚀 DevOps & Deployment (Free Tiers)

#### Hosting
- **Vercel** - Free for personal projects
- **Netlify** - Free tier with CI/CD
- **GitHub Pages** - Free static hosting
- **Railway** - Free tier for backend

#### CI/CD
- **GitHub Actions** - Free for public repos
- **GitLab CI** - Free tier available

#### CDN
- **Cloudflare** - Free CDN and DDoS protection
- **jsDelivr** - Free CDN for npm packages

---

### 📱 Mobile & PWA

#### Progressive Web App
- **Workbox** - Service worker library
- **Web App Manifest** - PWA configuration
- **Push Notifications** - Web Push API
- **Offline Support** - Service workers + IndexedDB

#### Mobile Features
- **Geolocation API** - Native browser API
- **Camera API** - Photo/video capture
- **Share API** - Native sharing
- **Install Prompt** - Add to home screen

---

### 🌍 Internationalization

#### i18n Libraries
- **react-i18next** - React internationalization
- **i18next** - Translation framework
- **date-fns locales** - Date formatting

#### Translation Services
- **Hugging Face Translation** - Free ML translation
- **LibreTranslate** - Open-source translation
- **Google Translate API** (Free tier)

---

### 🎯 Third-Party Integrations (Free Tiers)

#### Weather Data
- **OpenWeatherMap** (Free: 1000 calls/day)
- **WeatherAPI** (Free: 1M calls/month)

#### Events & Activities
- **Eventbrite API** (Free)
- **Meetup API** (Free)
- **PredictHQ** (Free tier)

#### Flight Data
- **Aviationstack** (Free: 100 requests/month)
- **OpenSky Network** (Free, open data)

#### Hotel Data
- **Booking.com API** (Affiliate program)
- **Amadeus API** (Free tier: 2000 calls/month)

#### Currency Exchange
- **ExchangeRate-API** (Free: 1500 requests/month)
- **Fixer.io** (Free tier available)

#### SMS/Notifications
- **Twilio** (Free trial credits)
- **Firebase Cloud Messaging** (Free)
- **OneSignal** (Free push notifications)

---

### 🛠️ Development Tools

#### Package Management
- **npm** - Node package manager
- **pnpm** - Fast, disk-efficient package manager

#### Version Control
- **Git** - Version control
- **GitHub** - Code hosting

#### API Development
- **Postman** - API testing
- **Insomnia** - API client
- **Swagger/OpenAPI** - API documentation

#### Design Tools
- **Figma** (Free tier) - UI/UX design
- **Excalidraw** - Diagrams and wireframes

---

### 📦 Current Dependencies (package.json)

```json
{
  "dependencies": {
    "@google/generative-ai": "^0.24.1",
    "@hookform/resolvers": "^3.10.0",
    "@radix-ui/*": "Latest versions",
    "@stripe/react-stripe-js": "^5.4.1",
    "@tanstack/react-query": "^5.83.0",
    "framer-motion": "^11.18.2",
    "leaflet": "^1.9.4",
    "react": "^18.3.1",
    "react-router-dom": "^6.30.1",
    "three": "^0.181.2",
    "zustand": "^5.0.9",
    "zod": "^3.25.76"
  }
}
```

---

### ✅ Currently Implemented Features

#### 🎨 UI/UX Components
✅ **Hero Section** - Engaging landing page with animations
✅ **Enhanced Hero** - Advanced hero with 3D effects
✅ **Hyperspeed Animation** - Futuristic travel visualization
✅ **Navigation Bar** - Responsive navbar with theme toggle
✅ **Hotel Cards & Grid** - Beautiful hotel display components
✅ **Map View** - Interactive Leaflet maps with OpenStreetMap
✅ **Journey Search Card** - Smart search interface
✅ **Safety Mesh** - Safety visualization component
✅ **Time Zone Converter** - Multi-timezone support
✅ **Utility Widgets** - Travel utility tools
✅ **Vanishing Destinations** - Endangered places showcase
✅ **Vibe Sidebar** - Contextual information panel
✅ **Echo Modal** - User feedback system
✅ **Floating Controls** - Quick access controls

#### 🤖 AI & Intelligence
✅ **BookOnce AI Chat Assistant** - AI-powered conversational travel assistant
✅ **AI Journey Planner** - Intelligent route planning service
✅ **Chat Store** - Zustand-based chat state management
✅ **Context-Aware Responses** - Personalized AI interactions

#### 🏨 Booking System
✅ **Complete Booking Flow** - Multi-step booking process
✅ **Date Selector** - Calendar-based date picking
✅ **Room Selector** - Room type and quantity selection
✅ **Guest Info Form** - Comprehensive guest details
✅ **Pricing Summary** - Real-time price calculation
✅ **Payment Integration** - Stripe payment processing
✅ **Payment Form** - Secure payment UI
✅ **Saved Payment Methods** - Store payment info
✅ **Booking Confirmation** - Confirmation page with details
✅ **Booking History** - View past bookings
✅ **Booking Details** - Detailed booking information
✅ **Modify Booking** - Edit existing bookings
✅ **Cancel Booking** - Cancellation with refund logic
✅ **Booking Card** - Booking display component

#### 👤 User Management
✅ **Authentication System** - Login/signup with AuthContext
✅ **User Profile** - Profile management page
✅ **Protected Routes** - Route-level authentication
✅ **Create Account Dialog** - Registration modal

#### 🔒 Security & Performance
✅ **Input Sanitization** - XSS protection
✅ **Rate Limiting** - API abuse prevention
✅ **Payment Security** - PCI-compliant handling
✅ **Biometric Auth** - Fingerprint/Face ID support
✅ **Error Handling** - Comprehensive error management
✅ **Error Logging Service** - Track and log errors
✅ **Performance Monitoring** - Track app performance
✅ **Analytics Service** - User behavior tracking
✅ **API Optimization** - Caching and optimization
✅ **Service Worker** - PWA and offline support
✅ **Image Optimization** - Lazy loading and compression

#### ♿ Accessibility
✅ **WCAG 2.1 Compliant** - Full accessibility support
✅ **Keyboard Navigation** - Complete keyboard support
✅ **Screen Reader Support** - Announcer utilities
✅ **Visual Accessibility** - High contrast, focus indicators
✅ **Accessibility CSS** - Custom accessible styles

#### 🎨 Design System
✅ **40+ Radix UI Components** - Accessible primitives
  - Accordion, Alert Dialog, Avatar, Checkbox
  - Dialog, Dropdown Menu, Hover Card, Label
  - Menubar, Navigation Menu, Popover, Progress
  - Radio Group, Scroll Area, Select, Separator
  - Slider, Switch, Tabs, Toast, Tooltip, Toggle
✅ **TailwindCSS** - Utility-first styling
✅ **Dark/Light Theme** - Theme switching with next-themes
✅ **Framer Motion** - Smooth animations
✅ **Responsive Design** - Mobile-first approach

#### 🧪 Testing
✅ **Unit Tests** - Component and service tests
✅ **Integration Tests** - Feature integration tests
✅ **E2E Tests** - End-to-end booking flow tests
✅ **Accessibility Tests** - A11y compliance tests
✅ **Vitest** - Fast unit testing
✅ **Testing Library** - React component testing
✅ **49+ Test Suites** - Comprehensive coverage

#### 📊 Data & State
✅ **Zustand Stores** - Global state management
  - Chat Store
  - Booking Store
  - Cache Store
✅ **TanStack Query** - Server state management
✅ **React Hook Form** - Form state management
✅ **Zod Validation** - Schema validation

#### 🗺️ Travel Features
✅ **Hotel Data** - Sample hotel database (JSON)
✅ **Vanishing Destinations** - Endangered places data
✅ **Context Alerts** - Real-time travel alerts
✅ **Heatspots** - Safety heatmap data
✅ **Echoes** - User feedback/reviews data

#### 🛠️ Developer Tools
✅ **TypeScript** - Full type safety
✅ **ESLint** - Code linting
✅ **Vite** - Fast development server
✅ **Hot Module Replacement** - Instant updates
✅ **Build Optimization** - Production builds

#### 📱 Progressive Web App
✅ **Service Worker** - Offline functionality
✅ **Installable** - Add to home screen
✅ **Responsive** - Works on all devices

---

### 🔮 Planned Features (Roadmap)

#### Phase 2: Intelligence & ML (Q1 2024)
- 🔄 TensorFlow.js route optimization
- 🔄 Real-time safety heatmap with ML
- 🔄 Sentiment analysis for reviews
- 🔄 Price prediction models
- 🔄 Image recognition for verification
- 🔄 OSRM self-hosted routing
- 🔄 Supabase backend integration
- 🔄 Socket.io real-time features

#### Phase 3: Advanced Features (Q2 2024)
- 📋 Multi-language support (i18next)
- 📋 Voice assistant (Web Speech API)
- 📋 AR navigation (WebXR)
- 📋 Video calls with local guides (WebRTC)
- 📋 Blockchain verified reviews
- 📋 Carbon footprint tracking

#### Phase 4: Scale & Innovation (Q3 2024)
- 📋 Custom ML models deployment
- 📋 Edge computing integration
- 📋 Advanced analytics dashboard
- 📋 Corporate travel solutions
- 📋 API marketplace

---

### 🔮 Future Tech Stack Additions

**Phase 2 (Q1 2024)**
- TensorFlow.js for route optimization
- Hugging Face Transformers.js for NLP
- OSRM for self-hosted routing
- Supabase for backend
- Socket.io for real-time features

**Phase 3 (Q2 2024)**
- Custom ML models for price prediction
- Image recognition for safety verification
- Sentiment analysis for reviews
- WebRTC for video calls with local guides

**Phase 4 (Q3 2024)**
- AR navigation (WebXR API)
- Voice assistant (Web Speech API)
- Blockchain for verified reviews (Ethereum/Polygon)
- Edge computing for faster responses

---

## 📁 Project Structure

```
bookonce/
├── src/
│   ├── components/          # React components
│   │   ├── chat/           # Chat-related components
│   │   ├── ui/             # shadcn/ui components
│   │   ├── Hero.tsx        # Landing hero section
│   │   ├── HeroEnhanced.tsx # Advanced hero with 3D
│   │   ├── Hyperspeed.tsx  # Travel animation
│   │   ├── Navbar.tsx      # Navigation bar
│   │   ├── HotelCard.tsx   # Hotel display
│   │   ├── MapView.tsx     # Interactive maps
│   │   ├── SafetyMesh.tsx  # Safety visualization
│   │   ├── VagabonAIChatModal.tsx # AI chat interface
│   │   └── ...
│   │
│   ├── features/           # Feature modules
│   │   ├── booking/        # Booking system
│   │   │   ├── components/ # Booking UI components
│   │   │   ├── services/   # Booking services
│   │   │   ├── stores/     # Booking state
│   │   │   ├── utils/      # Booking utilities
│   │   │   └── hooks/      # Custom hooks
│   │   └── journey/        # Journey planning
│   │       └── services/   # AI journey planner
│   │
│   ├── pages/              # Route pages
│   │   ├── Index.tsx       # Home page
│   │   ├── BookingConfirmation.tsx
│   │   ├── BookingHistory.tsx
│   │   ├── UserProfile.tsx
│   │   └── TravelUtilities.tsx
│   │
│   ├── services/           # API services
│   │   └── GeminiAIService.ts # AI integration
│   │
│   ├── stores/             # Global state
│   │   └── chatStore.ts    # Chat state management
│   │
│   ├── contexts/           # React contexts
│   │   └── AuthContext.tsx # Authentication
│   │
│   ├── types/              # TypeScript types
│   │   ├── booking.ts
│   │   ├── chat.ts
│   │   └── journey.ts
│   │
│   ├── data/               # Static data
│   │   ├── hotels.json
│   │   ├── vanishing-destinations.json
│   │   ├── heatspots.json
│   │   └── context-alerts.json
│   │
│   ├── utils/              # Utility functions
│   │   ├── imageOptimization.ts
│   │   └── registerServiceWorker.ts
│   │
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Library utilities
│   ├── config/             # Configuration
│   └── __tests__/          # Test files
│
├── public/                 # Static assets
│   └── service-worker.js   # PWA service worker
│
├── docs/                   # Documentation
│   ├── README.md
│   ├── API_DOCUMENTATION.md
│   ├── USER_GUIDE.md
│   └── TROUBLESHOOTING.md
│
├── .kiro/                  # Kiro IDE specs
│   └── specs/              # Feature specifications
│       ├── vagabon-ai-assistant/
│       ├── booking-integration/
│       └── door-to-door-travel/
│
├── package.json            # Dependencies
├── tsconfig.json           # TypeScript config
├── vite.config.ts          # Vite configuration
├── tailwind.config.ts      # Tailwind configuration
└── .env                    # Environment variables
```

---

## 📊 Product Roadmap

### Phase 1: Foundation (Current)
- ✅ Core booking functionality
- ✅ AI assistant integration
- ✅ Basic route planning
- ✅ User authentication
- ✅ Payment processing

### Phase 2: Intelligence (Q1 2024)
- 🔄 Advanced AI route optimization
- 🔄 Real-time safety heatmap
- 🔄 Community review system
- 🔄 Local support network
- 🔄 Multi-language support

### Phase 3: Expansion (Q2 2024)
- 📋 Endangered places initiative
- 📋 AR navigation features
- 📋 Social travel features
- 📋 Loyalty program
- 📋 Corporate travel solutions

### Phase 4: Innovation (Q3 2024)
- 📋 VR destination previews
- 📋 Blockchain-based reviews
- 📋 Carbon footprint tracking
- 📋 Sustainable travel rewards
- 📋 AI travel companions (voice)

---

## 🎯 Competitive Advantages

### 1. **True Door-to-Door Planning**
Unlike competitors who focus on flights/hotels, we optimize the ENTIRE journey including local transport from your home.

### 2. **Intent-Based Personalization**
We don't just ask "where" - we understand "why" you're traveling and optimize accordingly.

### 3. **Safety-First Approach**
Real-time safety data with community verification, not just static travel advisories.

### 4. **Cultural Preservation**
Actively promoting endangered heritage sites and sustainable tourism.

### 5. **Community-Driven Trust**
User-generated content with verification creates authentic, reliable information.

### 6. **AI-Powered Optimization**
Continuous learning from millions of journeys to provide better recommendations.

---

## 💡 Use Cases

### Scenario 1: Emergency Business Trip
**User**: Software engineer needs to reach client site in 18 hours
**Solution**: 
- Fastest route: Home → Metro → Airport → Flight → Taxi → Hotel (near client)
- Strategic 4-hour rest at airport hotel
- Pre-booked meals at optimal times
- All bookings confirmed in 5 minutes

### Scenario 2: Family Cultural Vacation
**User**: Family of 4 wants authentic experience in Rajasthan
**Solution**:
- 7-day itinerary with mix of popular forts and hidden villages
- Homestay bookings with local families
- Cooking class and traditional craft workshop
- Camel safari in lesser-known desert area
- Support for local artisan community

### Scenario 3: Solo Backpacker Adventure
**User**: First-time traveler to Southeast Asia
**Solution**:
- Safety-verified hostels in each city
- Community meetup suggestions
- Real-time safety alerts
- Local guide connections
- Budget-optimized transport
- Hidden gem recommendations from other backpackers

---

## 📈 Market Opportunity

### Target Market
- **Primary**: 18-45 year old tech-savvy travelers
- **Secondary**: 45+ travelers seeking convenience
- **Tertiary**: Corporate travel managers

### Market Size
- Global online travel market: $800B+ (2024)
- Growing at 12% CAGR
- Mobile travel bookings: 60% of market
- AI travel assistants: Emerging category

### Revenue Streams
1. **Booking Commissions**: 10-15% from hotels, flights, experiences
2. **Premium Subscriptions**: Advanced features and priority support
3. **Local Business Partnerships**: Featured listings and promotions
4. **Corporate Solutions**: B2B travel management
5. **Data Insights**: Anonymized travel trends (privacy-compliant)

---

## 🌟 Social Impact

### Sustainable Tourism
- Promote off-season travel to reduce overtourism
- Support local economies in lesser-known areas
- Carbon footprint tracking and offset options
- Eco-friendly accommodation preferences

### Cultural Preservation
- Revenue sharing with heritage site maintenance
- Documentation of endangered cultural practices
- Support for local artisans and craftspeople
- Educational content about cultural significance

### Community Empowerment
- Local guide employment opportunities
- Fair pricing transparency
- Skills training for tourism workers
- Women-led tourism initiatives

---

## 🚀 Getting Started

### For Developers

```bash
# Clone the repository
git clone https://github.com/your-org/bookonce.git

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Add your API keys (Gemini, Stripe, Maps, etc.)

# Run development server
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

### For Users
1. Visit [bookonce.travel](https://bookonce.travel)
2. Sign up with email or social login
3. Choose your travel intent (Urgent or Leisure)
4. Enter your starting point and destination
5. Let our AI plan your perfect journey!

---

## 📍 Key Pages & Navigation

### Login Page
- **Location**: `src/pages/Auth.tsx`
- **Features**:
  - ✅ **Firebase Email/Password Authentication**
  - ✅ **Google OAuth Sign-In**
  - ✅ **Phone OTP Authentication**
  - ✅ **Email OTP Verification**
  - Password strength indicator
  - Session timeout (30 minutes)
  - Responsive design with animations
- **Access**: Navigate to `/auth` or click "Sign In" in the navbar
- **Firebase Integration**: Uses Firebase Authentication for secure user management

### Dashboard
- **Location**: `src/pages/Index.tsx` (Home/Dashboard)
- **Features**:
  - Hero section with journey planner
  - Interactive maps with Leaflet
  - Hotel search and browsing
  - AI chat assistant (Vagabon AI)
  - Travel utilities and tools
  - Safety heatmap visualization
  - Vanishing destinations showcase
- **Access**: Main landing page after login

### User Profile
- **Location**: `src/pages/UserProfile.tsx`
- **Features**:
  - Profile management
  - Saved preferences
  - Account settings
- **Access**: Click profile icon in navbar

### Booking History
- **Location**: `src/pages/BookingHistory.tsx`
- **Features**:
  - View past bookings
  - Modify existing bookings
  - Cancel bookings
  - Download confirmations
- **Access**: User menu → "My Bookings"

### Travel Utilities
- **Location**: `src/pages/TravelUtilities.tsx`
- **Features**:
  - Currency converter
  - Time zone converter
  - Expense tracker
  - Travel checklist
- **Access**: Main navigation menu

---

## 🔐 Authentication System

### Firebase Setup
BookOnce uses **Firebase Authentication** for secure user management:

**Firebase Configuration** (in `.env`):
```env
VITE_FIREBASE_API_KEY=AIzaSyA0jwCCRw-Sh8r6dX1ULDbQ5QhfUccmh_U
VITE_FIREBASE_AUTH_DOMAIN=book-once.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=book-once
VITE_FIREBASE_STORAGE_BUCKET=book-once.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=401504323538
VITE_FIREBASE_APP_ID=1:401504323538:web:c1c6e30bf1163d19116a0b
VITE_FIREBASE_MEASUREMENT_ID=G-XD47BPPMBL
```

### Authentication Methods

#### 1. Email/Password
- **File**: `src/auth/emailAuth.ts`
- **Service**: Firebase Authentication
- **Features**:
  - Secure password hashing
  - Email verification
  - Password reset support

#### 2. Google OAuth
- **File**: `src/auth/googleAuth.ts`
- **Service**: Firebase Google Provider
- **Features**:
  - One-click sign-in
  - Automatic profile creation
  - Secure token handling

#### 3. Phone OTP
- **File**: `src/auth/phoneAuth.ts`
- **Service**: Firebase Phone Authentication
- **Features**:
  - SMS-based verification
  - reCAPTCHA protection
  - 10-minute OTP expiry

#### 4. Email OTP
- **File**: `src/services/AuthService.ts`
- **Service**: Resend or Gmail
- **Features**:
  - 6-digit OTP codes
  - 15-minute expiry
  - Resend functionality

### Auth Context
- **Location**: `src/contexts/AuthContext.tsx`
- **Features**:
  - Global authentication state
  - Session management
  - Token refresh
  - 30-minute inactivity timeout
  - User profile management

### Protected Routes
- Implemented in main router
- Redirects unauthenticated users to `/auth`
- Preserves user session across page refreshes

---

## 🤝 Contributing

We welcome contributions from the community! Whether it's:
- 🐛 Bug reports
- 💡 Feature suggestions
- 📝 Documentation improvements
- 🌍 Translations
- 🎨 UI/UX enhancements

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

## 📞 Contact & Support

- **Website**: https://bookonce.travel
- **Email**: support@bookonce.travel
- **Twitter**: @BookOnceTravel
- **Discord**: Join our community
- **Blog**: blog.bookonce.travel

---

## 📄 License

This project is licensed under the MIT License - see [LICENSE.md](LICENSE.md) for details.

---

## 🙏 Acknowledgments

- Our amazing community of travelers and contributors
- Open-source projects that made this possible
- Local guides and cultural ambassadors worldwide
- Early adopters who believed in our vision

---

## 🎉 Join the Revolution

Travel is not just about reaching a destination - it's about the journey, the experiences, the people you meet, and the memories you create. 

**BookOnce makes booking your perfect journey simple, comprehensive, and unforgettable.**

Ready to book your next adventure? 

**[Start Your Journey →](https://bookonce.travel)**

---

*Made with ❤️ by travelers, for travelers*
