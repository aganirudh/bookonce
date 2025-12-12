# 🚀 Quick Start - TravelEase with Free APIs

## ⚡ 30-Second Setup

```bash
# 1. Clone the repo
git clone <your-repo>
cd travelease

# 2. Install dependencies
npm install

# 3. Run the app
npm run dev
```

**That's it!** The app works immediately with free APIs. No API keys needed.

## ✅ What Works Out of the Box

- ✅ Weather forecasts (Open-Meteo - unlimited)
- ✅ Location search (Nominatim - free)
- ✅ Geocoding (Nominatim - free)
- ✅ Route planning (OpenRouteService - 2000/day free)
- ✅ Travel recommendations
- ✅ Journey planning

## 🎯 Using the Services

### Weather Service

```typescript
import { weatherService } from '@/features/journey/services/WeatherService';

// Get current weather
const weather = await weatherService.getCurrentWeather(19.076, 72.8777);
console.log(`Temperature: ${weather.temp}°C`);
console.log(`Condition: ${weather.condition}`);

// Get 7-day forecast
const forecast = await weatherService.getForecast(19.076, 72.8777);
console.log(`Forecast: ${forecast.list.length} days`);

// Get recommendations
const recommendations = weatherService.getWeatherRecommendations(weather);
console.log(`Suitable for travel: ${recommendations.suitable}`);
```

### Geocoding Service

```typescript
import { freeGeocodingService } from '@/features/journey/services/FreeGeocodingService';

// Search for a location
const results = await freeGeocodingService.search('Mumbai, India');
console.log(`Found ${results.length} results`);
console.log(`First result: ${results[0].displayName}`);

// Reverse geocode
const location = await freeGeocodingService.reverseGeocode(19.076, 72.8777);
console.log(`Address: ${location.address}`);
```

### Cache Utility

```typescript
import { cacheStore } from '@/features/journey/utils/cache';

// Set a value with 30-minute TTL
cacheStore.set('my-key', { data: 'value' }, 30 * 60 * 1000);

// Get a value
const value = cacheStore.get('my-key');

// Clear cache
cacheStore.clear();
```

## 📊 API Limits

| Service | Rate Limit | Daily Limit | Cost |
|---------|-----------|-------------|------|
| Open-Meteo | None | Unlimited | Free |
| Nominatim | 1 req/sec | Unlimited | Free |
| OpenRouteService | 40 req/min | 2000 | Free |

**All limits are automatically handled by the services.**

## 🔧 Optional: Get OpenRouteService Key

If you need more than 2000 requests/day:

1. Go to https://openrouteservice.org/dev/#/signup
2. Sign up (free)
3. Get API key
4. Add to `.env`:
   ```
   VITE_OPENROUTE_API_KEY=your_key_here
   ```

This increases your limit to 2000 requests/day with 40 requests/minute.

## 🎨 Example: Complete Journey Planning

```typescript
import { weatherService } from '@/features/journey/services/WeatherService';
import { freeGeocodingService } from '@/features/journey/services/FreeGeocodingService';

async function planJourney(origin: string, destination: string) {
  // 1. Geocode locations
  const originResults = await freeGeocodingService.search(origin);
  const destResults = await freeGeocodingService.search(destination);
  
  const originCoords = originResults[0].coordinates;
  const destCoords = destResults[0].coordinates;
  
  // 2. Get weather for destination
  const weather = await weatherService.getCurrentWeather(
    destCoords.lat,
    destCoords.lng
  );
  
  // 3. Get recommendations
  const recommendations = weatherService.getWeatherRecommendations(weather);
  
  // 4. Display results
  console.log(`Journey from ${origin} to ${destination}`);
  console.log(`Weather: ${weather.temp}°C, ${weather.description}`);
  console.log(`Suitable: ${recommendations.suitable}`);
  console.log(`Suggestions: ${recommendations.suggestions.join(', ')}`);
}

// Use it
planJourney('Mumbai', 'Goa');
```

## 🐛 Troubleshooting

### "Failed to fetch"
- Check your internet connection
- Services might be temporarily down (rare)
- Check browser console for details

### "Rate limit exceeded" (Nominatim)
- Wait 1 second between requests
- Our service handles this automatically
- If you see this, there might be a bug

### Slow responses
- First request is always slower (no cache)
- Subsequent requests are fast (cached)
- Check your network speed

## 📚 Learn More

- [FREE_APIS_GUIDE.md](./FREE_APIS_GUIDE.md) - Complete API documentation
- [API_SETUP_SUMMARY.md](./API_SETUP_SUMMARY.md) - Architecture overview
- [IMPLEMENTATION_COMPLETE.md](./IMPLEMENTATION_COMPLETE.md) - Implementation details

## 🎉 You're Ready!

Start building your journey planning features. All the infrastructure is ready and working!

```bash
npm run dev
```

Happy coding! 🚀
