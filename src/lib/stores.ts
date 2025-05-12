// src/lib/stores.ts
import { writable } from 'svelte/store';
import { browser } from '$app/environment';
// Importamos los tipos
import type { Transaction, BudgetConfig } from './types'; // Asegúrate de importar BudgetConfig también si no lo estaba

// --- Versión actual de la estructura de datos (Transacciones) ---
// Incrementa este número cada vez que cambies la estructura de la interfaz Transaction
const CURRENT_TRANSACTIONS_VERSION = 1; // Versión actual para transacciones

// --- Versión actual de la estructura de datos (Categorías) ---
// Incrementa este número cada vez que cambies la estructura de cómo se guardan las categorías
const CURRENT_CATEGORIES_VERSION = 1; // Versión actual para categorías

// --- Interfaz para los datos guardados en localStorage (Transacciones) ---
interface StoredTransactionsData {
    version: number;
    transactions: Transaction[];
}

// --- Interfaz para los datos guardados en localStorage (Categorías) ---
interface StoredCategoriesData {
    version: number;
    categories: string[]; // Un simple array de strings para las categorías
}

// --- Función para migrar datos de transacciones de una versión antigua a la siguiente ---
// Esta función tomaría los datos de una versión N y los transformaría a N+1
// En este ejemplo, solo manejamos la migración de "sin versión" (o versión 0 implícita) a versión 1
const migrateTransactionsData = (data: any, fromVersion: number): Transaction[] => {
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
         console.log(`Migrando datos de transacciones de versión ${fromVersion} a versión ${CURRENT_TRANSACTIONS_VERSION}`);
         migratedTransactions = migratedTransactions.map((item: any) => {
             // Usamos la lógica de mapeo existente para asegurar la estructura
             const transaction: Transaction = {
                 id: item.id || 'temp-' + Math.random().toString(36).substring(2, 15), // Asegurar un id único básico si falta
                 name: item.name || 'Sin descripción', // Asegurar nombre
                 amount: typeof item.amount === 'number' ? item.amount : 0, // Asegurar monto numérico
                 date: typeof item.date === 'string' && item.date.match(/^\d{4}-\d{2}-\d{2}$/) ? item.date : new Date().toISOString().slice(0, 10), // Asegurar formato de fecha ISO
                 type: (item.type === 'expense' || item.type === 'income') ? item.type : 'expense', // Asegurar el campo 'type'
                 // category es opcional, no necesita chequeo estricto aquí
                 category: item.category
             };
             return transaction;
         });
    }

    // Asegurar que el resultado final es un array de Transaction (aunque la migración ya debería garantizarlo)
    return migratedTransactions as Transaction[];
};

// --- Función para migrar datos de categorías de una versión antigua a la siguiente ---
// Implementa la lógica de migración si cambias la estructura de las categorías en el futuro
const migrateCategoriesData = (data: any, fromVersion: number): string[] => {
    let migratedCategories: any[] = data;

    // Ejemplo: si en la versión 2 cambias la estructura de categorías a objetos { id: string, name: string }
    // if (fromVersion < 2) {
    //    migratedCategories = migratedCategories.map(catName => ({ id: uuid(), name: catName }));
    // }

    // Por ahora, solo aseguramos que sea un array de strings si venía de una versión antigua o formato inesperado
    if (!Array.isArray(migratedCategories)) {
        console.warn(`Datos de categorías inesperados en versión ${fromVersion}. Reiniciando a valores por defecto.`);
        return getDefaultCategories(); // Retorna las categorías por defecto si el formato es incorrecto
    }


    return migratedCategories.filter(item => typeof item === 'string') as string[]; // Asegura que sean strings
};


// --- Función para obtener las categorías por defecto ---
const getDefaultCategories = (): string[] => [
    "Alimentación",
    "Transporte",
    "Entretenimiento",
    "Salud",
    "Educación",
    "Otros",
];


// --- Función para cargar datos de transacciones con versionado y migración ---
const loadTransactionsWithMigration = (): Transaction[] => {
    if (!browser || typeof localStorage === 'undefined') {
        console.warn("localStorage no está disponible para transacciones.");
        return [];
    }

    const data = localStorage.getItem('expenses');

    if (!data) {
        console.log("No hay datos de transacciones guardados, retornando array vacío.");
        return []; // No hay datos guardados
    }

    try {
        const storedData: StoredTransactionsData | any[] = JSON.parse(data);

        let transactions: Transaction[];
        let storedVersion = 0; // Versión por defecto si no se encuentra en los datos

        // Detectar si los datos son del formato antiguo (solo array) o nuevo (objeto con versión)
        if (Array.isArray(storedData)) {
            // Formato antiguo (array de transacciones sin versión)
            console.log("Detectado formato de datos de transacciones antiguo (sin versión).");
            transactions = storedData;
            storedVersion = 0; // Consideramos que los datos antiguos son de versión 0
        } else if (typeof storedData === 'object' && storedData !== null && 'version' in storedData && 'transactions' in storedData) {
            // Formato nuevo (objeto con versión y transacciones)
            console.log(`Detectado formato de datos de transacciones versionado (versión ${storedData.version}).`);
            transactions = storedData.transactions;
            storedVersion = storedData.version;
        } else {
             console.error("Formato de datos de transacciones en localStorage desconocido.");
             // Podrías decidir borrar los datos corruptos aquí si quieres
             // localStorage.removeItem('expenses');
             return [];
        }


        // --- Aplicar migración si la versión almacenada es anterior a la actual ---
        if (storedVersion < CURRENT_TRANSACTIONS_VERSION) {
            console.log(`Migrando datos de transacciones de versión ${storedVersion} a versión ${CURRENT_TRANSACTIONS_VERSION}...`);
            transactions = migrateTransactionsData(transactions, storedVersion);
            console.log("Migración de transacciones completa.");
            // Opcional: Guardar inmediatamente los datos migrados para que la próxima carga sea más rápida
            // try {
            //     localStorage.setItem('expenses', JSON.stringify({ version: CURRENT_TRANSACTIONS_VERSION, transactions }));
            // } catch (e) {
            //     console.error("Error saving migrated transactions data:", e);
            // }
        } else if (storedVersion > CURRENT_TRANSACTIONS_VERSION) {
             console.warn(`La versión de datos de transacciones almacenada (${storedVersion}) es más reciente que la versión de la aplicación (${CURRENT_TRANSACTIONS_VERSION}). Esto podría causar problemas.`);
             // En un caso real, podrías querer no cargar los datos o dar una advertencia al usuario
        } else {
             console.log(`La versión de datos de transacciones almacenada (${storedVersion}) coincide con la versión de la aplicación.`);
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
        console.error("Error loading or parsing transactions data from localStorage:", e);
        // localStorage.removeItem('expenses'); // Opcional: borrar datos corruptos
        return [];
    }
};

// --- Función para cargar datos de categorías con versionado y migración ---
const loadCategoriesWithMigration = (): string[] => {
    if (!browser || typeof localStorage === 'undefined') {
        console.warn("localStorage no está disponible para categorías.");
        return getDefaultCategories(); // Retornar por defecto si no está disponible
    }

    const data = localStorage.getItem('categories'); // Usamos una clave diferente para categorías

    if (!data) {
        console.log("No hay datos de categorías guardados, retornando array por defecto.");
        return getDefaultCategories(); // Retornar por defecto si no hay datos
    }

    try {
        const storedData: StoredCategoriesData | any[] = JSON.parse(data);

        let categories: string[];
        let storedVersion = 0;

        // Detectar formato (similar a transacciones)
        if (Array.isArray(storedData)) {
            // Formato antiguo (array de strings sin versión)
            console.log("Detectado formato de datos de categorías antiguo (sin versión).");
            categories = storedData;
            storedVersion = 0; // Consideramos versión 0
        } else if (typeof storedData === 'object' && storedData !== null && 'version' in storedData && 'categories' in storedData && Array.isArray(storedData.categories)) {
            // Formato nuevo (objeto con versión y array de categorías)
            console.log(`Detectado formato de datos de categorías versionado (versión ${storedData.version}).`);
            categories = storedData.categories;
            storedVersion = storedData.version;
        } else {
             console.error("Formato de datos de categorías en localStorage desconocido.");
             // localStorage.removeItem('categories'); // Opcional: borrar datos corruptos
             return getDefaultCategories(); // Retornar por defecto en caso de formato desconocido
        }

        // Aplicar migración si la versión almacenada es anterior a la actual
        if (storedVersion < CURRENT_CATEGORIES_VERSION) {
            console.log(`Migrando datos de categorías de versión ${storedVersion} a versión ${CURRENT_CATEGORIES_VERSION}...`);
            categories = migrateCategoriesData(categories, storedVersion);
            console.log("Migración de categorías completa.");
            // Opcional: Guardar inmediatamente los datos migrados
            // try {
            //     localStorage.setItem('categories', JSON.stringify({ version: CURRENT_CATEGORIES_VERSION, categories }));
            // } catch (e) {
            //     console.error("Error saving migrated categories data:", e);
            // }
        } else if (storedVersion > CURRENT_CATEGORIES_VERSION) {
             console.warn(`La versión de datos de categorías almacenada (${storedVersion}) es más reciente que la versión de la aplicación (${CURRENT_CATEGORIES_VERSION}). Esto podría causar problemas.`);
             // Podrías decidir no cargar o dar advertencia
        } else {
             console.log(`La versión de datos de categorías almacenada (${storedVersion}) coincide con la versión de la aplicación.`);
        }

        // Asegurar que el resultado final es un array de strings
        return categories.filter(item => typeof item === 'string');


    } catch (e) {
        console.error("Error loading or parsing categories data from localStorage:", e);
        // localStorage.removeItem('categories'); // Opcional: borrar datos corruptos
        return getDefaultCategories(); // Retornar por defecto en caso de error de parseo
    }
};


// --- Stores ---

// Store para las transacciones
const initialExpenses: Transaction[] = loadTransactionsWithMigration();
export const expenses = writable<Transaction[]>(initialExpenses);

if (browser) {
	expenses.subscribe((val) => {
        if (typeof localStorage === 'undefined') {
            console.warn("localStorage no está disponible para transacciones, no se pueden guardar los cambios.");
            return;
        }
		try {
			localStorage.setItem('expenses', JSON.stringify({ version: CURRENT_TRANSACTIONS_VERSION, transactions: val }));
		} catch (e) {
            console.error("Error saving transactions to localStorage:", e);
		}
	});
}

// Store para la configuración del presupuesto
const defaultBudgetConfig: BudgetConfig = {
    amount: 100000, // valor por defecto del monto
    startDate: new Date().toISOString().slice(0, 10) // Por defecto, hoy
};
const initialConfig: BudgetConfig = browser
	? JSON.parse(localStorage.getItem('budgetConfig') || JSON.stringify(defaultBudgetConfig))
	: defaultBudgetConfig;
export const budget = writable<BudgetConfig>(initialConfig);

if (browser) {
	budget.subscribe((val) => {
        if (typeof localStorage === 'undefined') {
             console.warn("localStorage no está disponible para configuración, no se pueden guardar los cambios.");
             return;
        }
		try {
			localStorage.setItem('budgetConfig', JSON.stringify(val));
		} catch (e) {
            console.error("Error saving budget config to localStorage:", e);
		}
	});
}

// --- Store para las categorías ---
const initialCategories: string[] = loadCategoriesWithMigration();
export const categories = writable<string[]>(initialCategories); // Exportamos el store de categorías

if (browser) {
    categories.subscribe((val) => {
         if (typeof localStorage === 'undefined') {
             console.warn("localStorage no está disponible para categorías, no se pueden guardar los cambios.");
             return;
         }
        try {
            // Guardamos las categorías en el nuevo formato versionado
            localStorage.setItem('categories', JSON.stringify({ version: CURRENT_CATEGORIES_VERSION, categories: val }));
        } catch (e) {
            console.error("Error saving categories to localStorage:", e);
        }
    });
}
