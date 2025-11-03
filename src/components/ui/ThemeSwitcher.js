import React, { useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { HiMoon, HiSun } from 'react-icons/hi';
import './ThemeSwitcher.css';

const ThemeSwitcher = () => {
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    // Update toggle visual state based on current theme
    const sunIcon = document.querySelector("#sun-icon");
    const moonIcon = document.querySelector("#moon-icon");
    const sliderButton = document.querySelector("#theme-toggle-slider-button");
    
    if (!sunIcon || !moonIcon || !sliderButton) return;
    
    const isDark = theme === 'dark';
    
    if (isDark) {
      // Dark mode - slider moves right, show moon, hide sun
      sunIcon.style.opacity = "0";
      moonIcon.style.opacity = "1";
      sliderButton.style.transform = "translateX(28px)";
    } else {
      // Light mode - slider moves left, show sun, hide moon
      sunIcon.style.opacity = "1";
      moonIcon.style.opacity = "0";
      sliderButton.style.transform = "translateX(0)";
    }
  }, [theme]);

  return (
    <button
      id="theme-toggle"
      className="theme-switcher"
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
    >
      <div id="theme-toggle-track" className="theme-toggle-track">
        <HiSun id="sun-icon" className="theme-icon sun-icon" size={18} />
        <div id="theme-toggle-slider-button" className="theme-toggle-slider-button">
          {theme === 'dark' ? (
            <HiMoon className="moon-icon-inner" size={16} />
          ) : (
            <HiSun className="sun-icon-inner" size={16} />
          )}
        </div>
        <HiMoon id="moon-icon" className="theme-icon moon-icon" size={18} />
      </div>
    </button>
  );
};

export default ThemeSwitcher;

