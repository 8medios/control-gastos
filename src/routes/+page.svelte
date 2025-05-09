<script lang="ts">
	import AddExpense from '$lib/components/AddExpense.svelte';
	import type { Expense } from '$lib/types';
	import { expenses } from '$lib/stores';
	import { budget } from '$lib/config';
	import ExpenseItem from '$lib/components/ExpenseItem.svelte';

	const handleAddExpense = (e: CustomEvent<Expense>) => {
		expenses.update((list) => [e.detail, ...list]);
	};

    // Nueva función para manejar el evento 'delete' desde ExpenseItem
    const handleDeleteExpense = (e: CustomEvent<string>) => {
        const idToDelete = e.detail; // El id del gasto viene en el detalle del evento

        // Usamos expenses.update para obtener la lista actual
        expenses.update(list => {
            // Filtramos la lista, manteniendo solo los gastos cuyo id NO coincide con el idToDelete
            return list.filter(expense => expense.id !== idToDelete);
        });
    };


	// Derivar totales (sin cambios, se basan en $expenses)
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
			<ExpenseItem expense={expense} on:delete={handleDeleteExpense} />
		{/each}
	</ul>

</main>