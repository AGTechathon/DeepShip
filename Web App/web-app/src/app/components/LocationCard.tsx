'use client';

import React from 'react';

interface LocationCardProps {
  location: string;
  lastUpdated: string;
}

const LocationCard: React.FC<LocationCardProps> = ({ location, lastUpdated }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Current Location</h2>
        <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
          <svg className="w-6 h-6 text-green-600 dark:text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{location}</p>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Last updated: {lastUpdated}</p>
    </div>
  );
};

export default LocationCard; 