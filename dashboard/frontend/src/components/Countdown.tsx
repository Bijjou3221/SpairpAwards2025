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
    <div className="flex items-center my-6 p-4 bg-black/40 backdrop-blur-md rounded-xl border border-white/10 w-fit">
      <div className="flex divide-x divide-white/10">
        {isFinished ? (
          <span className="text-gold font-bold animate-pulse px-4">
            ¡El evento ha comenzado!
          </span>
        ) : (
          intervals.map(({ key, label }) => (
            <div key={key} className="flex flex-col items-center mx-3">
              <span className="text-3xl font-black text-white tabular-nums tracking-widest drop-shadow-md">
                {timeLeft[key].toString().padStart(2, "0")}
              </span>
              <span className="text-[10px] uppercase text-gold font-bold tracking-widest mt-1">
                {label}
              </span>
            </div>
          ))
        )}
      </div>

      <div className="ml-6 pl-6 border-l border-white/10 flex flex-col justify-center">
        <span className="text-xs text-gray-400 uppercase tracking-widest">
          Tiempo restante
        </span>
        <span className="text-white font-bold text-sm">
          Gala de Premios
        </span>
      </div>
    </div>
  );
};
