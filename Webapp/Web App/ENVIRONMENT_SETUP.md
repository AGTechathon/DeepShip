# 🌍 Environment Setup for Geocoding

## Required Environment Variables

Add the following to your `.env.local` file:

```env
# OpenCage Geocoding API (Primary)
NEXT_PUBLIC_OPENCAGE_API_KEY=your_opencage_api_key_here

# Firebase Configuration (existing)
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://your_project.firebaseio.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

## Getting OpenCage API Key

1. Go to [OpenCage Geocoding API](https://opencagedata.com/)
2. Sign up for a free account
3. Get your API key from the dashboard
4. Free tier includes 2,500 requests per day

## Fallback Geocoding

The application includes a fallback to Nominatim (OpenStreetMap) if OpenCage fails:
- No API key required for Nominatim
- Slower response times
- Rate limited (1 request per second)

## Testing Without API Key

If no OpenCage API key is provided:
- The app will automatically fall back to Nominatim
- Location will still be converted to addresses
- Performance may be slower

## Location Display Priority

1. **Full Address**: If geocoding succeeds, shows full formatted address
2. **City, State**: If partial data available, shows city and state
3. **City Only**: If only city is available
4. **Coordinates**: Fallback to lat, lng coordinates

## Example Outputs

- **Full Address**: "123 Main St, San Francisco, CA 94102, USA"
- **City, State**: "San Francisco, CA"
- **City Only**: "San Francisco"
- **Coordinates**: "37.7749, -122.4194"
- **No Data**: "Not available"

## Implementation Notes

- Geocoding is performed in the HealthDataContext
- Results are cached in the context state
- Only geocodes when location coordinates change
- Handles API failures gracefully
- No blocking of app functionality if geocoding fails
