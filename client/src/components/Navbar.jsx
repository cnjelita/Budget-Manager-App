import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLink = (to, label) => (
    <Link
      to={to}
      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
        location.pathname === to
          ? 'bg-indigo-700 text-white'
          : 'text-indigo-100 hover:bg-indigo-500 hover:text-white'
      }`}
    >
      {label}
    </Link>
  );

  return (
    <nav className="bg-indigo-600 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl">💰</span>
            <span className="text-white font-bold text-xl">BudgetManager</span>
          </Link>

          {user && (
            <div className="flex items-center gap-2">
              {navLink('/dashboard', 'Dashboard')}
              {navLink('/expenses', 'Expenses')}
              {navLink('/budgets', 'Budgets')}
              <span className="text-indigo-200 text-sm ml-2">
                Hi, {user.name}
              </span>
              <button
                onClick={handleLogout}
                className="ml-2 px-3 py-2 rounded-md text-sm font-medium text-indigo-100 hover:bg-indigo-500 hover:text-white transition-colors"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
