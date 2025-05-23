import React, { createContext, useContext, useState } from 'react';

interface ReservationContextType {
  selectedDate: Date | null;
  setSelectedDate: (date: Date | null) => void;
}

const ReservationContext = createContext<ReservationContextType | undefined>(undefined);

export const useReservation = () => {
  const context = useContext(ReservationContext);
  if (!context) {
    throw new Error('useReservation must be used within a ReservationProvider');
  }
  return context;
};

export const ReservationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  return (
    <ReservationContext.Provider
      value={{
        selectedDate,
        setSelectedDate,
      }}
    >
      {children}
    </ReservationContext.Provider>
  );
};