import React from 'react';
import { Link } from 'react-router-dom';

function Sidebar() {
  return (
    <div className="w-64 bg-gray-800 h-full p-4">
      <h2 className="text-2xl font-bold mb-6">Deadlock Detection</h2>
      <nav>
        <ul>
          <li className="mb-4">
            <Link to="/" className="text-lg hover:text-blue-400">Dashboard</Link>
          </li>
        </ul>
      </nav>
    </div>
  );
}

export default Sidebar;