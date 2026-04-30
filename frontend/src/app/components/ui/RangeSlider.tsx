'use client';

import { useState } from 'react';

interface RangeSliderProps {
  min: number;
  max: number;
  value: { min: number; max: number };
  onChange: (value: { min: number; max: number }) => void;
  step?: number;
  label?: string;
}

export default function RangeSlider({ min, max, value, onChange, step = 100, label }: RangeSliderProps) {
  const [localValue, setLocalValue] = useState(value);

  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMin = Math.min(parseInt(e.target.value), localValue.max - step);
    const newValue = { ...localValue, min: newMin };
    setLocalValue(newValue);
    onChange(newValue);
  };

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMax = Math.max(parseInt(e.target.value), localValue.min + step);
    const newValue = { ...localValue, max: newMax };
    setLocalValue(newValue);
    onChange(newValue);
  };

  return (
    <div className="space-y-2">
      {label && <label className="block text-sm font-medium text-gray-700">{label}</label>}
      
      <div className="flex gap-4">
        <div className="flex-1">
          <span className="text-xs text-gray-500">Min</span>
          <input
            type="number"
            value={localValue.min}
            onChange={handleMinChange}
            step={step}
            className="w-full px-2 py-1 border rounded-md text-sm"
          />
        </div>
        <div className="flex-1">
          <span className="text-xs text-gray-500">Max</span>
          <input
            type="number"
            value={localValue.max}
            onChange={handleMaxChange}
            step={step}
            className="w-full px-2 py-1 border rounded-md text-sm"
          />
        </div>
      </div>
    </div>
  );
}