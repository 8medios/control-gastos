import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import type { BudgetConfig } from './types'; // Importar el tipo

// Valor por defecto para la configuración
const defaultBudgetConfig: BudgetConfig = {
    amount: 100000, // valor por defecto del monto
    startDate: new Date().toISOString().slice(0, 10) // Por defecto, hoy
};

// Cargar configuración inicial desde localStorage o usar por defecto
const initialConfig: BudgetConfig = browser
	? JSON.parse(localStorage.getItem('budgetConfig') || JSON.stringify(defaultBudgetConfig))
	: defaultBudgetConfig;

// Crear store writable para la configuración del presupuesto
export const budget = writable<BudgetConfig>(initialConfig);

// Suscribirse a cambios en el store para guardar en localStorage (solo en navegador)
if (browser) {
	budget.subscribe((val) => {
        // Verificar si localStorage está disponible antes de intentar guardar
        if (typeof localStorage === 'undefined') {
             console.warn("localStorage no está disponible para configuración, no se pueden guardar los cambios.");
             return;
        }
		try {
			localStorage.setItem('budgetConfig', JSON.stringify(val));
		} catch (e) {
            // Manejar errores al guardar (ej. cuota excedida)
            console.error("Error saving budget config to localStorage:", e);
            // Aquí podrías notificar al usuario que no se pudieron guardar los datos
		}
	});
}
