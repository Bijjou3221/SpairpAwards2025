import { useEffect, useState } from "react";

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const ZERO_TIME: TimeLeft = {
  days: 0,
  hours: 0,
  minutes: 0,
  seconds: 0,
};

export const Countdown = ({ targetDate }: { targetDate: string }) => {
  const calculateTimeLeft = (): TimeLeft => {
    const difference = new Date(targetDate).getTime() - Date.now();

    if (difference <= 0) return ZERO_TIME;

    return {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / (1000 * 60)) % 60),
      seconds: Math.floor((difference / 1000) % 60),
    };
  };

  const [timeLeft, setTimeLeft] = useState<TimeLeft>(calculateTimeLeft());
  const isFinished =
    timeLeft.days === 0 &&
    timeLeft.hours === 0 &&
    timeLeft.minutes === 0 &&
    timeLeft.seconds === 0;

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  const intervals = [
    { key: "days", label: "DÍAS" },
    { key: "hours", label: "HRS" },
    { key: "minutes", label: "MIN" },
    { key: "seconds", label: "SEG" },
  ] as const;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-0 my-6 p-4 bg-black/40 backdrop-blur-md rounded-xl border border-white/10 w-full sm:w-fit max-w-full">
      {/* Time Display */}
      <div className="flex justify-center divide-x divide-white/10 w-full sm:w-auto">
        {isFinished ? (
          <span className="text-gold font-bold animate-pulse px-4 text-center text-sm md:text-base">
            ¡El evento ha comenzado!
          </span>
        ) : (
          intervals.map(({ key, label }) => (
            <div key={key} className="flex flex-col items-center px-3 sm:px-4 first:pl-0 sm:first:pl-2">
              <span className="text-2xl sm:text-3xl font-black text-white tabular-nums tracking-widest drop-shadow-md">
                {timeLeft[key].toString().padStart(2, "0")}
              </span>
              <span className="text-[9px] sm:text-[10px] uppercase text-gold font-bold tracking-widest mt-1">
                {label}
              </span>
            </div>
          ))
        )}
      </div>

      {/* Label / Context */}
      <div className="flex flex-row sm:flex-col items-center sm:items-start justify-center gap-2 sm:gap-0 w-full sm:w-auto pt-4 sm:pt-0 sm:ml-6 sm:pl-6 border-t sm:border-t-0 border-white/10 sm:border-l sm:border-white/10">
        <span className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-widest text-center sm:text-left">
          Tiempo restante
        </span>
        <span className="text-white font-bold text-xs sm:text-sm text-center sm:text-left">
          Gala de Premios
        </span>
      </div>
    </div>
  );
};
