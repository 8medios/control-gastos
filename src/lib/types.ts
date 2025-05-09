export interface Expense {
  id: string;
  name: string;
  amount: number;
  date: string; // formato ISO yyyy-mm-dd
  category?: string; // nuevo campo opcional
}
