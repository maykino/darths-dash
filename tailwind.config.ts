import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        'vader-red': '#ff0000',
        'vader-black': '#1a1a1a',
        'yoda-green': '#9acd32',
        'space-blue': '#0a0a2e',
      },
      fontFamily: {
        game: ['Press Start 2P', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;
