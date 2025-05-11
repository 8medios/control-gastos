// src/lib/stores.ts
import { writable } from 'svelte/store';
import { browser } from '$app/environment';
// Importamos el nuevo tipo Transaction
import type { Transaction } from './types';

// Función para cargar y "migrar" datos antiguos si es necesario
const loadTransactions = (): Transaction[] => {
    // Verificar si localStorage está disponible antes de intentar acceder
    if (!browser || typeof localStorage === 'undefined') {
        console.warn("localStorage no está disponible.");
        return []; // Retornar vacío si no está disponible
    }

    const data = localStorage.getItem('expenses'); // La clave sigue siendo 'expenses' por compatibilidad

    if (!data) return []; // No hay datos guardados

    try {
        const parsed: any[] = JSON.parse(data);

        // Mapeamos los datos parseados para asegurar que cumplen la interfaz Transaction
        // y añadir el campo 'type' si falta (para datos antiguos)
        return parsed.map(item => {
            // Creamos un objeto base con las propiedades esperadas
            const transaction: Transaction = {
                id: item.id || 'temp-' + Math.random().toString(36).substring(2, 15), // Asegurar un id único básico si falta
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
        // En caso de error grave de parseo, podrías notificar al usuario
        // o decidir si borrar los datos corruptos. Por ahora, solo registramos el error.
        // localStorage.removeItem('expenses'); // Descomentar si quieres borrar datos corruptos
        return [];
    }
};


// Inicializamos el store con los datos cargados y "migrados"
const initial: Transaction[] = loadTransactions();

// El store ahora es de tipo Writable de Transaction[]
export const expenses = writable<Transaction[]>(initial); // El nombre del store sigue siendo 'expenses' por consistencia si no queremos renombrarlo en todos lados

if (browser) {
	expenses.subscribe((val) => {
        // Verificar si localStorage está disponible antes de intentar guardar
        if (typeof localStorage === 'undefined') {
            console.warn("localStorage no está disponible, no se pueden guardar los cambios.");
            // Aquí podrías mostrar un mensaje al usuario
            return;
        }
		try {
            // Guardamos los datos actualizados (que ya tienen el campo type)
			localStorage.setItem('expenses', JSON.stringify(val));
		} catch (e) {
            // Manejar errores al guardar (ej. cuota excedida)
            console.error("Error saving transactions to localStorage:", e);
            // Aquí podrías notificar al usuario que no se pudieron guardar los datos
		}
	});
}

