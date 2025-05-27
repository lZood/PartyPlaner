import React, { useState } from 'react';
import { Calendar } from 'lucide-react';

interface DatePickerModalProps {
  selectedDate: Date | null;
  onSelect: (date: Date) => void;
  onClose: () => void;
}

const DAYS = ['Lun', 'Mar', 'Mier', 'Jue', 'Vie', 'Sab', 'Dom'];
const MONTHS = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
];

const DatePickerModal: React.FC<DatePickerModalProps> = ({
  selectedDate,
  onSelect,
  onClose,
}) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  
  const maxDate = new Date(today);
  maxDate.setFullYear(today.getFullYear() + 3);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const thisWeekend = new Date(today);
  thisWeekend.setDate(today.getDate() + (5 - today.getDay())); // Next Friday

  const formatQuickDate = (date: Date) => {
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
    }).toLowerCase();
  };

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    let day = new Date(year, month, 1).getDay() - 1;
    return day === -1 ? 6 : day; // Adjust for Monday start
  };

  const isDateDisabled = (date: Date) => {
    return date < today;
  };

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDayOfMonth = getFirstDayOfMonth(currentYear, currentMonth);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array(firstDayOfMonth).fill(null);

  return (
    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg p-4 z-50" style={{ width: '600px' }}>
      <div className="flex">
        {/* Left sidebar with quick options */}
        <div className="w-1/3 pr-4 border-r border-gray-200 space-y-2">
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-800">Fechas sugeridas</h3>
          </div>
          <button
            onClick={() => onSelect(today)}
            className="w-full flex items-center p-2 hover:bg-gray-50 rounded transition-colors"
          >
            <Calendar className="text-gray-400 mr-2" size={16} />
            <div className="text-left">
              <div className="text-sm text-gray-700">Hoy</div>
              <div className="text-xs text-gray-500">{today.getDate()} may</div>
            </div>
          </button>

          <button
            onClick={() => onSelect(tomorrow)}
            className="w-full flex items-center p-2 hover:bg-gray-50 rounded transition-colors"
          >
            <Calendar className="text-gray-400 mr-2" size={16} />
            <div className="text-left">
              <div className="text-sm text-gray-700">Mañana</div>
              <div className="text-xs text-gray-500">{tomorrow.getDate()} may</div>
            </div>
          </button>

          <button
            onClick={() => onSelect(thisWeekend)}
            className="w-full flex items-center p-2 hover:bg-gray-50 rounded transition-colors"
          >
            <Calendar className="text-gray-400 mr-2" size={16} />
            <div className="text-left">
              <div className="text-sm text-gray-700">Este fin de semana</div>
              <div className="text-xs text-gray-500">23-25 may</div>
            </div>
          </button>
        </div>

        {/* Calendar */}
        <div className="w-2/3 pl-4">
          <div className="flex justify-between items-center mb-4">
            <button
              onClick={() => {
                if (currentMonth === 0) {
                  setCurrentMonth(11);
                  setCurrentYear(currentYear - 1);
                } else {
                  setCurrentMonth(currentMonth - 1);
                }
              }}
              className="p-1 hover:bg-gray-100 rounded-full"
              disabled={currentYear === today.getFullYear() && currentMonth === today.getMonth()}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h3 className="text-base font-medium">
              {MONTHS[currentMonth]} {currentYear}
            </h3>
            <button
              onClick={() => {
                if (currentMonth === 11) {
                  setCurrentMonth(0);
                  setCurrentYear(currentYear + 1);
                } else {
                  setCurrentMonth(currentMonth + 1);
                }
              }}
              className="p-1 hover:bg-gray-100 rounded-full"
              disabled={currentYear === maxDate.getFullYear() && currentMonth === maxDate.getMonth()}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-7 gap-2 text-center mb-4">
            {DAYS.map(day => (
              <div key={day} className="text-xs text-gray-500">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {blanks.map((_, i) => (
              <div key={`blank-${i}`} />
            ))}
            {days.map(day => {
              const date = new Date(currentYear, currentMonth, day);
              const isToday = today.getDate() === day && 
                             today.getMonth() === currentMonth && 
                             today.getFullYear() === currentYear;
              const isSelected = selectedDate?.getDate() === day && 
                               selectedDate?.getMonth() === currentMonth && 
                               selectedDate?.getFullYear() === currentYear;
              const disabled = isDateDisabled(date);

              return (
                <button
                  key={day}
                  onClick={() => onSelect(date)}
                  disabled={disabled}
                  className={`
                    p-2 text-sm rounded-full w-10 h-10 flex items-center justify-center transition-colors
                    ${isToday ? 'font-bold' : ''}
                    ${disabled ? 'bg-gray-100 text-gray-400 pointer-events-none' : 
                      isSelected ? 'bg-primary-500 text-white' : 'hover:bg-gray-100'}
                  `}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DatePickerModal;