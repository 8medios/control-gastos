<script lang="ts">
	import AddExpense from '$lib/components/AddExpense.svelte';
	import ExpenseItem from '$lib/components/ExpenseItem.svelte';
	import type { Expense } from '$lib/types';
	import { expenses } from '$lib/stores';
	import { budget } from '$lib/config';

	const handleAddExpense = (e: CustomEvent<Expense>) => {
		expenses.update((list) => [e.detail, ...list]);
	};

	const handleDeleteExpense = (e: CustomEvent<string>) => {
		const idToDelete = e.detail;
		expenses.update(list => {
			return list.filter(expense => expense.id !== idToDelete);
		});
	};

    // Variable de estado para controlar qué gasto se está editando.
    // Contendrá el objeto Expense si estamos editando, o null si no.
    let editingExpense: Expense | null = null;

    // Función que se llama cuando un ExpenseItem dispara el evento 'edit'
    const handleStartEditing = (e: CustomEvent<string>) => {
        const idToEdit = e.detail;
        // Buscamos el gasto en la lista actual del store usando el id
        const expenseToEdit = $expenses.find(expense => expense.id === idToEdit);

        // Asignamos el gasto encontrado a editingExpense. Si no se encuentra (lo cual no debería pasar si el id es válido), asignamos null.
        // Nota: Al hacer bind:value directamente a las propiedades de editingExpense, Svelte actualizará este objeto a medida que el usuario escribe.
        editingExpense = expenseToEdit || null;

         // Opcional pero recomendado para evitar mutación directa del store si 'find' devolviera una referencia reactiva compleja:
         // editingExpense = expenseToEdit ? { ...expenseToEdit } : null;
    };

    // Función para cancelar la edición y ocultar el formulario
    const handleCancelEditing = () => {
        editingExpense = null; // Simplemente asignamos null para ocultar el formulario
    };

    // ** Lógica de GUARDAR CAMBIOS **
    const handleUpdateExpense = () => {
        // Verificamos si realmente tenemos un gasto para editar
        if (!editingExpense) {
            console.warn("No hay gasto seleccionado para editar.");
            return;
        }

        // Opcional: Añadir validación aquí antes de guardar (similar a AddExpense)
         if (!editingExpense.name.trim() || editingExpense.amount <= 0) {
             console.warn("Por favor, completa el nombre y el monto correctamente al editar.");
             // Podrías añadir lógica para mostrar mensajes de error en el formulario de edición
             return; // Detiene la actualización si la validación falla
         }


        // Usamos expenses.update para obtener la lista actual y devolver una nueva lista modificada
        expenses.update(list => {
            // Usamos map para iterar sobre la lista. Cuando encontramos el gasto que estamos editando (por id),
            // lo reemplazamos con el objeto editingExpense (que contiene los valores modificados del formulario).
            return list.map(expense => {
                // Comparamos los ids. Usamos ?.id por si editingExpense fuera null (aunque ya lo verificamos arriba)
                if (expense.id === editingExpense?.id) {
                    return editingExpense; // Devolvemos el objeto modificado
                }
                return expense; // Devolvemos el gasto original si no es el que estamos editando
            });
        });

        // Una vez actualizado el store, ocultamos el formulario de edición
        editingExpense = null;
    };


	// Derivar totales (sin cambios)
	$: totalGastos = $expenses.reduce((acc, item) => acc + item.amount, 0);
	$: restante = $budget - totalGastos;
	$: diario = (restante / diasRestantes()).toFixed(2);
	$: semanal = (restante / semanasRestantes()).toFixed(2);

	function diasRestantes(): number {
		const hoy = new Date();
		const finMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
		return (finMes.getDate() - hoy.getDate()) + 1;
	}

	function semanasRestantes(): number {
		return Math.ceil(diasRestantes() / 7);
	}

	const clearExpenses = () => {
		if (confirm("¿Borrar todos los gastos?")) {
			expenses.set([]);
		}
	};

	let categoriaSeleccionada: string = 'Todas';

	$: gastosFiltrados = $expenses.filter(expense => {
        const expenseCategory = expense.category || 'Otros';
		return categoriaSeleccionada === 'Todas' || expenseCategory === categoriaSeleccionada;
	});

    // Lista de categorías para el formulario de edición (puede estar en un archivo de config compartido)
    const categories = ['Alimentación', 'Transporte', 'Entretenimiento', 'Salud', 'Educación', 'Otros'];

</script>

<main class="p-4 flex flex-col items-center gap-6">
    <section class="bg-white dark:bg-gray-800 shadow rounded-xl p-4 w-full max-w-md space-y-2">
    <h2 class="text-xl font-bold text-indigo-600 dark:text-indigo-400">Resumen</h2>
    <p><strong>Presupuesto mensual:</strong> ${$budget}</p>
    <p><strong>Gastos acumulados:</strong> ${totalGastos.toFixed(2)}</p>
    <p><strong>Restante:</strong> ${restante.toFixed(2)}</p>
    <p><strong>Disponible por día:</strong> ${diario}</p>
    <p><strong>Disponible por semana:</strong> ${semanal}</p>
  </section>

    {#if editingExpense}
        <section class="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-md max-w-md w-full">
            <h2 class="text-lg font-bold mb-4 text-gray-800 dark:text-white">Editar Gasto</h2>
            <form on:submit|preventDefault={handleUpdateExpense} class="space-y-2">
                <div>
                    <label for="edit-name" class="block text-sm font-medium text-gray-700 dark:text-gray-200">Nombre</label>
                    <input
                        id="edit-name"
                        bind:value={editingExpense.name}
                        type="text"
                        class="w-full p-2 rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    />
                </div>
                <div>
                     <label for="edit-amount" class="block text-sm font-medium text-gray-700 dark:text-gray-200">Monto ($)</label>
                    <input
                        id="edit-amount"
                        bind:value={editingExpense.amount}
                        type="number"
                        min="0"
                        class="w-full p-2 rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    />
                </div>
                <div>
                    <label for="edit-date" class="block text-sm font-medium text-gray-700 dark:text-gray-200">Fecha</label>
                    <input
                        id="edit-date"
                        bind:value={editingExpense.date}
                        type="date"
                        class="w-full p-2 rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    />
                </div>
                 <div>
                    <label for="edit-category" class="block text-sm font-medium text-gray-700 dark:text-gray-200">Categoría</label>
                    <select
                        id="edit-category"
                        bind:value={editingExpense.category}
                        class="w-full p-2 rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    >
                        {#each categories as cat}
                            <option value={cat}>{cat}</option>
                        {/each}
                         {#if editingExpense.category === undefined}
                             <option value="Otros" selected>Otros</option>
                         {/if}
                    </select>
                </div>

                <div class="flex gap-4 justify-end mt-4">
                    <button type="button" on:click={handleCancelEditing} class="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold transition">
                        Cancelar
                    </button>
                    <button type="submit" class="px-4 py-2 rounded bg-green-600 hover:bg-green-700 text-white font-semibold transition">
                        Guardar Cambios
                    </button>
                </div>
            </form>
        </section>
    {/if}


    <section class="w-full max-w-md space-y-2">
    <label for="categoria" class="font-semibold block">Filtrar por categoría:</label>
    <select
      id="categoria"
      bind:value={categoriaSeleccionada}
      class="w-full p-2 rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
    >
      <option value="Todas">Todas</option>
      <option value="Alimentación">Alimentación</option>
      <option value="Transporte">Transporte</option>
      <option value="Entretenimiento">Entretenimiento</option>
      <option value="Salud">Salud</option>
      <option value="Educación">Educación</option>
      <option value="Otros">Otros</option>
    </select>
  </section>

	<AddExpense on:add={handleAddExpense} />

	<button
		on:click={clearExpenses}
		class="bg-red-600 hover:bg-red-700 text-white py-1 px-4 rounded-lg mb-2"
	>
		Limpiar todos los gastos
	</button>

	<ul class="w-full max-w-md space-y-2">
		{#each gastosFiltrados as expense (expense.id)}
			<ExpenseItem expense={expense} on:delete={handleDeleteExpense} on:edit={handleStartEditing} />
		{/each}
	</ul>

</main>