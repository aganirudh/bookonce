# 🚀 Quick Setup: Skyscanner Real-Time Flights

## Get Real Flight Data in 3 Minutes!

### Step 1: Get Your Free API Key (2 minutes)

1. Go to **RapidAPI**: https://rapidapi.com/skyscanner/api/skyscanner80
2. Click **"Sign Up"** (free account)
3. Click **"Subscribe to Test"** 
4. Select **"Basic"** plan (FREE - 100 requests/month)
5. Copy your **X-RapidAPI-Key**

### Step 2: Add to Your Project (30 seconds)

1. Open your project folder
2. Create/edit `.env` file:
   ```bash
   VITE_RAPIDAPI_KEY=paste_your_key_here
   ```
3. Save the file

### Step 3: Restart & Test (30 seconds)

1. Restart your development server:
   ```bash
   npm run dev
   ```
2. Open the app
3. Click on any **flight segment**
4. See **real-time flights**! ✈️

## That's It! 🎉

You now have real-time flight data from Skyscanner showing:
- ✅ Live prices
- ✅ Actual flight times
- ✅ Real airlines
- ✅ Direct booking links

## Troubleshooting

### Not working?
1. Check `.env` file has the correct key
2. Restart dev server completely
3. Check browser console for errors
4. Verify you subscribed to the API on RapidAPI

### Need help?
- Check `docs/SKYSCANNER_INTEGRATION.md` for detailed guide
- Verify API key is active on RapidAPI dashboard
- Make sure you haven't exceeded free tier limits (100/month)

## Free Tier Limits

- **100 requests per month**
- **10 requests per day**
- Perfect for development!

## Upgrade Later

When you need more:
- **Pro Plan**: $9.99/month - 500 requests
- **Ultra Plan**: $49.99/month - 5000 requests
- **Mega Plan**: $199.99/month - 50000 requests

---

**Happy coding!** 🚀
