import { useState, useEffect } from 'react';
import { format } from 'date-fns';

const DigitalClock = () => {
  const [time, setTime] = useState(new Date());
  const [weather, setWeather] = useState<{ temp: number; code: number } | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Fetch weather data for Jakarta (can be updated to dynamic location later if needed)
    const fetchWeather = async () => {
      try {
        const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=-6.2088&longitude=106.8456&current=temperature_2m,weather_code&timezone=Asia%2FJakarta');
        const data = await res.json();
        if (data && data.current) {
          setWeather({
            temp: Math.round(data.current.temperature_2m),
            code: data.current.weather_code
          });
        }
      } catch (err) {
        console.error("Failed to fetch weather", err);
      }
    };

    fetchWeather();
    // Update weather every 30 minutes
    const weatherTimer = setInterval(fetchWeather, 30 * 60 * 1000);
    return () => clearInterval(weatherTimer);
  }, []);

  const getWeatherIcon = (code: number) => {
    // WMO Weather interpretation codes
    if (code === 0) return '☀️'; // Clear sky
    if (code === 1 || code === 2 || code === 3) return '⛅'; // Partly cloudy
    if (code === 45 || code === 48) return '🌫️'; // Fog
    if (code >= 51 && code <= 67) return '🌧️'; // Drizzle / Rain
    if (code >= 71 && code <= 77) return '❄️'; // Snow
    if (code >= 80 && code <= 82) return '🌦️'; // Rain showers
    if (code >= 95 && code <= 99) return '⛈️'; // Thunderstorm
    return '🌡️';
  };

  return (
    <div className="flex flex-col items-end justify-center text-[#17596b]">
      <div className="text-5xl font-black tracking-wider shadow-sm drop-shadow-sm font-sans" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.1)' }}>
        {format(time, 'HH:mm')}
        <span className="text-3xl ml-1">{format(time, 'ss')}</span>
      </div>
      {weather && (
        <div className="text-xl font-bold mt-1 bg-white/70 px-3 py-1 rounded-full shadow-sm border border-gray-200 flex items-center gap-2">
          <span>{getWeatherIcon(weather.code)}</span>
          <span>{weather.temp}°C</span>
        </div>
      )}
    </div>
  );
};

export default DigitalClock;
