import { useEffect, useState, useCallback } from 'react';
import api from '../api/axios';

const EMPTY_FORM = { category_id: '', amount: '', date: '', description: '' };

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  // Filter state
  const [filters, setFilters] = useState({
    category: '',
    startDate: '',
    endDate: '',
    minAmount: '',
    maxAmount: '',
  });

  const buildQuery = useCallback(
    (p = page) => {
      const params = new URLSearchParams({ page: p, limit: 10 });
      if (filters.category) params.set('category', filters.category);
      if (filters.startDate) params.set('startDate', filters.startDate);
      if (filters.endDate) params.set('endDate', filters.endDate);
      if (filters.minAmount) params.set('minAmount', filters.minAmount);
      if (filters.maxAmount) params.set('maxAmount', filters.maxAmount);
      return params.toString();
    },
    [page, filters]
  );

  const fetchExpenses = useCallback(
    async (p = page) => {
      setLoading(true);
      try {
        const { data } = await api.get(`/expenses?${buildQuery(p)}`);
        setExpenses(data.data);
        setTotal(data.total);
        setPages(data.pages);
      } catch (err) {
        setError('Failed to load expenses.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    },
    [buildQuery, page]
  );

  const fetchCategories = useCallback(async () => {
    try {
      const { data } = await api.get('/categories');
      setCategories(data.data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchExpenses(page);
  }, [page, filters]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleFilterChange = (e) => {
    setFilters((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({ category: '', startDate: '', endDate: '', minAmount: '', maxAmount: '' });
    setPage(1);
  };

  const openCreate = () => {
    setEditId(null);
    setForm({ ...EMPTY_FORM, date: todayStr() });
    setShowForm(true);
  };

  const openEdit = (exp) => {
    setEditId(exp._id);
    setForm({
      category_id: exp.category_id?._id || '',
      amount: exp.amount,
      date: exp.date?.split('T')[0] || '',
      description: exp.description || '',
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditId(null);
    setForm(EMPTY_FORM);
    setError('');
  };

  const handleFormChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      if (editId) {
        await api.put(`/expenses/${editId}`, form);
      } else {
        await api.post('/expenses', form);
      }
      closeForm();
      fetchExpenses(page);
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Failed to save expense.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this expense?')) return;
    try {
      await api.delete(`/expenses/${id}`);
      fetchExpenses(page);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Expenses</h1>
          <p className="text-slate-500 mt-1">{total} transaction{total !== 1 ? 's' : ''} found</p>
        </div>
        <button
          onClick={openCreate}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-5 py-2.5 rounded-lg transition-colors"
        >
          + Add Expense
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 mb-6">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
          Filters
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <select
            name="category"
            value={filters.category}
            onChange={handleFilterChange}
            className="col-span-1 px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>
                {c.icon} {c.name}
              </option>
            ))}
          </select>
          <input
            type="date"
            name="startDate"
            value={filters.startDate}
            onChange={handleFilterChange}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            placeholder="Start date"
          />
          <input
            type="date"
            name="endDate"
            value={filters.endDate}
            onChange={handleFilterChange}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            placeholder="End date"
          />
          <input
            type="number"
            name="minAmount"
            value={filters.minAmount}
            onChange={handleFilterChange}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            placeholder="Min $"
            min="0"
            step="0.01"
          />
          <input
            type="number"
            name="maxAmount"
            value={filters.maxAmount}
            onChange={handleFilterChange}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            placeholder="Max $"
            min="0"
            step="0.01"
          />
        </div>
        {Object.values(filters).some(Boolean) && (
          <button
            onClick={clearFilters}
            className="mt-3 text-sm text-indigo-600 hover:underline"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Expense list */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
          </div>
        ) : expenses.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <p className="text-lg">No expenses found.</p>
            <button
              onClick={openCreate}
              className="mt-4 inline-block bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700"
            >
              Add your first expense
            </button>
          </div>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="text-left px-5 py-3 text-slate-500 font-medium">Date</th>
                  <th className="text-left px-5 py-3 text-slate-500 font-medium">Category</th>
                  <th className="text-left px-5 py-3 text-slate-500 font-medium">Description</th>
                  <th className="text-right px-5 py-3 text-slate-500 font-medium">Amount</th>
                  <th className="text-center px-5 py-3 text-slate-500 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {expenses.map((exp) => (
                  <tr key={exp._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3 text-slate-600 whitespace-nowrap">
                      {new Date(exp.date).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700">
                        {exp.category_id?.icon} {exp.category_id?.name || '—'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-600 max-w-xs truncate">
                      {exp.description || <span className="text-slate-300 italic">No description</span>}
                    </td>
                    <td className="px-5 py-3 text-right font-semibold text-red-600">
                      -${exp.amount.toFixed(2)}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <button
                        onClick={() => openEdit(exp)}
                        className="text-indigo-500 hover:text-indigo-700 mr-3 text-xs font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(exp._id)}
                        className="text-red-400 hover:text-red-600 text-xs font-medium"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {pages > 1 && (
              <div className="flex items-center justify-center gap-2 p-4 border-t border-slate-100">
                <button
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="px-3 py-1.5 rounded-lg border text-sm disabled:opacity-40 hover:bg-slate-50"
                >
                  ← Prev
                </button>
                <span className="text-sm text-slate-500">
                  Page {page} of {pages}
                </span>
                <button
                  disabled={page === pages}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-3 py-1.5 rounded-lg border text-sm disabled:opacity-40 hover:bg-slate-50"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create / Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-slate-800 mb-5">
              {editId ? 'Edit Expense' : 'Add Expense'}
            </h2>

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
                <label className="block text-sm font-medium text-slate-700 mb-1">Amount ($) *</label>
                <input
                  type="number"
                  name="amount"
                  value={form.amount}
                  onChange={handleFormChange}
                  required
                  min="0.01"
                  step="0.01"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Date *</label>
                <input
                  type="date"
                  name="date"
                  value={form.date}
                  onChange={handleFormChange}
                  required
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Description (optional)
                </label>
                <input
                  type="text"
                  name="description"
                  value={form.description}
                  onChange={handleFormChange}
                  maxLength={200}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
                  placeholder="e.g. Weekly grocery run"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeForm}
                  className="flex-1 px-4 py-2.5 border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-semibold py-2.5 rounded-lg transition-colors"
                >
                  {submitting ? 'Saving…' : editId ? 'Update' : 'Add Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function todayStr() {
  return new Date().toISOString().split('T')[0];
}
