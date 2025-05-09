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

  function icono(cat?: string): string {
  const mapa: Record<string, string> = {
    comida: "🍔",
    transporte: "🚌",
    entretenimiento: "🎮",
    otros: "🧾",
  };
  return mapa[cat || "otros"] || "🧾";
}
const clearExpenses = () => {
  if (confirm("¿Borrar todos los gastos?")) {
    expenses.set([]);
  }
};

let categoriaSeleccionada: string = 'Todas';

$: gastosFiltrados = $expenses.filter(expense => {
  return categoriaSeleccionada === 'Todas' || expense.category === categoriaSeleccionada;
});


</script>

<main class="p-4 flex flex-col items-center gap-6">
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
  {#each $expenses as expense}
    <li class="bg-gray-100 dark:bg-gray-700 p-3 rounded-xl flex justify-between text-sm">
      <span>{icono(expense.category)} {expense.name}</span>
      <span>${expense.amount.toFixed(2)} – {expense.date}</span>
    </li>
  {/each}
</ul>

</main>
