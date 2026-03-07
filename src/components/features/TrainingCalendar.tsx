"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  addDays, 
  eachDayOfInterval,
  isToday
} from "date-fns";
import { ja } from "date-fns/locale";

interface TrainingCalendarProps {
    records: {
        date: string | Date;
        id: string;
    }[];
}

export function TrainingCalendar({ records }: TrainingCalendarProps) {
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const calendarDays = eachDayOfInterval({
        start: startDate,
        end: endDate,
    });

    const hasRecord = (day: Date) => {
        return records.some(record => isSameDay(new Date(record.date), day));
    };

    const weekDays = ["日", "月", "火", "水", "木", "金", "土"];

    return (
        <div className="premium-card glass border-white/5 p-4">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-serif text-silk">
                    {format(currentMonth, "yyyy年 M月", { locale: ja })}
                </h2>
                <div className="flex gap-2">
                    <button 
                        onClick={prevMonth}
                        className="p-2 hover:bg-white/5 rounded-full transition-colors text-silk/60 hover:text-accent"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <button 
                        onClick={nextMonth}
                        className="p-2 hover:bg-white/5 rounded-full transition-colors text-silk/60 hover:text-accent"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-7 mb-2">
                {weekDays.map((day, i) => (
                    <div key={day} className={cn(
                        "text-center text-[10px] font-bold uppercase tracking-widest pb-2",
                        i === 0 ? "text-red-400/60" : i === 6 ? "text-blue-400/60" : "text-silk/20"
                    )}>
                        {day}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day, i) => {
                    const isCurrentMonth = isSameMonth(day, monthStart);
                    const recorded = hasRecord(day);
                    const today = isToday(day);

                    return (
                        <div 
                            key={i} 
                            className={cn(
                                "aspect-square flex flex-col items-center justify-center rounded-xl transition-all relative",
                                !isCurrentMonth && "opacity-10",
                                recorded ? "bg-accent/10 border border-accent/20" : "hover:bg-white/5"
                            )}
                        >
                            <span className={cn(
                                "text-xs font-medium",
                                recorded ? "text-accent" : isCurrentMonth ? "text-silk/60" : "text-silk/20",
                                today && !recorded && "text-highlight underline underline-offset-4"
                            )}>
                                {format(day, "d")}
                            </span>
                            {recorded && (
                                <div className="absolute bottom-1.5 w-1 h-1 bg-accent rounded-full shadow-[0_0_8px_rgba(255,184,0,0.8)]" />
                            )}
                        </div>
                    );
                })}
            </div>
            
            <div className="mt-6 flex items-center justify-center gap-4 text-[10px] text-silk/30 uppercase tracking-tighter">
                <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-accent/20 border border-accent/40" />
                    <span>練習済み</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-white/5" />
                    <span>練習なし</span>
                </div>
            </div>
        </div>
    );
}
