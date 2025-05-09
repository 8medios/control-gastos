<script lang="ts">
	import AddExpense from '$lib/components/AddExpense.svelte';
	import type { Expense } from '$lib/types';
	import { expenses } from '$lib/stores';
	import { budget } from '$lib/config';

	const handleAddExpense = (e: CustomEvent<Expense>) => {
		expenses.update((list) => [e.detail, ...list]);
	};

	// Derivar totales
	$: totalGastos = $expenses.reduce((acc, item) => acc + item.amount, 0);
	$: restante = $budget - totalGastos;

	// Cálculos simples
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

	<AddExpense on:add={handleAddExpense} />

	<ul class="w-full max-w-md space-y-2">
		{#each $expenses as expense}
			<li class="bg-gray-100 dark:bg-gray-700 p-3 rounded-xl flex justify-between text-sm">
				<span>{expense.name}</span>
				<span>${expense.amount.toFixed(2)} – {expense.date}</span>
			</li>
		{/each}
	</ul>
</main>
