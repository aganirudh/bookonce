# OpenWeather API Setup Guide

This guide will help you set up OpenWeather API for weather-based recommendations in the TravelEase journey planner.

## Prerequisites

- An email address (for account creation)
- No credit card required - completely FREE for basic tier

## Step-by-Step Setup

### 1. Create OpenWeather Account

1. Go to [OpenWeather API](https://openweathermap.org/api)
2. Click "Sign Up" in the top right corner
3. Fill in your details:
   - Username
   - Email
   - Password
4. Agree to terms and conditions
5. Click "Create Account"
6. Verify your email address (check your inbox)

### 2. Get Your API Key

1. After email verification, log in to your account
2. Go to [API Keys page](https://home.openweathermap.org/api_keys)
3. You'll see a default API key already created
4. Copy the API key (it looks like: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`)

**Note**: It may take up to 2 hours for your API key to be activated, but usually it's instant.

### 3. Add API Key to Your Project

1. Open your `.env` file in the project root
2. Find the line with `VITE_OPENWEATHER_API_KEY`
3. Replace the placeholder with your actual API key:
   ```
   VITE_OPENWEATHER_API_KEY=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
   ```
4. Save the file

### 4. Verify Setup

After adding the API key, restart your development server:

```bash
npm run dev
```

The weather service should now be able to fetch real-time weather data.

## Free Tier Limits

OpenWeather offers a generous free tier:
- **1,000 API calls per day**
- **60 calls per minute**
- Current weather data
- 5-day forecast
- Historical data (limited)

### Typical Usage for TravelEase:
- Weather check per journey plan: 2 requests (source + destination)
- Weather-based recommendations: 1 request per location
- Cached for 30 minutes to reduce API calls

**Estimated daily usage for 100 users**: ~200-400 calls (well within free tier)

## Available APIs (Free Tier)

### Current Weather Data
- Real-time weather conditions
- Temperature, humidity, wind speed
- Weather description and icons
- Sunrise/sunset times

### 5-Day Forecast
- Weather forecast for next 5 days
- 3-hour intervals
- Temperature trends
- Precipitation probability

### Weather Icons
- Free weather icons provided by OpenWeather
- Automatically included in API responses

## API Endpoints Used

### Current Weather
```
https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={API_KEY}&units=metric
```

### 5-Day Forecast
```
https://api.openweathermap.org/data/2.5/forecast?lat={lat}&lon={lon}&appid={API_KEY}&units=metric
```

## Troubleshooting

### "Invalid API key"
- Make sure you've copied the entire API key
- Check for extra spaces or quotes in `.env`
- Wait up to 2 hours for new keys to activate
- Restart your development server

### "401 Unauthorized"
- Verify your API key is active in your OpenWeather dashboard
- Check that you're using the correct API key
- Make sure your account is verified (check email)

### Rate Limiting
- Free tier: 60 calls/minute, 1000 calls/day
- Implement caching (already built into WeatherService)
- Consider upgrading if you need more calls

### "City not found"
- Use latitude/longitude instead of city names (more accurate)
- Check that coordinates are valid (-90 to 90 for lat, -180 to 180 for lon)

## Best Practices

1. ✅ **Cache weather data** - Weather doesn't change every second (30-minute cache recommended)
2. ✅ **Use coordinates** - More accurate than city names
3. ✅ **Handle errors gracefully** - Show cached data or generic weather if API fails
4. ✅ **Monitor usage** - Check your dashboard regularly
5. ✅ **Use metric units** - Easier for international users (convert in UI if needed)

## Upgrading (Optional)

If you need more API calls:

### Startup Plan ($40/month)
- 100,000 calls/day
- 600 calls/minute
- Priority support

### Developer Plan ($125/month)
- 1,000,000 calls/day
- 3,000 calls/minute
- Historical data access

For most applications, the free tier is sufficient.

## Security Best Practices

1. ✅ **Never commit API keys to Git** - Use `.env` files (already in `.gitignore`)
2. ✅ **Use environment variables** - Keep keys separate from code
3. ✅ **Rotate keys periodically** - Change keys every 6 months
4. ✅ **Monitor usage** - Check for unusual activity in dashboard

## Additional Resources

- [OpenWeather API Documentation](https://openweathermap.org/api)
- [Weather Conditions Codes](https://openweathermap.org/weather-conditions)
- [API Response Examples](https://openweathermap.org/current#current_JSON)
- [FAQ](https://openweathermap.org/faq)

## Weather Icons

OpenWeather provides free weather icons:
```
https://openweathermap.org/img/wn/{icon_code}@2x.png
```

Icon codes are included in API responses (e.g., "01d" for clear sky day).

## Support

If you encounter issues:
1. Check the [OpenWeather FAQ](https://openweathermap.org/faq)
2. Review the [API Documentation](https://openweathermap.org/api)
3. Contact [OpenWeather Support](https://openweathermap.org/support)
4. Check [Stack Overflow](https://stackoverflow.com/questions/tagged/openweathermap)

## Example Response

```json
{
  "coord": { "lon": 72.85, "lat": 19.01 },
  "weather": [
    {
      "id": 800,
      "main": "Clear",
      "description": "clear sky",
      "icon": "01d"
    }
  ],
  "main": {
    "temp": 28.5,
    "feels_like": 30.2,
    "temp_min": 27.0,
    "temp_max": 30.0,
    "pressure": 1013,
    "humidity": 65
  },
  "wind": { "speed": 3.5, "deg": 180 },
  "clouds": { "all": 0 },
  "dt": 1702828800,
  "sys": {
    "country": "IN",
    "sunrise": 1702779600,
    "sunset": 1702820400
  },
  "timezone": 19800,
  "name": "Mumbai"
}
```
