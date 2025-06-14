'use client';

import React from 'react';
import Image from "next/image";

const Navbar: React.FC = () => {
  return (
    <nav className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-4 flex items-center justify-between mb-8">
      <div className="flex items-center space-x-2">
        <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold">HP</div>
        <span className="text-xl font-bold text-gray-900 dark:text-white">HealthPulse</span>
      </div>
      <div className="flex items-center space-x-6">
        <a href="#" className="text-gray-600 dark:text-gray-300 hover:text-purple-600 flex items-center space-x-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
          <span>Home</span>
        </a>
        <a href="#" className="text-white bg-purple-600 px-4 py-2 rounded-full flex items-center space-x-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2m0 0V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
          <span>Dashboard</span>
        </a>
        <a href="#" className="text-gray-600 dark:text-gray-300 hover:text-purple-600 flex items-center space-x-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
          <span>Schedule</span>
        </a>
        <a href="#" className="text-gray-600 dark:text-gray-300 hover:text-purple-600 flex items-center space-x-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18s-3.332.477-4.5 1.253"></path></svg>
          <span>History</span>
        </a>
        <a href="#" className="text-gray-600 dark:text-gray-300 hover:text-purple-600 flex items-center space-x-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
          <span>Activity</span>
        </a>
      </div>
      <div className="flex items-center space-x-4">
        <button className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.405L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
        </button>
        <button className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.515-1.332 1.958-2.317 3.553-2.317 2.106 0 3.793 1.704 3.793 3.793v.25a2.5 2.5 0 00-.733 1.75l-.565 2.553a1.5 1.5 0 01-1.391 1.15H7.391c-.818 0-1.554-.649-1.391-1.15l-.565-2.553a2.5 2.5 0 00-.733-1.75v-.25c0-2.089 1.687-3.793 3.793-3.793zM12 22v-4m-4 0h8"></path></svg>
        </button>
        <div className="flex items-center space-x-2">
          <Image src="/profile.jpg" alt="User avatar" width={32} height={32} className="rounded-full" />
          <span className="text-gray-900 dark:text-white font-medium">Rucas Bryan</span>
          <span className="text-sm text-gray-500 dark:text-gray-400">Premium Member</span>
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 