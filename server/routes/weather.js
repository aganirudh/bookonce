import { Router } from 'express';
import { z } from 'zod';
import { fetchWeatherForecast } from '../services/weather.js';

const router = Router();
const querySchema = z.object({
  lat: z.coerce.number().finite().min(-90).max(90),
  lng: z.coerce.number().finite().min(-180).max(180),
  startDate: z.string().date(),
  endDate: z.string().date(),
}).strict();

router.get('/forecast', async (req, res) => {
  const parsed = querySchema.safeParse(req.query);
  if (!parsed.success || parsed.data.endDate < parsed.data.startDate) return res.status(400).json({ success: false, error: 'Invalid weather forecast request' });
  const start = new Date(`${parsed.data.startDate}T00:00:00Z`);
  const end = new Date(`${parsed.data.endDate}T00:00:00Z`);
  if ((end - start) / 86_400_000 > 15) return res.status(400).json({ success: false, error: 'Forecast range is too large' });
  const today = new Date(); today.setUTCHours(0, 0, 0, 0);
  const lastForecastDay = new Date(today); lastForecastDay.setUTCDate(lastForecastDay.getUTCDate() + 15);
  if (start < today || end > lastForecastDay) return res.json({ success: true, data: { status: 'unavailable-out-of-range', hourly: [] } });
  try {
    return res.json({ success: true, data: await fetchWeatherForecast(parsed.data) });
  } catch {
    return res.status(502).json({ success: false, error: 'Weather forecast is temporarily unavailable' });
  }
});

export default router;
