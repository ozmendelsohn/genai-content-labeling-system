'use client';

import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import Button from './Button'; // Assuming a Button component exists

// Icons (simple placeholders, consider using actual icons from a library)
const SunIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-6.364-.386l1.591-1.591M3 12h2.25m.386-6.364l1.591 1.591" />
  </svg>
);

const MoonIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
  </svg>
);

const ComputerDesktopIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25A2.25 2.25 0 015.25 3h13.5A2.25 2.25 0 0121 5.25z" />
  </svg>
);


export const ThemeToggle: React.FC = () => {
  const { theme, setTheme, resolvedTheme } = useTheme();

  // Dropdown state
  const [isOpen, setIsOpen] = React.useState(false);

  const themes = [
    { name: 'Light', value: 'light', icon: <SunIcon /> },
    { name: 'Dark', value: 'dark', icon: <MoonIcon /> },
    { name: 'System', value: 'system', icon: <ComputerDesktopIcon /> },
  ];

  const currentThemeIcon = React.useMemo(() => {
    if (theme === 'system') {
      return resolvedTheme === 'dark' ? <MoonIcon /> : <SunIcon />;
    }
    return theme === 'dark' ? <MoonIcon /> : <SunIcon />;
  }, [theme, resolvedTheme]);

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle theme"
        className="rounded-full w-10 h-10 p-0 flex items-center justify-center"
      >
        {currentThemeIcon}
      </Button>
      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-40 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md shadow-lg py-1 z-50"
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="theme-menu-button"
        >
          {themes.map((item) => (
            <button
              key={item.value}
              onClick={() => {
                setTheme(item.value as 'light' | 'dark' | 'system');
                setIsOpen(false);
              }}
              className={`flex items-center w-full px-4 py-2 text-sm text-left ${
                theme === item.value
                  ? 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'
              }`}
              role="menuitem"
            >
              <span className="mr-2">{item.icon}</span>
              {item.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
