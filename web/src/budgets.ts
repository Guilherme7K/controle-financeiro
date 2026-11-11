import type { Budget, CategoryTotal } from '../../shared/types';
export function calculateBudgets(budgets: Budget[], expenses: CategoryTotal[]) {
  return budgets.map((budget) => {
    const spent =
      expenses.find((item) => item.category === budget.category)?.totalCents ?? 0;
    const percent = (spent / budget.limitCents) * 100;
    const status =
      spent > budget.limitCents ? 'over' : percent >= 80 ? 'warning' : 'normal';
    return { ...budget, spent, percent, status };
  });
}
