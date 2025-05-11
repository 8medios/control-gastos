// src/lib/stores.ts
import { writable } from 'svelte/store';
import { browser } from '$app/environment';
// Importamos el nuevo tipo Transaction
import type { Transaction } from './types';

// --- Versión actual de la estructura de datos ---
// Incrementa este número cada vez que cambies la estructura de la interfaz Transaction
const CURRENT_DATA_VERSION = 1; // Empezamos con la versión 1

// --- Interfaz para los datos guardados en localStorage ---
// Ahora guardaremos un objeto que contiene la versión y las transacciones
interface StoredData {
    version: number;
    transactions: Transaction[];
}

// --- Función para migrar datos de una versión antigua a la siguiente ---
// Esta función tomaría los datos de una versión N y los transformaría a N+1
// En este ejemplo, solo manejamos la migración de "sin versión" (o versión 0 implícita) a versión 1
const migrateData = (data: any, fromVersion: number): Transaction[] => {
    let migratedTransactions: any[] = data; // Empezamos con los datos de entrada

    // --- Lógica de migración paso a paso ---
    // Si en el futuro tienes más versiones (ej. de 1 a 2, de 2 a 3), añadirías más bloques `if`
    // if (fromVersion < 2) {
    //    migratedTransactions = migratedTransactions.map(item => { /* transformar de v1 a v2 */ });
    // }
    // if (fromVersion < 3) {
    //    migratedTransactions = migratedTransactions.map(item => { /* transformar de v2 a v3 */ });
    // }
    // ... y así sucesivamente

    // Migración de "sin versión" (o < 1) a versión 1: Asegurar la estructura Transaction y añadir 'type'
    if (fromVersion < 1) {
         console.log(`Migrando datos de versión ${fromVersion} a versión ${CURRENT_DATA_VERSION}`);
         migratedTransactions = migratedTransactions.map((item: any) => {
             // Usamos la lógica de mapeo existente para asegurar la estructura
             const transaction: Transaction = {
                 id: item.id || 'temp-' + Math.random().toString(36).substring(2, 15),
                 name: item.name || 'Sin descripción',
                 amount: typeof item.amount === 'number' ? item.amount : 0,
                 date: typeof item.date === 'string' && item.date.match(/^\d{4}-\d{2}-\d{2}$/) ? item.date : new Date().toISOString().slice(0, 10),
                 type: (item.type === 'expense' || item.type === 'income') ? item.type : 'expense', // Asegurar el campo 'type'
                 category: item.category // category es opcional
             };
             return transaction;
         });
    }

    // Asegurar que el resultado final es un array de Transaction (aunque la migración ya debería garantizarlo)
    return migratedTransactions as Transaction[];
};


// Función para cargar datos con versionado y migración
const loadTransactionsWithMigration = (): Transaction[] => {
    // Verificar si localStorage está disponible
    if (!browser || typeof localStorage === 'undefined') {
        console.warn("localStorage no está disponible.");
        return [];
    }

    const data = localStorage.getItem('expenses');

    if (!data) {
        console.log("No hay datos guardados, retornando array vacío.");
        return []; // No hay datos guardados
    }

    try {
        const storedData: StoredData | any[] = JSON.parse(data);

        let transactions: Transaction[];
        let storedVersion = 0; // Versión por defecto si no se encuentra en los datos

        // Detectar si los datos son del formato antiguo (solo array) o nuevo (objeto con versión)
        if (Array.isArray(storedData)) {
            // Formato antiguo (array de transacciones sin versión)
            console.log("Detectado formato de datos antiguo (sin versión).");
            transactions = storedData;
            storedVersion = 0; // Consideramos que los datos antiguos son de versión 0
        } else if (typeof storedData === 'object' && storedData !== null && 'version' in storedData && 'transactions' in storedData) {
            // Formato nuevo (objeto con versión y transacciones)
            console.log(`Detectado formato de datos versionado (versión ${storedData.version}).`);
            transactions = storedData.transactions;
            storedVersion = storedData.version;
        } else {
             console.error("Formato de datos en localStorage desconocido.");
             // Podrías decidir borrar los datos corruptos aquí si quieres
             // localStorage.removeItem('expenses');
             return [];
        }


        // --- Aplicar migración si la versión almacenada es anterior a la actual ---
        if (storedVersion < CURRENT_DATA_VERSION) {
            console.log(`Migrando datos de versión ${storedVersion} a versión ${CURRENT_DATA_VERSION}...`);
            transactions = migrateData(transactions, storedVersion);
            console.log("Migración completa.");
            // Opcional: Guardar inmediatamente los datos migrados para que la próxima carga sea más rápida
            // try {
            //     localStorage.setItem('expenses', JSON.stringify({ version: CURRENT_DATA_VERSION, transactions }));
            // } catch (e) {
            //     console.error("Error saving migrated data to localStorage:", e);
            // }
        } else if (storedVersion > CURRENT_DATA_VERSION) {
             console.warn(`La versión de datos almacenada (${storedVersion}) es más reciente que la versión de la aplicación (${CURRENT_DATA_VERSION}). Esto podría causar problemas.`);
             // En un caso real, podrías querer no cargar los datos o dar una advertencia al usuario
        } else {
             console.log(`La versión de datos almacenada (${storedVersion}) coincide con la versión de la aplicación.`);
        }


        // Asegurar que el resultado final es un array de Transaction[]
        // Esto también mapeará los datos de la versión 0 si no se hizo en migrateData (redundante si migrateData está bien, pero seguro)
         return transactions.map((item: any) => {
             const transaction: Transaction = {
                 id: item.id || 'temp-' + Math.random().toString(36).substring(2, 15),
                 name: item.name || 'Sin descripción',
                 amount: typeof item.amount === 'number' ? item.amount : 0,
                 date: typeof item.date === 'string' && item.date.match(/^\d{4}-\d{2}-\d{2}$/) ? item.date : new Date().toISOString().slice(0, 10),
                 type: (item.type === 'expense' || item.type === 'income') ? item.type : 'expense',
                 category: item.category
             };
             return transaction;
         });


    } catch (e) {
        console.error("Error loading or parsing data from localStorage:", e);
        // En caso de error grave de parseo, podrías notificar al usuario
        // o decidir si borrar los datos corruptos.
        // localStorage.removeItem('expenses');
        return [];
    }
};


// Inicializamos el store con los datos cargados y migrados
const initial: Transaction[] = loadTransactionsWithMigration();

// El store ahora es de tipo Writable de Transaction[]
export const expenses = writable<Transaction[]>(initial);

if (browser) {
	expenses.subscribe((val) => {
        // Verificar si localStorage está disponible antes de intentar guardar
        if (typeof localStorage === 'undefined') {
            console.warn("localStorage no está disponible, no se pueden guardar los cambios.");
            return;
        }
		try {
            // Guardamos los datos en el nuevo formato: objeto con versión y array de transacciones
			localStorage.setItem('expenses', JSON.stringify({ version: CURRENT_DATA_VERSION, transactions: val })); // MODIFICADO: Guardando objeto versionado
		} catch (e) {
            // Manejar errores al guardar (ej. cuota excedida)
            console.error("Error saving transactions to localStorage:", e);
            // Aquí podrías notificar al usuario que no se pudieron guardar los datos
		}
	});
}

