import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

const Clock = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col items-end justify-center text-primary">
      <div className="text-2xl font-semibold">
        {format(time, 'EEEE, dd MMMM yyyy', { locale: id })}
      </div>
      <div className="text-5xl font-bold tracking-wider">
        {format(time, 'HH:mm:ss')}
      </div>
    </div>
  );
};

export default Clock;
