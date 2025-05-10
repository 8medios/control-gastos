// Interfaz para una Transacción (puede ser gasto o ingreso)
export interface Transaction {
  id: string;
  name: string; // Descripción de la transacción
  amount: number; // Monto (positivo)
  date: string; // formato ISO - mm-dd
  category?: string; // campo opcional (más relevante para gastos, pero podría usarse para ingresos, ej. 'Salario', 'Regalo')
  type: 'expense' | 'income'; // Nuevo campo para indicar si es gasto o ingreso
}

// Interfaz existente para la configuración del presupuesto
export interface BudgetConfig {
  amount: number;
  startDate: string; // formato ISO - mm-dd para la fecha de inicio del periodo
}