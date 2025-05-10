<script lang="ts">
	import AddTransaction from '$lib/components/AddTransaction.svelte';
	// Importamos el nuevo componente TransactionItem
	import TransactionItem from '$lib/components/TransactionItem.svelte'; // <--- Importación actualizada
	import type { Transaction, BudgetConfig } from '$lib/types';
	import { expenses } from '$lib/stores';
	import { budget } from '$lib/config';

	const handleAddTransaction = (e: CustomEvent<Transaction>) => {
		expenses.update((list) => [e.detail, ...list]);
	};

	const handleDeleteExpense = (e: CustomEvent<string>) => {
		const idToDelete = e.detail;
		expenses.update(list => {
			return list.filter(transaction => transaction.id !== idToDelete);
		});
	};

    let editingExpense: Transaction | null = null;

    const handleStartEditing = (e: CustomEvent<string>) => {
        const idToEdit = e.detail;
        const transactionToEdit = $expenses.find(transaction => transaction.id === idToEdit);

        if (transactionToEdit && transactionToEdit.id && transactionToEdit.name !== undefined && transactionToEdit.amount !== undefined && transactionToEdit.type) {
            editingExpense = { ...transactionToEdit };
        } else {
             console.warn("Intento de editar una transacción inválida o no encontrada:", idToEdit, transactionToEdit);
             editingExpense = null;
         }
    };

    const handleCancelEditing = () => {
        editingExpense = null;
    };

    const handleUpdateExpense = () => {
        if (!editingExpense) {
            console.warn("No hay transacción seleccionada para editar.");
            return;
        }
         if (!editingExpense.name.trim() || editingExpense.amount <= 0) {
             console.warn("Por favor, completa la descripción y el monto correctamente al editar.");
             return;
         }

        expenses.update(list => {
            return list.map(transaction => {
                if (transaction.id === editingExpense?.id) {
                    return editingExpense;
                }
                return transaction;
            });
        });

        editingExpense = null;
    };


	// Cálculos basados en el periodo de presupuesto (sin cambios)
    $: totalGastos = $expenses.reduce((acc, item) => {
        if (item.type === 'expense' && item.date >= $budget.startDate && item.date <= getPeriodEndDate($budget.startDate)) {
            return acc + item.amount;
        }
        return acc;
    }, 0);

     // Calcular total de INGRESOS dentro del periodo
    $: totalIngresos = $expenses.reduce((acc, item) => {
        if (item.type === 'income' && item.date >= $budget.startDate && item.date <= getPeriodEndDate($budget.startDate)) {
            return acc + item.amount;
        }
        return acc;
    }, 0);

    function getPeriodEndDate(startDateString: string): string {
         const start = new Date(startDateString);
        const endOfPeriod = new Date(start.getFullYear(), start.getMonth() + 1, start.getDate());
        const endDate = new Date(endOfPeriod.getTime() - (1000 * 60 * 60 * 24)).toISOString().slice(0,10);
        return endDate;
    }

	$: restante = $budget.amount + totalIngresos - totalGastos;

	$: diasRestantesPeriodo = calcularDiasRestantesPeriodo($budget.startDate);

    $: diario = (restante / (diasRestantesPeriodo > 0 ? diasRestantesPeriodo : 1)).toFixed(2);
	$: semanal = (restante / (diasRestantesPeriodo > 0 ? (diasRestantesPeriodo / 7) : 1)).toFixed(2);

    function calcularDiasTotalesPeriodo(startDateString: string): number { /* ... */
         const start = new Date(startDateString);
         const endOfPeriod = new Date(start.getFullYear(), start.getMonth() + 1, start.getDate());
         const diffTime = endOfPeriod.getTime() - start.getTime();
         const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
         return diffDays;
     }

     function calcularDiasRestantesPeriodo(startDateString: string): number { /* ... */
         const hoy = new Date();
         hoy.setHours(0, 0, 0, 0);

         const start = new Date(startDateString);
         start.setHours(0, 0, 0, 0);

         const endOfPeriod = new Date(start.getFullYear(), start.getMonth() + 1, start.getDate());
         endOfPeriod.setHours(0, 0, 0, 0);

         if (hoy < start) {
             return calcularDiasTotalesPeriodo(startDateString);
         }
         if (hoy >= endOfPeriod) {
              return 0;
         }

         const diffTime = endOfPeriod.getTime() - hoy.getTime();
         const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
         return diffDays;
     }

	const clearExpenses = () => {
		if (confirm("¿Borrar todas las transacciones?")) {
			expenses.set([]);
		}
	};

	let categoriaSeleccionada: string = 'Todas';

	$: gastosFiltrados = $expenses.filter(transaction => {
        const isExpense = transaction.type === 'expense';
        const matchesCategory = categoriaSeleccionada === 'Todas' || (isExpense && transaction.category === categoriaSeleccionada);
        return (isExpense && matchesCategory) || transaction.type === 'income';
	});

    const categories = ['Alimentación', 'Transporte', 'Entretenimiento', 'Salud', 'Educación', 'Otros'];

    $: totalFondosDisponibles = $budget.amount + totalIngresos;

    $: porcentajeGastado = (totalFondosDisponibles > 0) ? Math.min((totalGastos / totalFondosDisponibles) * 100, 100) : 0;

    $: progresoColor = porcentajeGastado < 50 ? 'bg-green-500' : porcentajeGastado < 85 ? 'bg-yellow-500' : 'bg-red-500';


</script>

<main class="p-4 flex flex-col items-center gap-6">
    <section class="bg-white dark:bg-gray-800 shadow rounded-xl p-6 w-full max-w-md space-y-4">
    <h2 class="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mb-4">Resumen del Periodo</h2>

        <div class="grid grid-cols-2 gap-4 text-gray-700 dark:text-gray-300">
            <p><strong class="block text-sm">Presupuesto Inicial:</strong> <span class="text-lg font-semibold">${$budget.amount.toFixed(2)}</span></p>
            <p><strong class="block text-sm">Ingresos (periodo):</strong> <span class="text-lg font-semibold text-green-600 dark:text-green-400">${totalIngresos.toFixed(2)}</span></p>
            <p><strong class="block text-sm">Gastos (periodo):</strong> <span class="text-lg font-semibold text-red-600 dark:text-red-400">${totalGastos.toFixed(2)}</span></p>
            <p><strong class="block text-sm">Restante:</strong> <span class="text-lg font-semibold text-green-600 dark:text-green-400">${restante.toFixed(2)}</span></p>
             <p><strong class="block text-sm">Días restantes:</strong> <span class="text-lg font-semibold">{diasRestantesPeriodo}</span></p>
             <p><strong class="block text-sm">Fondos Disponibles:</strong> <span class="text-lg font-semibold">${totalFondosDisponibles.toFixed(2)}</span></p>
        </div>

        <div class="w-full mt-4">
            <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Gasto vs Fondos Disponibles ({porcentajeGastado.toFixed(1)}%)</h3>
            <div class="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                <div class="{progresoColor} h-2 rounded-full" style="width: {porcentajeGastado}%;"></div>
            </div>
        </div>

    <div class="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4 space-y-2 text-gray-700 dark:text-gray-300">
         <p><strong class="block text-sm">Disponible por día:</strong> <span class="text-lg font-semibold">${diario}</span></p>
         <p><strong class="block text-sm">Disponible por semana:</strong> <span class="text-lg font-semibold">${semanal}</span></p>
    </div>

  </section>

    {#if editingExpense}
        <div class="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-75 flex items-center justify-center p-4 z-50">
            <section class="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl max-w-md w-full max-h-full overflow-y-auto">
                <h2 class="text-xl font-bold mb-4 text-gray-800 dark:text-white">Editar Transacción</h2>
                <form on:submit|preventDefault={handleUpdateExpense} class="space-y-4">
                    <div class="mb-4">
                      <!-- svelte-ignore a11y_label_has_associated_control -->
                         <label class="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-200">Tipo</label>
                         <p class="text-lg font-semibold text-gray-800 dark:text-gray-200">
                             {editingExpense.type === 'expense' ? 'Gasto' : 'Ingreso'}
                         </p>
                     </div>
                    <div>
                        <label for="edit-name" class="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-200">Descripción</label>
                        <input
                            id="edit-name"
                            bind:value={editingExpense.name}
                            type="text"
                            class="w-full p-2 rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        />
                    </div>
                    <div>
                         <label for="edit-amount" class="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-200">Monto ($)</label>
                        <input
                            id="edit-amount"
                            bind:value={editingExpense.amount}
                            type="number"
                            min="0"
                            step="0.01"
                            class="w-full p-2 rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        />
                    </div>
                    <div>
                        <label for="edit-date" class="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-200">Fecha</label>
                        <input
                            id="edit-date"
                            bind:value={editingExpense.date}
                            type="date"
                            class="w-full p-2 rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        />
                    </div>
                    {#if editingExpense.type === 'expense'}
                     <div>
                        <label for="edit-category" class="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-200">Categoría</label>
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
                    {/if}

                    <div class="flex gap-4 justify-end pt-4 border-t border-gray-200 dark:border-gray-700 mt-4">
                        <button type="button" on:click={handleCancelEditing} class="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold transition">
                            Cancelar
                        </button>
                        <button type="submit" class="px-4 py-2 rounded bg-green-600 hover:bg-green-700 text-white font-semibold transition">
                            Guardar Cambios
                        </button>
                    </div>
                </form>
            </section>
        </div>
    {/if}


    <section class="w-full max-w-md space-y-2">
            <label for="categoria" class="font-semibold block">Filtrar por categoría (Gastos):</label>
    <select
      id="categoria"       bind:value={categoriaSeleccionada}
      class="w-full p-2 rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
    >
      <option value="Todas">Todas las categorías</option>
      <option value="Alimentación">Alimentación</option>
      <option value="Transporte">Transporte</option>
      <option value="Entretenimiento">Entretenimiento</option>
      <option value="Salud">Salud</option>
      <option value="Educación">Educación</option>
      <option value="Otros">Otros</option>
    </select>
  </section>

	<AddTransaction on:add={handleAddTransaction} />

	<button
		on:click={clearExpenses}
		class="bg-red-600 hover:bg-red-700 text-white py-1 px-4 rounded-lg mb-2"
	>
		Limpiar todas las transacciones
</button>

	<ul class="w-full max-w-md space-y-2">
		{#each gastosFiltrados as transaction (transaction.id)}
			<TransactionItem transaction={transaction} on:delete={handleDeleteExpense} on:edit={handleStartEditing} /> {/each}
	</ul>

</main>