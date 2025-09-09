/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  safelist: [
    // Dynamic color classes for dashboard statistics
    'bg-blue-500/20',
    'bg-green-500/20', 
    'bg-yellow-500/20',
    'bg-red-500/20',
    'bg-purple-500/20',
    'bg-indigo-500/20',
    'bg-pink-500/20',
    'bg-gray-500/20',
    // Dynamic text colors
    'text-blue-500',
    'text-green-500',
    'text-yellow-500', 
    'text-red-500',
    'text-purple-500',
    'text-indigo-500',
    'text-pink-500',
    // Dynamic border colors
    'border-blue-500',
    'border-green-500',
    'border-yellow-500',
    'border-red-500',
    'border-purple-500',
    'border-indigo-500',
    'border-pink-500',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
