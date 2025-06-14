'use client';

import { useState } from "react";
import Navbar from "./components/Navbar";
import StepsCard from "./components/StepsCard";
import HeartRateCard from "./components/HeartRateCard";
import LocationCard from "./components/LocationCard";
import Image from "next/image";

// Mock data - replace with real data in production
const mockData = {
  steps: 8432,
  heartRate: 72,
  location: "New York, NY",
  muscleRecovery: 72,
  caloriesBurned: 129,
};

export default function Home() {
  const [data] = useState(mockData);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto rounded-3xl shadow-xl overflow-hidden bg-white dark:bg-gray-800 p-4 md:p-8 lg:p-12">
        <Navbar />
        <div className="py-6 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Overview Of Your Health</h2>
              <p className="text-gray-600 dark:text-gray-400">Harmonious Living: Balance, Strength, Vitality, Wellness.</p>
            </div>
            <div className="flex items-center space-x-2">
              <button className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-full text-sm">Filter</button>
              <button className="bg-purple-600 text-white p-2 rounded-full">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path></svg>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Muscle Recovery Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Muscle Recovery</h2>
                <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                  <svg className="w-6 h-6 text-purple-600 dark:text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2m0 0V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
                </div>
              </div>
              <p className="text-4xl font-bold text-gray-900 dark:text-white">{data.muscleRecovery}%</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">+100% +63%</p>
            </div>

            <StepsCard steps={data.steps} goal={10000} />

            {/* Calorie Burned Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Calorie Burned</h2>
                <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                  <svg className="w-6 h-6 text-red-600 dark:text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                </div>
              </div>
              <p className="text-4xl font-bold text-gray-900 dark:text-white">{data.caloriesBurned}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">+50% This day</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Checkup Schedule */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Checkup Schedule</h2>
                <button className="text-sm text-purple-600 font-semibold">Show More</button>
              </div>
              <div className="grid grid-cols-7 text-center text-sm mb-4">
                <div className="text-gray-400">Thu</div>
                <div className="text-gray-400">Fri</div>
                <div className="text-gray-400">Sat</div>
                <div className="text-gray-400">Sun</div>
                <div className="text-gray-900 dark:text-white font-bold bg-purple-100 dark:bg-purple-700 rounded-full p-2">Mon</div>
                <div className="text-gray-400">Tue</div>
                <div className="text-gray-400">Wed</div>

                <div className="text-gray-400">15</div>
                <div className="text-gray-400">16</div>
                <div className="text-gray-400">17</div>
                <div className="text-gray-400">18</div>
                <div className="text-gray-900 dark:text-white font-bold bg-purple-600 rounded-full p-2">19</div>
                <div className="text-gray-400">20</div>
                <div className="text-gray-400">21</div>

                <div className="text-gray-400">22</div>
                <div className="text-gray-400">23</div>
                <div className="text-gray-400">24</div>
                <div className="text-gray-400">25</div>
                <div className="text-gray-400">26</div>
                <div className="text-gray-400">27</div>
                <div className="text-gray-400">28</div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-4 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <Image src="/doctor1.jpg" alt="Doctor 1" width={48} height={48} className="rounded-full" />
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">Dental Checkup</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Dr. Jane Cooper</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Appointment On Apr 26, 10:20am</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <Image src="/doctor2.jpg" alt="Doctor 2" width={48} height={48} className="rounded-full" />
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">Cancer Screening</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Dr. Cameron Williamson</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Appointment On Apr 26, 02:40am</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Your Heart Statistic */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 flex flex-col items-center justify-center">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Your Heart Statistic</h2>
              <div className="relative w-48 h-48 mb-4">
                <Image src="/heart.png" alt="Heart" layout="fill" objectFit="contain" />
              </div>
              <div className="flex justify-around w-full text-center">
                <div>
                  <p className="text-purple-600 font-semibold">● Average</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">98</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">BPM</p>
                </div>
                <div>
                  <p className="text-blue-600 font-semibold">● Minimum</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">48</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">BPM</p>
                </div>
                <div>
                  <p className="text-red-600 font-semibold">● Maximum</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">118</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">BPM</p>
                </div>
              </div>
              {/* Placeholder for Heart Rate Graph */}
              <div className="w-full h-32 bg-gray-50 dark:bg-gray-700 rounded-lg mt-4 flex items-center justify-center text-gray-500 dark:text-gray-400">
                Heart Rate Graph Placeholder
              </div>
            </div>

            {/* Medical Checkup History */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 lg:col-span-2">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Medical Checkup History</h2>
                <button className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-1 rounded-full text-sm flex items-center">
                  Calory Burned
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </button>
              </div>
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Duration</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Calory Burned</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200 flex items-center">
                      <span className="w-2 h-2 rounded-full bg-purple-600 mr-2"></span>Running
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">20 April, 2024</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">120 Minutes</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">140 Calory Burned</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200 flex items-center">
                      <span className="w-2 h-2 rounded-full bg-blue-600 mr-2"></span>Cycling
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">18 April, 2024</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">120 Minutes</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">140 Calory Burned</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200 flex items-center">
                      <span className="w-2 h-2 rounded-full bg-green-600 mr-2"></span>Swimming
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">16 April, 2024</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">120 Minutes</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">140 Calory Burned</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200 flex items-center">
                      <span className="w-2 h-2 rounded-full bg-yellow-600 mr-2"></span>Yoga
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">10 April, 2024</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">120 Minutes</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">140 Calory Burned</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}