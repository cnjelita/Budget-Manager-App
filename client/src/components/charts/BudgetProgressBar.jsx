export default function BudgetProgressBar({ budget }) {
  const { category_id, amount_limit, spent = 0, remaining = 0, progress_percent = 0 } = budget;
  const pct = parseFloat(progress_percent);
  const isOver = pct >= 100;
  const isWarning = pct >= 80 && !isOver;

  const barColor = isOver
    ? 'bg-red-500'
    : isWarning
    ? 'bg-amber-400'
    : 'bg-emerald-500';

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">{category_id?.icon || '📦'}</span>
          <span className="font-medium text-slate-700">{category_id?.name || 'Category'}</span>
        </div>
        <span className={`text-sm font-semibold ${isOver ? 'text-red-600' : 'text-slate-500'}`}>
          ${spent.toFixed(2)} / ${amount_limit.toFixed(2)}
        </span>
      </div>
      <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
        <div
          className={`h-3 rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
      <div className="flex justify-between mt-1 text-xs text-slate-400">
        <span>{pct.toFixed(1)}% used</span>
        <span>
          {isOver
            ? `$${(spent - amount_limit).toFixed(2)} over budget`
            : `$${remaining.toFixed(2)} remaining`}
        </span>
      </div>
    </div>
  );
}
