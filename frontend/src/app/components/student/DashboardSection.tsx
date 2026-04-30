// frontend/src/app/components/student/DashboardSection.tsx
'use client';

import PropertyCard from './PropertyCard';

interface DashboardSectionProps {
  title: string;
  subtitle?: string;
  properties: any[];
  type: 'negotiation' | 'current' | 'past';
  icon: string;
  emptyMessage: string;
  accentColor: string;
}

export default function DashboardSection({
  title,
  subtitle,
  properties,
  type,
  icon,
  emptyMessage,
  accentColor,
}: DashboardSectionProps) {
  if (properties.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">{icon}</span>
          <h2 className="text-xl font-bold" style={{ color: '#190E4F' }}>{title}</h2>
        </div>
        {subtitle && <p className="text-sm text-gray-500 mb-4">{subtitle}</p>}
        <div className="text-center py-8">
          <p className="text-gray-400">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-2xl">{icon}</span>
        <h2 className="text-xl font-bold" style={{ color: '#190E4F' }}>{title}</h2>
        <span 
          className="ml-2 px-2 py-0.5 rounded-full text-xs font-medium"
          style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
        >
          {properties.length}
        </span>
      </div>
      {subtitle && <p className="text-sm text-gray-500 mb-4">{subtitle}</p>}
      
      <div className="space-y-3">
        {properties.map((property, index) => (
          <PropertyCard key={property.id || index} property={property} type={type} />
        ))}
      </div>
    </div>
  );
}