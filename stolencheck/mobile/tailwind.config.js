module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#1E3A5F', light: '#2E5A8F' },
        danger: '#DC2626',
        warning: '#F59E0B',
        success: '#10B981',
      },
    },
  },
  plugins: [],
};
