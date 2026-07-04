import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import ExpensePieChart from '../components/charts/ExpensePieChart';
import BudgetProgressBar from '../components/charts/BudgetProgressBar';

export default function Dashboard() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [budgets, setBudgets] = useState([]);
  const [recentExpenses, setRecentExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const [summaryRes, budgetsRes, expensesRes] = await Promise.all([
          api.get('/expenses/summary'),
          api.get('/budgets'),
          api.get('/expenses?limit=5'),
        ]);
        setSummary(summaryRes.data);
        setBudgets(budgetsRes.data.data || []);
        setRecentExpenses(expensesRes.data.data || []);
      } catch (err) {
        setError('Failed to load dashboard data.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const now = new Date();
  const monthLabel = now.toLocaleString('default', { month: 'long', year: 'numeric' });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">
          Good {getGreeting()}, {user?.name}! 👋
        </h1>
        <p className="text-slate-500 mt-1">Here&apos;s your financial snapshot for {monthLabel}.</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">{error}</div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        <SummaryCard
          icon="💸"
          label="Total Spent"
          value={`$${(summary?.total_spent || 0).toFixed(2)}`}
          color="bg-red-50 border-red-100"
          textColor="text-red-700"
        />
        <SummaryCard
          icon="📊"
          label="Categories Active"
          value={summary?.by_category?.length || 0}
          color="bg-indigo-50 border-indigo-100"
          textColor="text-indigo-700"
        />
        <SummaryCard
          icon="🎯"
          label="Budgets Set"
          value={budgets.length}
          color="bg-emerald-50 border-emerald-100"
          textColor="text-emerald-700"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Pie Chart */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h2 className="text-lg font-semibold text-slate-700 mb-4">
            Spending by Category — {monthLabel}
          </h2>
          <ExpensePieChart data={summary?.by_category || []} />
        </div>

        {/* Budget Progress */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-700">Budget Progress</h2>
            <Link to="/budgets" className="text-indigo-600 text-sm hover:underline">
              Manage →
            </Link>
          </div>
          {budgets.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <p className="mb-3">No budgets set yet.</p>
              <Link
                to="/budgets"
                className="inline-block bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700"
              >
                Set Budgets
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {budgets.map((b) => (
                <BudgetProgressBar key={b._id} budget={b} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-700">Recent Transactions</h2>
          <Link to="/expenses" className="text-indigo-600 text-sm hover:underline">
            View all →
          </Link>
        </div>
        {recentExpenses.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <p className="mb-3">No transactions yet.</p>
            <Link
              to="/expenses"
              className="inline-block bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700"
            >
              Add Expense
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {recentExpenses.map((exp) => (
              <div key={exp._id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{exp.category_id?.icon || '📦'}</span>
                  <div>
                    <p className="font-medium text-slate-700">
                      {exp.description || exp.category_id?.name || 'Expense'}
                    </p>
                    <p className="text-xs text-slate-400">
                      {new Date(exp.date).toLocaleDateString()} · {exp.category_id?.name}
                    </p>
                  </div>
                </div>
                <span className="font-semibold text-red-600">-${exp.amount.toFixed(2)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryCard({ icon, label, value, color, textColor }) {
  return (
    <div className={`rounded-2xl border p-6 ${color}`}>
      <div className="flex items-center gap-3">
        <span className="text-3xl">{icon}</span>
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className={`text-2xl font-bold ${textColor}`}>{value}</p>
        </div>
      </div>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 18) return 'afternoon';
  return 'evening';
}
