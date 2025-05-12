<script lang="ts">
	// Importar el store de presupuesto y categorías
	import { budget, categories, expenses } from "$lib/stores"; // Importar los stores necesarios
	import type { BudgetConfig, Transaction } from "$lib/types"; // Importar Transaction type
    import ConfirmModal from "$lib/components/ConfirmModal.svelte"; // Importar el modal de confirmación

	// Suscribirse al store budget y obtener su valor actual
	let currentConfig: BudgetConfig = $budget;

	const handleSubmit = () => {
		// Aseguramos que el monto sea un número positivo
		if (currentConfig.amount < 0) {
			currentConfig.amount = 0;
		}
		// La fecha de inicio ya debería ser una string ISO-MM-DD por el input type="date"

		// Actualizamos el store con la nueva configuración del presupuesto
		budget.set(currentConfig);

		// Mostrar una notificación (puedes reemplazar esto por un modal o toast)
		alert('Configuración de presupuesto guardada');
	};

	// --- Lógica de Gestión de Categorías ---

	// Variable para el input de nueva categoría
	let newCategoryName = '';
	let categoryError: string | null = null; // Estado para errores de categoría

	// Función para añadir una nueva categoría
	const addCategory = () => {
		const trimmedCategoryName = newCategoryName.trim();

		// Validar que el nombre no esté vacío y no sea un duplicado
		if (!trimmedCategoryName) {
			categoryError = "El nombre de la categoría no puede estar vacío.";
			return;
		}
		if ($categories.includes(trimmedCategoryName)) {
			categoryError = `La categoría "${trimmedCategoryName}" ya existe.`;
			return;
		}

		// Limpiar errores si la validación pasa
		categoryError = null;

		// Actualizar el store de categorías
		categories.update(cats => {
			// Añadir la nueva categoría al final de la lista
			return [...cats, trimmedCategoryName];
		});

		// Limpiar el input después de añadir
		newCategoryName = '';

		// Opcional: Mostrar una notificación
		alert(`Categoría "${trimmedCategoryName}" añadida.`);
	};

	// Función para manejar la pulsación de tecla en el input de categoría
	const handleCategoryKeydown = (event: KeyboardEvent) => {
		// Si se presiona Enter, añadir la categoría
		if (event.key === 'Enter') {
			event.preventDefault(); // Prevenir el envío del formulario si el input está dentro de uno
			addCategory();
		}
	};

    // --- Lógica para Editar Categorías ---
    let editingCategory: string | null = null; // La categoría que se está editando
    let editedCategoryName: string = ''; // El valor del input de edición
    let editCategoryError: string | null = null; // Estado para errores de edición

    const startEditingCategory = (category: string) => {
        editingCategory = category; // Establecer la categoría a editar
        editedCategoryName = category; // Inicializar el input de edición con el nombre actual
        editCategoryError = null; // Limpiar errores previos
    };

    const cancelEditingCategory = () => {
        editingCategory = null; // Cancelar edición
        editedCategoryName = ''; // Limpiar input
        editCategoryError = null; // Limpiar errores
    };

    const saveEditedCategory = (originalCategory: string) => {
        const trimmedEditedName = editedCategoryName.trim();

        // Validar nombre no vacío y no duplicado (excepto si es el nombre original)
        if (!trimmedEditedName) {
            editCategoryError = "El nombre de la categoría no puede estar vacío.";
            return;
        }
        if (trimmedEditedName !== originalCategory && $categories.includes(trimmedEditedName)) {
            editCategoryError = `La categoría "${trimmedEditedName}" ya existe.`;
            return;
        }

        // Limpiar errores si la validación pasa
        editCategoryError = null;

        // Actualizar el store de categorías
        categories.update(cats => {
            return cats.map(cat => {
                if (cat === originalCategory) {
                    return trimmedEditedName; // Reemplazar la categoría original por la editada
                }
                return cat;
            });
        });

        // Opcional: Actualizar las transacciones que usan esta categoría
        // Esto es importante para mantener la integridad de los datos.
        expenses.update((txs: Transaction[]) => {
            return txs.map((tx: Transaction) => {
                if (tx.type === 'expense' && tx.category === originalCategory) {
                    // Crear una nueva transacción con la categoría actualizada
                    return { ...tx, category: trimmedEditedName };
                }
                return tx;
            });
        });


        // Finalizar edición
        editingCategory = null;
        editedCategoryName = '';

        // Opcional: Mostrar notificación
        alert(`Categoría "${originalCategory}" editada a "${trimmedEditedName}".`);
    };

    const handleEditKeydown = (event: KeyboardEvent, originalCategory: string) => {
        // Si se presiona Enter en el input de edición, guardar cambios
        if (event.key === 'Enter') {
            event.preventDefault();
            saveEditedCategory(originalCategory);
        }
         // Si se presiona Escape, cancelar edición
        if (event.key === 'Escape') {
            event.preventDefault();
            cancelEditingCategory();
        }
    };


    // --- Lógica para Eliminar Categorías ---
    let isConfirmDeleteCategoryOpen = false;
    let categoryToDelete: string | null = null;
    let confirmDeleteCategoryMessage = "";

    const requestDeleteCategory = (category: string) => {
        categoryToDelete = category;
        confirmDeleteCategoryMessage = `¿Estás seguro de que quieres eliminar la categoría "${category}"? Las transacciones con esta categoría pasarán a "Sin categoría".`;
        isConfirmDeleteCategoryOpen = true;
    };

    const confirmDeleteCategory = () => {
        if (categoryToDelete) {
            // Eliminar la categoría del store
            categories.update(cats => cats.filter(cat => cat !== categoryToDelete));

            // Actualizar las transacciones que usaban esta categoría a "Sin categoría"
             expenses.update((txs: Transaction[]) => {
                 return txs.map((tx: Transaction) => {
                     if (tx.type === 'expense' && tx.category === categoryToDelete) {
                         // Crear una nueva transacción con la categoría cambiada a "Sin categoría"
                         return { ...tx, category: 'Sin categoría' };
                     }
                     return tx;
                 });
             });


            // Opcional: Mostrar notificación
            alert(`Categoría "${categoryToDelete}" eliminada.`);
        }
        isConfirmDeleteCategoryOpen = false;
        categoryToDelete = null;
        confirmDeleteCategoryMessage = "";
    };

    const cancelDeleteCategory = () => {
        isConfirmDeleteCategoryOpen = false;
        categoryToDelete = null;
        confirmDeleteCategoryMessage = "";
    };


</script>

<main class="p-4 flex flex-col gap-6 mx-auto w-full lg:max-w-screen-xl xl:max-w-screen-2xl">

	<section class="bg-white dark:bg-gray-800 shadow rounded-xl p-6 space-y-4">
		<h2 class="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
			Configuración del Presupuesto
		</h2>
		<form on:submit|preventDefault={handleSubmit} class="space-y-4">
			<div>
				<label for="budget-amount" class="block mb-1 font-medium text-gray-700 dark:text-gray-200">Presupuesto mensual ($)</label>
				<input
					id="budget-amount"
					type="number"
					bind:value={currentConfig.amount}
					class="w-full p-2 border rounded border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
					min="0"
				/>
			</div>
			<div>
				<label for="budget-start-date" class="block mb-1 font-medium text-gray-700 dark:text-gray-200">Fecha de inicio del periodo</label>
				<input
					id="budget-start-date"
					type="date"
					bind:value={currentConfig.startDate}
					class="w-full p-2 rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
				/>
			</div>
			<button
				type="submit"
				class="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-semibold transition"
			>
				Guardar Configuración del Presupuesto
			</button>
		</form>
	</section>

	<section class="bg-white dark:bg-gray-800 shadow rounded-xl p-6 space-y-4">
		<h2 class="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
			Gestión de Categorías
		</h2>

		<div class="flex flex-col sm:flex-row gap-2">
			<input
				type="text"
				placeholder="Nueva categoría..."
				bind:value={newCategoryName}
				on:keydown={handleCategoryKeydown}
				class="flex-grow p-2 rounded border {categoryError ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} dark:bg-gray-700 dark:text-white"
			/>
			<button
				on:click={addCategory}
				class="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-lg font-semibold transition flex-shrink-0"
			>
				Añadir Categoría
			</button>
		</div>
		{#if categoryError}
			<p class="text-red-500 text-sm mt-1">{categoryError}</p>
		{/if}


		<div class="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
			<h3 class="text-xl font-semibold mb-3 text-gray-800 dark:text-white">Categorías Existentes</h3>
			{#if $categories.length === 0}
				<p class="text-gray-500 dark:text-gray-400">Aún no hay categorías definidas. Añade algunas arriba.</p>
			{:else}
				<ul class="space-y-2">
					{#each $categories as category (category)}
						<li class="flex justify-between items-center bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
							{#if editingCategory === category}
                                <input
                                    type="text"
                                    bind:value={editedCategoryName}
                                    on:keydown={(e) => handleEditKeydown(e, category)}
                                    class="flex-grow p-1 mr-2 rounded border {editCategoryError ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} dark:bg-gray-600 dark:text-white"
                                />
                                <div class="flex gap-2 flex-shrink-0">
                                    <button
                                        on:click={() => saveEditedCategory(category)}
                                        class="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-600 text-sm font-medium"
                                    >Guardar</button>
                                    <button
                                        on:click={cancelEditingCategory}
                                        class="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-600 text-sm font-medium"
                                    >Cancelar</button>
                                </div>
                            {:else}
                                <span class="text-gray-800 dark:text-gray-200">{category}</span>
							    <div class="flex gap-2 flex-shrink-0">
								    <button
                                        on:click={() => startEditingCategory(category)}
                                        class="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-600 text-sm font-medium"
                                    >Editar</button>
								    <button
                                        on:click={() => requestDeleteCategory(category)}
                                        class="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-600 text-sm font-medium"
                                    >Eliminar</button>
							    </div>
                            {/if}
						</li>
                        {#if editingCategory === category && editCategoryError}
                            <p class="text-red-500 text-sm mt-1 ml-3">{editCategoryError}</p>
                        {/if}
					{/each}
				</ul>
			{/if}
		</div>
	</section>

    {#if isConfirmDeleteCategoryOpen}
        <ConfirmModal
            title="Confirmar Eliminación de Categoría"
            message={confirmDeleteCategoryMessage}
            confirmButtonText="Sí, Eliminar"
            confirmButtonClass="bg-red-600 hover:bg-red-700 text-white"
            cancelButtonText="No, Cancelar"
            cancelButtonClass="bg-gray-300 hover:bg-gray-400 text-gray-800"
            on:confirm={confirmDeleteCategory}
            on:cancel={cancelDeleteCategory}
        />
    {/if}

</main>
