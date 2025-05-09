<script lang="ts">
	import { budget } from '$lib/config';
	let newBudget = $budget;

	const handleSubmit = () => {
		budget.set(newBudget);
	};
</script>

<main class="p-4 max-w-md mx-auto">
	<h2 class="text-2xl font-bold mb-4">Configuración</h2>
	<form on:submit|preventDefault={handleSubmit} class="space-y-4">
		<div>
			<label for="budget-input" class="block mb-1 font-medium">Presupuesto mensual ($)</label>
			<input
				id="budget-input"
				type="number"
				bind:value={newBudget}
				class="w-full p-2 border rounded"
				min="0"
			/>
		</div>
		<button type="submit" class="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">
			Guardar
		</button>
	</form>
</main>
