<script lang="ts">
	import { budget } from '$lib/config';
	import type { BudgetConfig } from '$lib/types'; // Importar el tipo

	// Usamos el operador $ para suscribirnos al store budget y obtener su valor actual
	let currentConfig: BudgetConfig = $budget;

	const handleSubmit = () => {
		// Aseguramos que el monto sea un número positivo
		if (currentConfig.amount < 0) {
			currentConfig.amount = 0;
		}
		// La fecha de inicio ya debería ser una string ISO YYYY-MM-DD por el input type="date"

		// Actualizamos el store con la nueva configuración
		budget.set(currentConfig);

		alert('Configuración guardada'); // Opcional: mostrar una notificación
	};
</script>

<main class="p-4 max-w-md mx-auto">
	<h2 class="text-2xl font-bold mb-4">Configuración</h2>
	<form on:submit|preventDefault={handleSubmit} class="space-y-4">
		<div>
			<label for="budget-amount" class="block mb-1 font-medium">Presupuesto mensual ($)</label>
			<input
				id="budget-amount"
				type="number"
				bind:value={currentConfig.amount}
				class="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
				min="0"
			/>
		</div>
        <div>
			<label for="budget-start-date" class="block mb-1 font-medium">Fecha de inicio del periodo</label>
			<input
				id="budget-start-date"
				type="date"
				bind:value={currentConfig.startDate}
				class="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
			/>
		</div>
		<button type="submit" class="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition">
			Guardar Configuración
		</button>
	</form>
</main>