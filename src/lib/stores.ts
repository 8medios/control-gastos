// src/lib/stores.ts
import { writable } from 'svelte/store';
import type { Transaction, BudgetConfig } from './types';
import { browser } from '$app/environment';
// Importamos el nuevo tipo Transaction
// import type { Transaction } from './types';

// Función para cargar y "migrar" datos antiguos si es necesario
const loadTransactions = (): Transaction[] => {
    if (!browser) return []; // No localStorage en SSR

    const data = localStorage.getItem('expenses'); // La clave sigue siendo 'expenses' por compatibilidad

    if (!data) return []; // No hay datos guardados

    try {
        const parsed: any[] = JSON.parse(data);

        // Mapeamos los datos parseados para asegurar que cumplen la interfaz Transaction
        // y añadir el campo 'type' si falta (para datos antiguos)
        return parsed.map(item => {
            // Creamos un objeto base con las propiedades esperadas
            const transaction: Transaction = {
                id: item.id || 'temp-' + Math.random(), // Asegurar un id
                name: item.name || 'Sin descripción', // Asegurar nombre
                amount: typeof item.amount === 'number' ? item.amount : 0, // Asegurar monto numérico
                date: typeof item.date === 'string' && item.date.match(/^\d{4}-\d{2}-\d{2}$/) ? item.date : new Date().toISOString().slice(0, 10), // Asegurar formato de fecha ISO
                type: (item.type === 'expense' || item.type === 'income') ? item.type : 'expense', // Añadir type, por defecto 'expense'
                // category es opcional, no necesita chequeo estricto aquí
                category: item.category
            };
            return transaction;
        });

    } catch (e) {
        console.error("Error loading or parsing transactions from localStorage:", e);
        // En caso de error grave de parseo, borrar datos corruptos y retornar vacío
        // localStorage.removeItem('expenses'); // Descomentar si quieres borrar datos corruptos
        return [];
    }
};


// Inicializamos el store con los datos cargados y "migrados"
const initial: Transaction[] = loadTransactions();

// El store ahora es de tipo Writable de Transaction[]
export const expenses = writable<Transaction[]>([]);
export const budget = writable<BudgetConfig>({ amount: 0, startDate: '' });
export const categories = writable<string[]>(['Comida', 'Transporte', 'Entretenimiento']); // Or whatever your initial categories are

if (browser) {
	expenses.subscribe((val) => {
		// Guardamos los datos actualizados (que ya tienen el campo type)
		localStorage.setItem('expenses', JSON.stringify(val));
	});
}