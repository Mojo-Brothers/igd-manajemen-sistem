import { useState, useEffect } from 'react';
import { format } from 'date-fns';

const DigitalClock = () => {
  const [time, setTime] = useState(new Date());
  const [weather, setWeather] = useState<{ temp: number; code: number; location: string } | null>(null);
  const [forecast, setForecast] = useState<{ date: string; code: number; maxTemp: number; minTemp: number }[]>([]);

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
        let lat = -6.2088;
        let lon = 106.8456;
        let locName = 'Jakarta';

        try {
          const locRes = await fetch('https://ipinfo.io/json');
          const locData = await locRes.json();
          if (locData && locData.loc) {
            const [latStr, lonStr] = locData.loc.split(',');
            lat = parseFloat(latStr);
            lon = parseFloat(lonStr);
            locName = locData.city || 'Jakarta';
          }
        } catch (e) {
          console.log("Using default location");
        }

        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`);
        const data = await res.json();
        if (data && data.current) {
          setWeather({
            temp: Math.round(data.current.temperature_2m),
            code: data.current.weather_code,
            location: locName
          });
          if (data.daily) {
            const dailyData = data.daily.time.map((t: string, i: number) => ({
              date: t,
              code: data.daily.weather_code[i],
              maxTemp: Math.round(data.daily.temperature_2m_max[i]),
              minTemp: Math.round(data.daily.temperature_2m_min[i])
            }));
            setForecast(dailyData.slice(0, 6)); // limit to 6 days
          }
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
    <div className="flex flex-col items-end justify-center text-[#17596b] relative">
      <div className="text-5xl font-black tracking-wider shadow-sm drop-shadow-sm font-sans" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.1)' }}>
        {format(time, 'HH:mm')}
        <span className="text-3xl ml-1">{format(time, 'ss')}</span>
      </div>
      {weather && (
        <div className="text-xl font-bold mt-1 bg-white/70 px-3 py-1 rounded-full shadow-sm border border-gray-200 flex items-center gap-2">
          <span>{getWeatherIcon(weather.code)}</span>
          <span>{weather.temp}°C</span>
          <span className="text-sm font-semibold text-gray-500 ml-1 border-l-2 border-gray-300 pl-2">{weather.location}</span>
        </div>
      )}
      {forecast.length > 0 && (
        <div className="flex gap-1 justify-end absolute right-0 top-[115px]">
          {forecast.map((day, i) => {
            const dateObj = new Date(day.date);
            const isToday = i === 0;
            return (
              <div key={i} className={`flex flex-col items-center justify-between p-1 rounded-lg shadow-sm border border-white/50 backdrop-blur-md w-[52px] h-[76px] ${isToday ? 'bg-blue-100/80 border-blue-200' : 'bg-white/60'}`}>
                <span className={`text-[9px] leading-tight text-center font-bold ${isToday ? 'text-blue-700' : 'text-gray-600'} uppercase tracking-wider h-6 flex items-center justify-center`}>
                  {isToday ? 'HARI INI' : format(dateObj, 'EEE')}
                </span>
                <span className="text-xl leading-none">{getWeatherIcon(day.code)}</span>
                <span className="text-[10px] font-bold text-gray-700 whitespace-nowrap leading-none mt-1">{day.maxTemp}° <span className="text-gray-400 font-normal">{day.minTemp}°</span></span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DigitalClock;
