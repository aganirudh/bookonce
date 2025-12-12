# Skyscanner API Integration Guide

## Overview
The application now integrates with Skyscanner's real-time flight search API to provide live flight data, pricing, and booking options instead of mock data.

## Setup Instructions

### Option 1: RapidAPI (Recommended for Development)

**Easiest and fastest way to get started!**

1. **Sign up for RapidAPI**
   - Go to: https://rapidapi.com/skyscanner/api/skyscanner80
   - Create a free account
   - Subscribe to the Skyscanner API (Free tier: 100 requests/month)

2. **Get your API Key**
   - After subscribing, you'll see your API key in the dashboard
   - Copy the `X-RapidAPI-Key` value

3. **Add to your project**
   ```bash
   # Create .env file in project root
   cp .env.example .env
   
   # Add your key
   VITE_RAPIDAPI_KEY=your_rapidapi_key_here
   ```

4. **Test the integration**
   - Restart your dev server
   - Click on any flight segment
   - You should see real-time flights!

### Option 2: Direct Skyscanner API (For Production)

**More complex but better for production use**

1. **Apply for Skyscanner API Access**
   - Go to: https://developers.skyscanner.net/
   - Fill out the application form
   - Wait for approval (can take a few days)

2. **Get your API Key**
   - Once approved, you'll receive your API credentials
   - Copy your API key

3. **Add to your project**
   ```bash
   # Add to .env file
   VITE_SKYSCANNER_API_KEY=your_skyscanner_api_key_here
   ```

## API Features

### Real-Time Flight Search
- Live pricing from multiple airlines
- Actual departure/arrival times
- Real stop information
- Direct booking links

### Supported Data
- ✅ Multiple airlines
- ✅ Real-time prices
- ✅ Flight schedules
- ✅ Stop information
- ✅ Carrier details
- ✅ Direct booking links
- ✅ Multiple passengers
- ✅ Cabin class selection

## How It Works

### 1. User Clicks Flight Segment
```typescript
<RouteSegment
  mode="Flight"
  isClickable={true}
  onClick={() => handleFlightClick(from, to, time, date)}
/>
```

### 2. API Call to Skyscanner
```typescript
const flights = await skyscannerService.searchFlights({
  originSkyId: 'BOM',        // Mumbai
  destinationSkyId: 'GOI',   // Goa
  originEntityId: '95673345',
  destinationEntityId: '95673537',
  date: '2024-12-15',
  cabinClass: 'economy',
  adults: 2,
  currency: 'INR',
  locale: 'en-IN',
  market: 'IN',
});
```

### 3. Display Real Results
```typescript
{flights.map(flight => (
  <FlightCard
    airline={flight.legs[0].carriers[0].name}
    departure={formatTime(flight.legs[0].departure)}
    arrival={formatTime(flight.legs[0].arrival)}
    price={flight.price.formatted}
    bookingUrl={flight.deepLink}
  />
))}
```

## Airport Codes

### Currently Supported Cities
```typescript
const airportCodes = {
  'Mumbai': { iata: 'BOM', entityId: '95673345' },
  'Goa': { iata: 'GOI', entityId: '95673537' },
  'Delhi': { iata: 'DEL', entityId: '95673627' },
  'Bangalore': { iata: 'BLR', entityId: '95673615' },
  'Chennai': { iata: 'MAA', entityId: '95673621' },
  'Kolkata': { iata: 'CCU', entityId: '95673619' },
  'Hyderabad': { iata: 'HYD', entityId: '95673623' },
  'Jaipur': { iata: 'JAI', entityId: '95673625' },
};
```

### Adding More Cities
To add more cities, you need:
1. **IATA Code**: 3-letter airport code (e.g., 'BOM' for Mumbai)
2. **Entity ID**: Skyscanner's internal ID for the airport

You can get these by using the autocomplete API:
```typescript
const places = await skyscannerService.searchPlaces('Mumbai');
// Returns: { id: '95673345', iata: 'BOM', name: 'Mumbai' }
```

## Error Handling

### Graceful Fallback
If the API fails, the system automatically falls back to mock data:

```typescript
try {
  const flights = await skyscannerService.searchFlights(query);
  setFlightOptions(flights);
} catch (error) {
  console.error('API Error:', error);
  // Fallback to mock data
  setFlightOptions(generateMockFlights(from, to));
}
```

### User-Friendly Error Messages
```
┌────────────────────────────────────────┐
│  ⚠️  Unable to fetch live flights      │
│                                        │
│  Error: No API key configured          │
│                                        │
│  💡 To enable real-time flights, add   │
│  your RapidAPI key to .env file.       │
│  Get a free key at: RapidAPI           │
└────────────────────────────────────────┘
```

## API Limits

### RapidAPI Free Tier
- **100 requests/month**
- **10 requests/day**
- Perfect for development and testing

### RapidAPI Pro Tier ($9.99/month)
- **500 requests/month**
- **50 requests/day**
- Better for small production apps

### Direct Skyscanner API
- **Custom limits** based on your agreement
- **Higher rate limits**
- **Better for production**

## Cost Optimization

### Caching Strategy
```typescript
// Cache results for 5 minutes
const cacheKey = `${from}-${to}-${date}`;
const cached = flightCache.get(cacheKey);

if (cached && Date.now() - cached.timestamp < 5 * 60 * 1000) {
  return cached.data;
}

const flights = await skyscannerService.searchFlights(query);
flightCache.set(cacheKey, { data: flights, timestamp: Date.now() });
```

### Request Debouncing
```typescript
// Prevent rapid repeated searches
const debouncedSearch = debounce(fetchFlightOptions, 1000);
```

### Lazy Loading
```typescript
// Only fetch when modal opens
const handleFlightClick = async () => {
  setShowModal(true);
  await fetchFlightOptions(); // Fetch on demand
};
```

## Testing

### With API Key
1. Add your RapidAPI key to `.env`
2. Click on a flight segment
3. Wait 2-3 seconds for real data
4. See live flights with actual prices

### Without API Key
1. Don't add any API key
2. Click on a flight segment
3. See error message with setup instructions
4. Fallback mock data is displayed

## Troubleshooting

### "No API key configured"
**Solution:** Add `VITE_RAPIDAPI_KEY` to your `.env` file

### "API rate limit exceeded"
**Solution:** 
- Wait until next day (free tier resets daily)
- Upgrade to Pro tier
- Implement caching to reduce requests

### "Invalid airport code"
**Solution:**
- Check the airport codes in `SkyscannerService.ts`
- Use the autocomplete API to find correct codes
- Add missing cities to the `airportCodes` object

### "CORS error"
**Solution:**
- RapidAPI handles CORS automatically
- If using direct API, ensure proper headers
- Check if API key is valid

### "No flights found"
**Solution:**
- Check if route is valid (some routes may not have flights)
- Try different dates
- Verify airport codes are correct

## Advanced Features

### Round-Trip Search
```typescript
const flights = await skyscannerService.searchFlights({
  ...query,
  returnDate: '2024-12-20', // Add return date
});
```

### Multi-City Search
```typescript
// Search multiple legs
const leg1 = await searchFlights({ from: 'BOM', to: 'GOI', date: '2024-12-15' });
const leg2 = await searchFlights({ from: 'GOI', to: 'DEL', date: '2024-12-18' });
```

### Cabin Class Selection
```typescript
const flights = await skyscannerService.searchFlights({
  ...query,
  cabinClass: 'business', // economy, premium_economy, business, first
});
```

### Multiple Passengers
```typescript
const flights = await skyscannerService.searchFlights({
  ...query,
  adults: 2,
  children: 1,
  infants: 1,
});
```

## Production Checklist

- [ ] Get production API key from Skyscanner
- [ ] Implement request caching (5-10 minutes)
- [ ] Add request debouncing
- [ ] Set up error monitoring (Sentry, etc.)
- [ ] Implement retry logic for failed requests
- [ ] Add loading skeletons for better UX
- [ ] Monitor API usage and costs
- [ ] Set up rate limiting on your backend
- [ ] Add analytics to track search patterns
- [ ] Implement A/B testing for UI variations

## API Response Example

### Successful Response
```json
{
  "data": {
    "itineraries": [
      {
        "id": "12345",
        "pricingOptions": [{
          "price": {
            "amount": 5500,
            "unit": "INR",
            "formatted": "₹5,500"
          }
        }],
        "legs": [{
          "origin": {
            "displayCode": "BOM",
            "name": "Mumbai"
          },
          "destination": {
            "displayCode": "GOI",
            "name": "Goa"
          },
          "departure": "2024-12-15T10:30:00",
          "arrival": "2024-12-15T13:00:00",
          "durationInMinutes": 150,
          "stopCount": 0,
          "carriers": {
            "marketing": [{
              "name": "IndiGo",
              "alternateId": "6E"
            }]
          }
        }]
      }
    ]
  }
}
```

## Resources

### Documentation
- **RapidAPI Docs**: https://rapidapi.com/skyscanner/api/skyscanner80
- **Skyscanner API Docs**: https://developers.skyscanner.net/docs/intro
- **IATA Codes**: https://www.iata.org/en/publications/directories/code-search/

### Support
- **RapidAPI Support**: support@rapidapi.com
- **Skyscanner Developer Forum**: https://developers.skyscanner.net/community

### Alternative APIs
If Skyscanner doesn't work for you:
- **Amadeus API**: https://developers.amadeus.com/
- **Kiwi.com API**: https://docs.kiwi.com/
- **Duffel API**: https://duffel.com/docs/api

## Next Steps

1. **Get your API key** from RapidAPI
2. **Add it to .env** file
3. **Test the integration** by clicking a flight
4. **Monitor usage** in RapidAPI dashboard
5. **Upgrade if needed** based on traffic

Happy flying! ✈️
