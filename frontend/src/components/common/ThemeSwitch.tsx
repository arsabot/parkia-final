import React from 'react';
import { Moon, Sun } from 'lucide-react';

interface ThemeSwitchProps {
  isDark: boolean;
  onToggle: () => void;
  className?: string;
}

export const ThemeSwitch: React.FC<ThemeSwitchProps> = ({
  isDark,
  onToggle,
  className = '',
}) => {
  const label = isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro';

  return (
    <button
      type="button"
      className={`pk-theme-switch ${isDark ? 'pk-theme-switch--dark' : 'pk-theme-switch--light'} ${className}`}
      onClick={onToggle}
      aria-pressed={isDark}
      aria-label={label}
      title={label}
    >
      <Moon className="pk-theme-switch__icon pk-theme-switch__moon" aria-hidden="true" />
      <Sun className="pk-theme-switch__icon pk-theme-switch__sun" aria-hidden="true" />
      <span className="pk-theme-switch__thumb" aria-hidden="true" />
    </button>
  );
};
