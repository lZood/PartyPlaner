import React from 'react';
import { useReservation } from '../../contexts/ReservationContext';

const DatePicker: React.FC = () => {
  const { selectedDate, setSelectedDate } = useReservation();

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = new Date(e.target.value);
    setSelectedDate(date);
  };

  // Get minimum date (today)
  const today = new Date();
  const minDate = today.toISOString().split('T')[0];

  // Get maximum date (1 year from today)
  const maxDate = new Date(today.setFullYear(today.getFullYear() + 1)).toISOString().split('T')[0];

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold mb-4">Selecciona la Fecha del Evento</h3>
      <div className="relative">
        <input
          type="date"
          min={minDate}
          max={maxDate}
          value={selectedDate ? selectedDate.toISOString().split('T')[0] : ''}
          onChange={handleDateChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>
      <p className="text-sm text-gray-500 mt-2">
        Selecciona la fecha para ver los servicios disponibles
      </p>
    </div>
  );
};