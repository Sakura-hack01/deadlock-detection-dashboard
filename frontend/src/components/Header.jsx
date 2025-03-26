import React from 'react';

function Header({ toggleTheme, theme }) {
  return (
    <header className="bg-gray-800 p-4 flex justify-between items-center">
      <h1 className="text-xl font-semibold">Deadlock Detection Dashboard</h1>
      <button
        onClick={toggleTheme}
        className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700"
      >
        {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
      </button>
    </header>
  );
}

export default Header;