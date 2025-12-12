# Vagabond AI Navigator 🌍✨

An AI-powered travel companion that helps you discover destinations based on your vibe, energy levels, and budget preferences.

## 🎯 Overview

Vagabond AI Navigator is a modern, interactive travel platform that provides personalized hotel recommendations and destination insights. Built with React, TypeScript, and Framer Motion, it offers an immersive experience for travelers seeking unique accommodations.

## ✨ Key Features

### 🎚️ Vibe Control System
- **Energy Level Slider**: Adjust from chill (1) to adventure (10)
- **Social Preference**: Solo retreats to social hubs
- **Budget Control**: Backpacker to luxury experiences
- Real-time filtering based on your preferences

### 🗺️ Interactive Map View
- Visual representation of hotel locations
- Click-to-explore destination details
- Integrated with vibe settings

### 🏨 Smart Hotel Discovery
- Curated hotel recommendations
- Dynamic filtering based on vibe settings
- Detailed hotel cards with:
  - Pricing information
  - Amenities
  - Location details
  - Ratings and reviews

### 🌟 Special Features
- **Context Layer**: Real-time safety and local alerts
- **Echo Modal**: Travel tips and local insights
- **Vanishing Destinations**: Time-sensitive travel opportunities
- **Local Shadow Widget**: Hidden gems and local favorites
- **Safety Mesh**: Travel safety information
- **Utility Widgets**: Helpful travel tools

## 🛠️ Tech Stack

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **UI Components**: Radix UI primitives
- **Icons**: Lucide React
- **Routing**: React Router DOM

## 📁 Project Structure

```
vagabond-ai-navigator/
├── src/
│   ├── components/          # React components
│   │   ├── ui/             # Reusable UI components
│   │   ├── VibeSidebar.tsx # Vibe control panel
│   │   ├── MapView.tsx     # Interactive map
│   │   ├── HotelGrid.tsx   # Hotel listings
│   │   └── ...
│   ├── data/               # JSON data files
│   │   ├── hotels.json     # Hotel database
│   │   ├── echoes.json     # Travel insights
│   │   ├── context-alerts.json
│   │   └── vanishing-destinations.json
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utility functions
│   ├── pages/              # Page components
│   │   ├── Index.tsx       # Main page
│   │   └── NotFound.tsx    # 404 page
│   ├── App.tsx             # Main app component
│   └── main.tsx            # Entry point
├── public/                 # Static assets
└── package.json
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/vagabond-ai-navigator.git
cd vagabond-ai-navigator
```

2. **Install dependencies**
```bash
npm install
```

3. **Start development server**
```bash
npm run dev
```

4. **Build for production**
```bash
npm run build
```

5. **Preview production build**
```bash
npm run preview
```

## 🎨 Component Documentation

### VibeSidebar
Controls user preferences for hotel filtering:
- Energy level (1-10)
- Social preference (1-10)
- Budget range (1-10)

**Props:**
```typescript
{
  isOpen: boolean;
  onClose: () => void;
  energy: number;
  social: number;
  budget: number;
  onEnergyChange: (value: number[]) => void;
  onSocialChange: (value: number[]) => void;
  onBudgetChange: (value: number[]) => void;
}
```

### HotelGrid
Displays filtered hotel results based on vibe settings.

### MapView
Interactive map showing hotel locations and destinations.

### FloatingControls
Quick access buttons for vibe control and map toggle.

## 📊 Data Structure

### Hotels Data (`hotels.json`)
```json
{
  "id": "string",
  "name": "string",
  "location": "string",
  "price": "number",
  "rating": "number",
  "image": "string",
  "amenities": ["string"],
  "vibeScore": {
    "energy": "number",
    "social": "number",
    "budget": "number"
  }
}
```

### Echoes Data (`echoes.json`)
Travel tips and local insights

### Context Alerts (`context-alerts.json`)
Real-time safety and weather alerts

### Vanishing Destinations (`vanishing-destinations.json`)
Time-sensitive travel opportunities

## 🎯 Roadmap

### Upcoming Features
- [ ] AI-powered recommendation engine
- [ ] User authentication and profiles
- [ ] Booking integration
- [ ] Real-time chat support
- [ ] Social features (share trips, reviews)
- [ ] Mobile app version
- [ ] Multi-language support
- [ ] Currency conversion
- [ ] Flight integration
- [ ] Itinerary builder

### Improvements Needed
- [ ] Add close button visibility fix in VibeSidebar
- [ ] Implement backend API integration
- [ ] Add user authentication
- [ ] Enhance mobile responsiveness
- [ ] Add unit tests
- [ ] Implement caching strategy
- [ ] SEO optimization
- [ ] Accessibility improvements

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 Development Guidelines

### Code Style
- Use TypeScript for type safety
- Follow React best practices
- Use functional components with hooks
- Maintain component modularity
- Write self-documenting code

### Naming Conventions
- Components: PascalCase (e.g., `VibeSidebar.tsx`)
- Utilities: camelCase (e.g., `utils.ts`)
- Constants: UPPER_SNAKE_CASE

## 🐛 Known Issues

1. VibeSidebar close button hidden on desktop (lg:hidden class)
2. Map view needs performance optimization for large datasets
3. Mobile menu needs refinement

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Authors

- Your Name - Initial work

## 🙏 Acknowledgments

- Built with [Lovable](https://lovable.dev)
- UI components from [Radix UI](https://www.radix-ui.com/)
- Icons from [Lucide](https://lucide.dev/)
- Animations by [Framer Motion](https://www.framer.com/motion/)

## 📞 Support

For support, email support@vagabond-ai.com or open an issue in the repository.

## 🌐 Links

- [Live Demo](#)
- [Documentation](#)
- [API Reference](#)

---

Made with ❤️ for travelers around the world