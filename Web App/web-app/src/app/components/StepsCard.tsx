'use client';

import React from 'react';

interface StepsCardProps {
  steps: number;
  goal: number;
}

const StepsCard: React.FC<StepsCardProps> = ({ steps, goal }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Daily Steps</h2>
        <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
          <svg className="w-6 h-6 text-blue-600 dark:text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        </div>
      </div>
      <p className="text-4xl font-bold text-gray-900 dark:text-white">{steps.toLocaleString()}</p>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Goal: {goal.toLocaleString()} steps</p>
    </div>
  );
};

export default StepsCard; 