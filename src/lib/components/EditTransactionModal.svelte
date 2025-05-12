<script lang="ts">
	import { createEventDispatcher } from "svelte";
	import { onMount } from "svelte"; // Útil si necesitas inicialización basada en el DOM o el tiempo
	import type { Transaction } from "$lib/types"; // Props que recibe el modal: la transacción a editar y la lista de categorías

	export let transaction: Transaction;
	export let categories: string[]; // Recibe la lista de categorías
	// Eventos que despacha el modal: para guardar o cancelar

	const dispatch = createEventDispatcher<{ save: Transaction; cancel: void }>(); // ** Estado local del formulario de edición **

	// Creamos una copia local de la transacción recibida para vincular los inputs
	// y evitar modificar la original antes de guardar.
	// Usamos una declaración reactiva para actualizar la copia si la prop 'transaction' cambia (ej. editas otro item)
	let editedTransaction: Transaction = { ...transaction };

	// ** Estado local para errores de validación **
	let nameError: string | null = null;
	let amountError: string | null = null;
	let dateError: string | null = null; // Aunque el input type="date" valida algo, podemos añadir check
	let categoryError: string | null = null; // Para gastos

	// Función de validación centralizada
	function validateForm(): boolean {
		// Resetear errores al inicio de la validación
		nameError = null;
		amountError = null;
		dateError = null;
		categoryError = null;

		let isValid = true;

		// Validación del nombre/descripción
		if (!editedTransaction.name.trim()) {
			nameError = "La descripción no puede estar vacía.";
			isValid = false;
		}

		// Validación del monto
		if (
			editedTransaction.amount === null ||
			editedTransaction.amount === undefined ||
			editedTransaction.amount <= 0
		) {
			amountError = "El monto debe ser un número positivo.";
			isValid = false;
		}
		// Podrías añadir más validaciones para el monto si lo necesitas (ej. no es un número válido)

		// Validación de la fecha (básica, type="date" ya ayuda)
		if (
			!editedTransaction.date ||
			!editedTransaction.date.match(/^\d{4}-\d{2}-\d{2}$/)
		) {
			dateError = "Formato de fecha inválido."; // Aunque type="date" evita esto si el navegador lo soporta bien
			isValid = false;
		}

		// Validación de categoría (solo para gastos)
		if (editedTransaction.type === "expense" && !editedTransaction.category) {
			categoryError = "Debes seleccionar una categoría para gastos.";
			// Si 'Otros' siempre está seleccionado por defecto y tiene valor, quizás esta validación no es estrictamente necesaria si "Otros" es válido.
			// Pero si permitieras una opción vacía, sería útil. Con el setup actual, 'Otros' siempre tiene valor, así que esta check es menos crítica.
			// La dejo como ejemplo si cambias la lógica del select.
		}

		return isValid;
	} // Handler para guardar cambios

	const handleSubmit = () => {
		// Ejecutar validación antes de despachar
		if (!validateForm()) {
			console.warn("Errores de validación. No se guardaron los cambios.");
			return; // Detiene el envío si la validación falla
		}

		// Si la validación pasa, despachamos el evento 'save' con la transacción modificada
		dispatch("save", editedTransaction);
	};

	// Handler para cancelar edición
	const handleCancelClick = () => {
		// Opcional: Añadir confirmación si hay cambios sin guardar (más avanzado)
		dispatch("cancel"); // Despachamos evento 'cancel'
	};

	// Manejar el cierre del modal al presionar Escape (mejor UX)
	function handleKeydown(event: KeyboardEvent) {
		if (event.key === "Escape") {
			handleCancelClick();
		}
	}

	// Asegurar que el modal captura eventos de teclado al montarse y limpia al desmontarse
	onMount(() => {
		window.addEventListener("keydown", handleKeydown);
		return () => {
			// Limpiar el listener al desmontar
			window.removeEventListener("keydown", handleKeydown);
		};
	});

	// Asegurar que editedTransaction se reinicializa si la prop 'transaction' cambia (ej. editas un item, luego otro)
	$: if (transaction) {
		editedTransaction = { ...transaction };
		// Opcional: Resetear errores también al cambiar de transacción editada
		nameError = null;
		amountError = null;
		dateError = null;
		categoryError = null;
	}
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-75 flex items-center justify-center p-4 z-50"
	on:click|self={handleCancelClick}
>
	<section
		class="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl max-w-md w-full max-h-full overflow-y-auto"
	>
		<h2 class="text-xl font-bold mb-4 text-gray-800 dark:text-white">
			Editar Transacción
		</h2>

		<form on:submit|preventDefault={handleSubmit} class="space-y-4">
			<div class="mb-4">
				<!-- svelte-ignore a11y_label_has_associated_control -->
				<label
					class="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-200"
					>Tipo</label
				>
				<p class="text-lg font-semibold text-gray-800 dark:text-gray-200">
					{editedTransaction.type === "expense" ? "Gasto" : "Ingreso"}
				</p>
			</div>

			<div>
				<label
					for="edit-name"
					class="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-200"
					>Descripción</label
				>
				<input
					id="edit-name"
					bind:value={editedTransaction.name}
					type="text"
					class="w-full p-2 rounded border {nameError
						? 'border-red-500'
						: 'border-gray-300 dark:border-gray-600'} dark:bg-gray-700 dark:text-white"
				/>
				{#if nameError}
					<p class="text-red-500 text-xs mt-1">{nameError}</p>
				{/if}
			</div>

			<div>
				<label
					for="edit-amount"
					class="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-200"
					>Monto ($)</label
				>
				<input
					id="edit-amount"
					bind:value={editedTransaction.amount}
					type="number"
					min="0"
					step="0.01"
					class="w-full p-2 rounded border {amountError
						? 'border-red-500'
						: 'border-gray-300 dark:border-gray-600'} dark:bg-gray-700 dark:text-white"
				/>
				{#if amountError}
					<p class="text-red-500 text-xs mt-1">{amountError}</p>
				{/if}
			</div>

			<div>
				<label
					for="edit-date"
					class="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-200"
					>Fecha</label
				>
				<input
					id="edit-date"
					bind:value={editedTransaction.date}
					type="date"
					class="w-full p-2 rounded border {dateError
						? 'border-red-500'
						: 'border-gray-300 dark:border-gray-600'} dark:bg-gray-700 dark:text-white"
				/>
				{#if dateError}
					<p class="text-red-500 text-xs mt-1">{dateError}</p>
				{/if}
			</div>

			{#if editedTransaction.type === "expense"}
				<div>
					<label
						for="edit-category"
						class="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-200"
						>Categoría</label
					>
					<select
						id="edit-category"
						bind:value={editedTransaction.category}
						class="w-full p-2 rounded border {categoryError
							? 'border-red-500'
							: 'border-gray-300 dark:border-gray-600'} dark:bg-gray-700 dark:text-white"
					>
						{#each categories as cat}
							<option value={cat}>{cat}</option>
						{/each}
						{#if editedTransaction.category === undefined}
							<option value="Otros" selected>Otros</option>
						{/if}
					</select>
					{#if categoryError}
						<p class="text-red-500 text-xs mt-1">{categoryError}</p>
					{/if}
				</div>
			{/if}

			<div
				class="flex gap-4 justify-end pt-4 border-t border-gray-200 dark:border-gray-700 mt-4"
			>
				<button
					type="button"
					on:click={handleCancelClick}
					class="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold transition"
				>
					Cancelar
				</button>
				<button
					type="submit"
					class="px-4 py-2 rounded bg-green-600 hover:bg-green-700 text-white font-semibold transition"
				>
					Guardar Cambios
				</button>
			</div>
		</form>
	</section>
</div>
