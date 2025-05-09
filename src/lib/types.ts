export interface Expense {
  id: string;
  name: string;
  amount: number;
  date: string; // formato ISO yyyy-mm-dd
  category?: string; // nuevo campo opcional
}
export interface BudgetConfig {
  amount: number;
  startDate: string; // formato ISO YYYY-mm-dd para la fecha de inicio del periodo
}