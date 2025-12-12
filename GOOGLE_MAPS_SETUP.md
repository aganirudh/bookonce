# Google Maps API Setup Guide

This guide will help you set up Google Maps API for the TravelEase journey planner feature.

## Prerequisites

- A Google account
- A credit card (required for Google Cloud, but you get $200 free credit per month)

## Step-by-Step Setup

### 1. Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown at the top
3. Click "New Project"
4. Enter project name: "TravelEase" (or your preferred name)
5. Click "Create"

### 2. Enable Billing

1. In the Google Cloud Console, go to "Billing"
2. Link a billing account (required even for free tier)
3. You'll get $200 free credit per month for Maps APIs

### 3. Enable Required APIs

Navigate to "APIs & Services" > "Library" and enable the following APIs:

#### Required APIs:
- **Maps JavaScript API** - For displaying maps and interactive features
- **Places API** - For location autocomplete and place details
- **Directions API** - For multi-modal routing and transit directions
- **Distance Matrix API** - For calculating travel distances and times
- **Geocoding API** - For converting addresses to coordinates

To enable each API:
1. Search for the API name in the library
2. Click on the API
3. Click "Enable"
4. Wait for it to be enabled (takes a few seconds)

### 4. Create API Key

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "API Key"
3. Your API key will be created and displayed
4. **IMPORTANT**: Click "Restrict Key" immediately

### 5. Restrict API Key (Security Best Practice)

#### Application Restrictions:
1. Select "HTTP referrers (web sites)"
2. Add your domains:
   - For development: `http://localhost:*`
   - For development: `http://127.0.0.1:*`
   - For production: `https://yourdomain.com/*`

#### API Restrictions:
1. Select "Restrict key"
2. Select only the APIs you enabled:
   - Maps JavaScript API
   - Places API
   - Directions API
   - Distance Matrix API
   - Geocoding API

3. Click "Save"

### 6. Add API Key to Your Project

1. Copy your API key
2. Open your `.env` file in the project root
3. Add the following line:
   ```
   VITE_GOOGLE_MAPS_API_KEY=your_actual_api_key_here
   ```
4. Replace `your_actual_api_key_here` with your actual API key
5. Save the file

### 7. Verify Setup

After adding the API key, restart your development server:

```bash
npm run dev
```

The journey planner should now be able to use Google Maps APIs for:
- Location autocomplete
- Route calculation
- Distance estimation
- Map display

## Cost Estimation

Google Maps Platform offers generous free tier:
- **$200 free credit per month**
- Most APIs cost $0.005 - $0.01 per request
- This translates to approximately 20,000-40,000 requests per month for free

### Typical Usage for TravelEase:
- Location autocomplete: ~5 requests per search
- Route calculation: ~2-3 requests per journey plan
- Map display: ~1 request per page load

**Estimated monthly cost for 1000 users**: ~$50-100 (well within free tier)

## Troubleshooting

### "This API project is not authorized to use this API"
- Make sure you've enabled all required APIs in the Google Cloud Console
- Wait a few minutes after enabling APIs for changes to propagate

### "RefererNotAllowedMapError"
- Check that your domain is added to the HTTP referrer restrictions
- Make sure you're using the correct format: `http://localhost:*`

### "API key not valid"
- Verify the API key is correctly copied to `.env`
- Make sure there are no extra spaces or quotes
- Restart your development server after adding the key

### Rate Limiting
- If you hit rate limits, implement caching (already built into the system)
- Consider upgrading your quota in Google Cloud Console

## Security Best Practices

1. ✅ **Always restrict your API keys** - Never use unrestricted keys
2. ✅ **Never commit API keys to Git** - Use `.env` files (already in `.gitignore`)
3. ✅ **Use different keys for dev/prod** - Create separate projects for each environment
4. ✅ **Monitor usage** - Check Google Cloud Console regularly for unusual activity
5. ✅ **Rotate keys periodically** - Change keys every 3-6 months

## Additional Resources

- [Google Maps Platform Documentation](https://developers.google.com/maps/documentation)
- [API Key Best Practices](https://developers.google.com/maps/api-security-best-practices)
- [Pricing Calculator](https://mapsplatform.google.com/pricing/)
- [Free Tier Details](https://cloud.google.com/maps-platform/pricing)

## Support

If you encounter issues:
1. Check the [Google Maps Platform Support](https://developers.google.com/maps/support)
2. Review the [Stack Overflow tag](https://stackoverflow.com/questions/tagged/google-maps)
3. Contact Google Cloud Support (available with billing account)
