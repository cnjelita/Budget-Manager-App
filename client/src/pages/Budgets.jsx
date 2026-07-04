import { useEffect, useState, useCallback } from 'react';
import api from '../api/axios';
import BudgetProgressBar from '../components/charts/BudgetProgressBar';

export default function Budgets() {
  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ category_id: '', amount_limit: '', month_year: currentMonthYear() });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [budgetsRes, catRes] = await Promise.all([
        api.get('/budgets'),
        api.get('/categories'),
      ]);
      setBudgets(budgetsRes.data.data || []);
      setCategories(catRes.data.data || []);
    } catch (err) {
      setError('Failed to load budgets.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleFormChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await api.post('/budgets', form);
      setShowForm(false);
      setForm({ category_id: '', amount_limit: '', month_year: currentMonthYear() });
      fetchData();
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.response?.data?.errors?.[0]?.msg ||
        'Failed to save budget.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this budget?')) return;
    try {
      await api.delete(`/budgets/${id}`);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const now = new Date();
  const monthLabel = now.toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Budgets</h1>
          <p className="text-slate-500 mt-1">Monthly limits for {monthLabel}</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-5 py-2.5 rounded-lg transition-colors"
        >
          + Set Budget
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
        </div>
      ) : budgets.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 text-center py-16 text-slate-400">
          <p className="text-lg mb-3">No budgets set for this month.</p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-block bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700"
          >
            Set your first budget
          </button>
        </div>
      ) : (
        <>
          {/* Summary row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <StatCard
              label="Total Budget"
              value={`$${budgets.reduce((s, b) => s + b.amount_limit, 0).toFixed(2)}`}
              color="text-indigo-700"
            />
            <StatCard
              label="Total Spent"
              value={`$${budgets.reduce((s, b) => s + (b.spent || 0), 0).toFixed(2)}`}
              color="text-red-600"
            />
            <StatCard
              label="Total Remaining"
              value={`$${budgets.reduce((s, b) => s + (b.remaining || 0), 0).toFixed(2)}`}
              color="text-emerald-600"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {budgets.map((b) => (
              <div key={b._id} className="relative group">
                <BudgetProgressBar budget={b} />
                <button
                  onClick={() => handleDelete(b._id)}
                  className="absolute top-3 right-3 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 text-xs font-medium"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Budget Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-slate-800 mb-5">Set Budget</h2>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Category *</label>
                <select
                  name="category_id"
                  value={form.category_id}
                  onChange={handleFormChange}
                  required
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
                >
                  <option value="">Select a category</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.icon} {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Monthly Limit ($) *</label>
                <input
                  type="number"
                  name="amount_limit"
                  value={form.amount_limit}
                  onChange={handleFormChange}
                  required
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Month *</label>
                <input
                  type="month"
                  name="month_year"
                  value={form.month_year}
                  onChange={handleFormChange}
                  required
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setError(''); }}
                  className="flex-1 px-4 py-2.5 border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-semibold py-2.5 rounded-lg transition-colors"
                >
                  {submitting ? 'Saving…' : 'Save Budget'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
    </div>
  );
}

function currentMonthYear() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}
