'use client';

import React from 'react';

interface HeartRateCardProps {
  heartRate: number;
}

const HeartRateCard: React.FC<HeartRateCardProps> = ({ heartRate }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Heart Rate</h2>
        <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
          <svg className="w-6 h-6 text-red-600 dark:text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </div>
      </div>
      <p className="text-4xl font-bold text-gray-900 dark:text-white">{heartRate}</p>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Beats per minute</p>
    </div>
  );
};

export default HeartRateCard; 