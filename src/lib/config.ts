import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import type { BudgetConfig } from './types'; // Importar el nuevo tipo

// Valor por defecto para la configuración
const defaultBudgetConfig: BudgetConfig = {
    amount: 100000, // valor por defecto del monto
    startDate: new Date().toISOString().slice(0, 10) // Por defecto, hoy
};

const initialConfig: BudgetConfig = browser
	? JSON.parse(localStorage.getItem('budgetConfig') || JSON.stringify(defaultBudgetConfig))
	: defaultBudgetConfig;

// El store ahora es Writable de BudgetConfig
export const budget = writable<BudgetConfig>(initialConfig);

if (browser) {
	budget.subscribe((val) => {
		localStorage.setItem('budgetConfig', JSON.stringify(val));
	});
}