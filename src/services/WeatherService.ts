export interface WeatherHour {
  timestamp: string; temperatureC: number; apparentTemperatureC: number;
  precipitationProbability: number; precipitationMm: number; weatherCode: number; windSpeedKph: number;
}
export interface WeatherForecast { status: 'available' | 'unavailable-out-of-range'; timezone?: string; hourly: WeatherHour[] }

class WeatherService {
  async getForecast(lat: number, lng: number, startDate: string, endDate = startDate): Promise<WeatherForecast> {
    const query = new URLSearchParams({ lat: String(lat), lng: String(lng), startDate, endDate });
    const response = await fetch(`/api/weather/forecast?${query}`);
    let payload: { success: boolean; data?: WeatherForecast; error?: string };
    try { payload = await response.json(); } catch { throw new Error('Malformed weather response'); }
    if (!response.ok || !payload.success || !payload.data) throw new Error(payload.error || 'Weather unavailable');
    return payload.data;
  }
}
export const weatherService = new WeatherService();
