// src/app/dashboard/page.tsx
import React from 'react';

const DashboardPage = () => {
  return (
    <div className="min-h-screen bg-[#F5F5F5] flex">
      {/* Sidebar */}
      <aside className="w-20 bg-white shadow-md flex flex-col items-center py-6">
        <div className="mb-10">
          {/* Logo */}
          <div className="text-xl font-bold text-gray-800">VocalEye</div>
        </div>
        <nav className="flex flex-col space-y-8">
          {/* Navigation Icons Placeholder */}
          <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
          <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
          <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
          <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">
        {/* Header Section */}
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Hi, Amanda!</h1>
            <p className="text-gray-600">Let's take a look at your activity today</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search for health data"
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <svg
                className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                ></path>
              </svg>
            </div>
            <button className="px-6 py-2 bg-black text-white rounded-full font-semibold hover:bg-gray-800">
              Upgrade
            </button>
          </div>
        </header>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-3 gap-8">
          {/* Your Workout Results for Today */}
          <div className="col-span-2 bg-white rounded-3xl p-6 shadow-md">
            <h2 className="text-xl font-semibold mb-4">Your Workout Results for Today</h2>
            <div className="relative flex items-center justify-center h-64">
              <div className="absolute">
                {/* Main large circle */}
                <div className="w-48 h-48 bg-yellow-300 opacity-60 rounded-full flex items-center justify-center blur-2xl"></div>
              </div>
              <div className="absolute flex items-center justify-center">
                {/* Smaller red circle */}
                <div className="w-32 h-32 bg-red-400 opacity-60 rounded-full flex items-center justify-center blur-2xl mr-20 mt-10">
                  <span className="text-white font-bold text-lg">850</span>
                  <span className="text-white text-sm ml-1">kcal</span>
                </div>
                {/* Smaller yellow circle */}
                <div className="w-32 h-32 bg-yellow-400 opacity-60 rounded-full flex items-center justify-center blur-2xl ml-20 mb-10">
                  <span className="text-white font-bold text-lg">1.875</span>
                  <span className="text-white text-sm ml-1">kcal</span>
                </div>
              </div>
              {/* Central grey circle for hours */}
              <div className="absolute w-28 h-28 bg-gray-800 rounded-full flex items-center justify-center z-10">
                <span className="text-white font-bold text-lg">2.30</span>
                <span className="text-white text-sm ml-1">hours</span>
              </div>
            </div>
            <div className="mt-4 flex space-x-6">
              <div className="flex items-center">
                <span className="w-4 h-4 bg-yellow-400 rounded-full mr-2"></span>
                <span className="text-sm text-gray-700">Calories intake</span>
              </div>
              <div className="flex items-center">
                <span className="w-4 h-4 bg-red-500 rounded-full mr-2"></span>
                <span className="text-sm text-gray-700">Calories burned</span>
              </div>
              <div className="flex items-center">
                <span className="w-4 h-4 bg-gray-700 rounded-full mr-2"></span>
                <span className="text-sm text-gray-700">Activity time</span>
              </div>
            </div>
          </div>

          {/* Your Training Days Calendar */}
          <div className="bg-white rounded-3xl p-6 shadow-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Your Training Days</h2>
              <select className="bg-gray-100 rounded-full px-4 py-1 text-sm focus:outline-none">
                <option>June</option>
                <option>July</option>
                <option>August</option>
              </select>
            </div>
            <div className="grid grid-cols-7 gap-2 text-center text-gray-500 text-sm mb-2">
              <div>M</div>
              <div>T</div>
              <div>W</div>
              <div>T</div>
              <div>F</div>
              <div>S</div>
              <div>S</div>
            </div>
            <div className="grid grid-cols-7 gap-2 text-center">
              {[...
                Array(30)
              ].map((_, i) => {
                const day = i + 1;
                const isCurrentDay = day === 17; // Example: assuming 17th is current day
                const isDoneDay = [1, 5, 10, 15, 20, 25].includes(day); // Example: done days
                const isScheduledDay = [3, 7, 12, 19, 23].includes(day); // Example: scheduled days

                let dayClasses = 'w-8 h-8 flex items-center justify-center rounded-full';
                if (isCurrentDay) {
                  dayClasses += ' bg-black text-white';
                } else if (isDoneDay) {
                  dayClasses += ' bg-yellow-400 text-white';
                } else if (isScheduledDay) {
                  dayClasses += ' border border-gray-300';
                } else {
                  dayClasses += ' text-gray-800';
                }

                return (
                  <div key={day} className={dayClasses}>
                    {day}
                  </div>
                );
              })}
            </div>
            <div className="mt-4 flex justify-around text-xs text-gray-600">
              <div className="flex items-center">
                <span className="w-3 h-3 rounded-full bg-black mr-2"></span>Current day
              </div>
              <div className="flex items-center">
                <span className="w-3 h-3 rounded-full bg-yellow-400 mr-2"></span>Done
              </div>
              <div className="flex items-center">
                <span className="w-3 h-3 rounded-full border border-gray-300 mr-2"></span>Scheduled
              </div>
            </div>
          </div>

          {/* Steps for Today */}
          <div className="col-span-1 bg-white rounded-3xl p-6 shadow-md">
            <h2 className="text-xl font-semibold mb-4">Steps for Today</h2>
            <p className="text-gray-600 text-sm mb-4">Keep your body toned</p>
            <div className="flex items-center justify-center relative h-40">
              {/* Outer circle (background) */}
              <div className="w-32 h-32 rounded-full border-4 border-gray-200 absolute"></div>
              {/* Inner circle (progress) - This would typically be an SVG for true progress, but for visual, it's a styled div */}
              <div
                className="w-32 h-32 rounded-full absolute"
                style={{
                  background: `conic-gradient(#FACC15 68%, #E5E7EB 0%)`,
                  transform: 'rotate(-90deg)',
                }}
              ></div>
              <div className="absolute flex flex-col items-center justify-center z-10">
                <span className="text-gray-500 text-sm">Goal</span>
                <span className="text-2xl font-bold text-gray-800">8.500</span>
                <span className="text-gray-400 text-xs">5.201</span>
              </div>
            </div>
            <button className="mt-4 w-full flex items-center justify-center bg-gray-100 py-2 rounded-full text-gray-700 font-semibold text-sm hover:bg-gray-200">
              Change Goal
              <svg
                className="h-4 w-4 ml-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 5l7 7-7 7"
                ></path>
              </svg>
            </button>
          </div>

          {/* My Habits */}
          <div className="col-span-2 bg-white rounded-3xl p-6 shadow-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">My Habits</h2>
              <button className="flex items-center text-blue-600 font-semibold">
                Add New
                <svg
                  className="h-5 w-5 ml-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 4v16m8-8H4"
                  ></path>
                </svg>
              </button>
            </div>
            <div className="space-y-4">
              {/* Habit Item */}
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gray-200 rounded-full mr-3"></div>
                  <div>
                    <p className="font-semibold text-gray-800">Stretching</p>
                    <p className="text-sm text-gray-500">Trainer: Alice McCain</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <p className="text-sm text-gray-600 mr-2">Sessions completed: 9/12</p>
                  <div className="w-24 h-2 bg-gray-200 rounded-full">
                    <div className="h-full bg-red-500 rounded-full" style={{ width: '75%' }}></div>
                  </div>
                </div>
              </div>

              {/* Habit Item */}
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gray-200 rounded-full mr-3"></div>
                  <div>
                    <p className="font-semibold text-gray-800">Yoga training</p>
                    <p className="text-sm text-gray-500">Trainer: Jennifer Lubin</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <p className="text-sm text-gray-600 mr-2">Sessions completed: 6/10</p>
                  <div className="w-24 h-2 bg-gray-200 rounded-full">
                    <div className="h-full bg-red-500 rounded-full" style={{ width: '60%' }}></div>
                  </div>
                </div>
              </div>

              {/* Habit Item */}
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gray-200 rounded-full mr-3"></div>
                  <div>
                    <p className="font-semibold text-gray-800">Massage</p>
                    <p className="text-sm text-gray-500">Masseur: Johnson Cooper</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <p className="text-sm text-gray-600 mr-2">Sessions completed: 4/8</p>
                  <div className="w-24 h-2 bg-gray-200 rounded-full">
                    <div className="h-full bg-red-500 rounded-full" style={{ width: '50%' }}></div>
                  </div>
                </div>
              </div>

              {/* Habit Item */}
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gray-200 rounded-full mr-3"></div>
                  <div>
                    <p className="font-semibold text-gray-800">Ab exercises</p>
                    <p className="text-sm text-gray-500">Trainer: Emma Davis</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <p className="text-sm text-gray-600 mr-2">Sessions completed: 8/10</p>
                  <div className="w-24 h-2 bg-gray-200 rounded-full">
                    <div className="h-full bg-red-500 rounded-full" style={{ width: '80%' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Weight Loss Plan */}
          <div className="col-span-3 bg-white rounded-3xl p-6 shadow-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Weight Loss Plan</h2>
              <div className="text-sm font-semibold text-gray-700">68% Completed</div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-600 text-sm">58 kg</span>
              <div className="flex-1 bg-gray-200 rounded-full h-3 relative">
                <div className="bg-green-500 h-full rounded-full" style={{ width: '68%' }}></div>
                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-3 py-1 rounded-full">53.2 kg</div>
              </div>
              <span className="text-gray-600 text-sm">50 kg</span>
            </div>
            <div className="flex justify-center mt-6">
              {/* User Avatar */}
              <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center text-gray-700 text-lg font-semibold">AD</div>
            </div>
          </div>

          {/* Heart Rate Section */}
          <div className="col-span-1 bg-white rounded-3xl p-6 shadow-md">
            <h2 className="text-xl font-semibold mb-4">Heart Rate</h2>
            <div className="h-40 bg-gray-100 rounded-xl flex items-center justify-center">
              <p className="text-gray-500">Heart Rate Chart/Data Placeholder</p>
            </div>
          </div>

          {/* Location Tracking Section */}
          <div className="col-span-2 bg-white rounded-3xl p-6 shadow-md">
            <h2 className="text-xl font-semibold mb-4">Location Tracking</h2>
            <div className="h-40 bg-gray-100 rounded-xl flex items-center justify-center">
              <p className="text-gray-500">Map/Location Data Placeholder</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;
