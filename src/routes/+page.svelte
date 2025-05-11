<script lang="ts">
	import AddTransaction from "$lib/components/AddTransaction.svelte";
	import TransactionItem from "$lib/components/TransactionItem.svelte";
	import EditTransactionModal from "$lib/components/EditTransactionModal.svelte";
	import ConfirmModal from "$lib/components/ConfirmModal.svelte";
	import type { Transaction, BudgetConfig } from "$lib/types";
	import { expenses } from "$lib/stores";
	import { budget } from "$lib/config";

	// Importar Chart.js directamente
	import Chart from "chart.js/auto";
	import { onMount, onDestroy } from "svelte"; // Importar hooks de ciclo de vida

	const handleAddTransaction = (e: CustomEvent<Transaction>) => {
		/* ... sin cambios */
		expenses.update((list) => [e.detail, ...list]);
	};

	const handleDeleteExpense = (e: CustomEvent<string>) => {
		/* ... sin cambios */
		const idToDelete = e.detail;
		expenses.update((list) => {
			return list.filter((transaction) => transaction.id !== idToDelete);
		});
	};

	// Lógica de modales de confirmación (sin cambios)
	let isConfirmDeleteOpen = false;
	let transactionToDeleteId: string | null = null;
	let confirmDeleteMessage = "";
	let isConfirmClearAllOpen = false;
	let confirmClearAllMessage =
		"¿Estás seguro de que quieres eliminar TODAS las transacciones? Esta acción no se puede deshacer.";

	const handleRequestDelete = (e: CustomEvent<string>) => {
		const id = e.detail;
		const transaction = $expenses.find((item) => item.id === id);
		if (transaction) {
			transactionToDeleteId = id;
			confirmDeleteMessage = `¿Estás seguro de que quieres eliminar la transacción "${transaction.name}" (${transaction.type === "expense" ? "-" : "+"}${transaction.amount.toFixed(2)})?`;
			isConfirmDeleteOpen = true;
		}
	};
	const handleConfirmDelete = () => {
		if (transactionToDeleteId) {
			expenses.update((list) => {
				return list.filter(
					(transaction) => transaction.id !== transactionToDeleteId
				);
			});
		}
		isConfirmDeleteOpen = false;
		transactionToDeleteId = null;
		confirmDeleteMessage = "";
	};
	const handleCancelDelete = () => {
		/* ... sin cambios */
		isConfirmDeleteOpen = false;
		transactionToDeleteId = null;
		confirmDeleteMessage = "";
	};

	const handleRequestClearAll = () => {
		/* ... sin cambios */
		isConfirmClearAllOpen = true;
	};
	const handleConfirmClearAll = () => {
		/* ... sin cambios */
		expenses.set([]);
		isConfirmClearAllOpen = false;
	};
	const handleCancelClearAll = () => {
		/* ... sin cambios */
		isConfirmClearAllOpen = false;
	};

	// Lógica de edición (sin cambios)
	let editingExpense: Transaction | null = null;
	const handleStartEditing = (e: CustomEvent<string>) => {
		/* ... sin cambios */
		const idToEdit = e.detail;
		const transactionToEdit = $expenses.find(
			(transaction) => transaction.id === idToEdit
		);
		if (
			transactionToEdit &&
			transactionToEdit.id &&
			transactionToEdit.name !== undefined &&
			transactionToEdit.amount !== undefined &&
			transactionToEdit.type
		) {
			editingExpense = { ...transactionToEdit };
		} else {
			console.warn(
				"Intento de editar una transacción inválida o no encontrada:",
				idToEdit,
				transactionToEdit
			);
			editingExpense = null;
		}
	};
	const handleModalSave = (e: CustomEvent<Transaction>) => {
		/* ... sin cambios */
		const updatedTransaction = e.detail;
		expenses.update((list) => {
			return list.map((transaction) => {
				if (transaction.id === updatedTransaction.id) {
					return updatedTransaction;
				}
				return transaction;
			});
		});
		editingExpense = null;
	};
	const handleModalCancel = () => {
		/* ... sin cambios */
		editingExpense = null;
	};

	// Cálculos basados en el periodo de presupuesto (sin cambios)
	$: totalGastos = $expenses.reduce((acc, item) => {
		if (
			item.type === "expense" &&
			item.date >= $budget.startDate &&
			item.date <= getPeriodEndDate($budget.startDate)
		) {
			return acc + item.amount;
		}
		return acc;
	}, 0);
	$: totalIngresos = $expenses.reduce((acc, item) => {
		if (
			item.type === "income" &&
			item.date >= $budget.startDate &&
			item.date <= getPeriodEndDate($budget.startDate)
		) {
			return acc + item.amount;
		}
		return acc;
	}, 0);

	// Función auxiliar para obtener la fecha de fin del periodo (sin cambios)
	function getPeriodEndDate(startDateString: string): string {
		const start = new Date(startDateString);
		const endOfPeriod = new Date(
			start.getFullYear(),
			start.getMonth() + 1,
			start.getDate()
		);
		const endDate = new Date(endOfPeriod.getTime() - 1000 * 60 * 60 * 24)
			.toISOString()
			.slice(0, 10);
		return endDate;
	}

	// Función para obtener todas las fechas dentro de un rango (sin cambios)
	function getDatesInRange(
		startDateString: string,
		endDateString: string
	): string[] {
		const dateArray: string[] = [];
		let currentDate = new Date(startDateString);
		const endDate = new Date(endDateString);
		while (currentDate <= endDate) {
			dateArray.push(currentDate.toISOString().slice(0, 10));
			currentDate.setDate(currentDate.getDate() + 1);
		}
		return dateArray;
	}

	$: restante = $budget.amount + totalIngresos - totalGastos;
	$: diasRestantesPeriodo = calcularDiasRestantesPeriodo($budget.startDate);
	$: diario = (
		restante / (diasRestantesPeriodo > 0 ? diasRestantesPeriodo : 1)
	).toFixed(2);
	$: semanal = (
		restante / (diasRestantesPeriodo > 0 ? diasRestantesPeriodo / 7 : 1)
	).toFixed(2);
	function calcularDiasTotalesPeriodo(startDateString: string): number {
		const start = new Date(startDateString);
		const endOfPeriod = new Date(
			start.getFullYear(),
			start.getMonth() + 1,
			start.getDate()
		);
		const diffTime = endOfPeriod.getTime() - start.getTime();
		const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
		return diffDays;
	}
	function calcularDiasRestantesPeriodo(startDateString: string): number {
		const hoy = new Date();
		hoy.setHours(0, 0, 0, 0);

		const start = new Date(startDateString);
		start.setHours(0, 0, 0, 0);

		const endOfPeriod = new Date(
			start.getFullYear(),
			start.getMonth() + 1,
			start.getDate()
		);
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

	let categoriaSeleccionada: string = "Todas";

	$: gastosFiltrados = $expenses.filter((transaction) => {
		/* ... sin cambios */
		const isExpense = transaction.type === "expense";
		const matchesCategory =
			categoriaSeleccionada === "Todas" ||
			(isExpense && transaction.category === categoriaSeleccionada);
		return (isExpense && matchesCategory) || transaction.type === "income";
	});

	const categories = [
		"Alimentación",
		"Transporte",
		"Entretenimiento",
		"Salud",
		"Educación",
		"Otros",
	];

	$: totalFondosDisponibles = $budget.amount + totalIngresos;
	$: porcentajeGastado =
		totalFondosDisponibles > 0
			? Math.min((totalGastos / totalFondosDisponibles) * 100, 100)
			: 0;
	$: progresoColor =
		porcentajeGastado < 50
			? "bg-green-500"
			: porcentajeGastado < 85
			? "bg-yellow-500"
			: "bg-red-500";

	// ** DATOS Y OPCIONES PARA EL GRÁFICO (sin cambios) **

	// Store simple para detectar el modo oscuro desde el body class
	import { browser } from "$app/environment";
	import { readable } from "svelte/store";

	const isDarkMode = readable(false, (set) => {
		if (!browser) return;
		const observer = new MutationObserver(() => {
			set(document.body.classList.contains("dark"));
		});
		observer.observe(document.body, {
			attributes: true,
			attributeFilter: ["class"],
		});
		set(document.body.classList.contains("dark"));
		return () => observer.disconnect();
	});

	// Datos crudos y procesados
	$: periodStartDate = $budget.startDate;
	$: periodEndDate = getPeriodEndDate(periodStartDate);
	$: chartLabels = getDatesInRange(periodStartDate, periodEndDate);
	$: dailyTotals = $expenses.reduce(
		(acc, transaction) => {
			if (
				transaction.date >= periodStartDate &&
				transaction.date <= periodEndDate
			) {
				if (!acc[transaction.date]) {
					acc[transaction.date] = { expense: 0, income: 0 };
				}
				acc[transaction.date][transaction.type] += transaction.amount;
			}
			return acc;
		},
		{} as Record<string, { expense: number; income: number }>
	);
	$: chartDatasets = [
		{
			label: "Gastos Diarios",
			backgroundColor: "rgba(239, 68, 68, 0.6)",
			borderColor: "rgb(239, 68, 68)",
			data: chartLabels.map((date) => dailyTotals[date]?.expense || 0),
			borderRadius: 4,
		},
		{
			label: "Ingresos Diarios",
			backgroundColor: "rgba(34, 197, 94, 0.6)",
			borderColor: "rgb(34, 197, 94)",
			data: chartLabels.map((date) => dailyTotals[date]?.income || 0),
			borderRadius: 4,
		},
	];
	$: chartOptions = {
		responsive: true,
		maintainAspectRatio: false,
		plugins: {
			title: {
				display: true,
				text: "Gastos e Ingresos Diarios",
				color: $isDarkMode ? "#E5E7EB" : "#1F2937",
			},
			tooltip: {
				mode: "index" as const,
				intersect: false,
				backgroundColor: $isDarkMode
					? "rgba(229, 231, 235, 0.9)"
					: "rgba(31, 41, 55, 0.9)",
				titleColor: $isDarkMode ? "#1F2937" : "#E5E7EB",
				bodyColor: $isDarkMode ? "#1F2937" : "#E5E7EB",
				borderColor: $isDarkMode ? "#4B5563" : "#D1D5DB",
				borderWidth: 1,
				cornerRadius: 4,
			},
		},
		scales: {
			x: {
				title: {
					display: true,
					text: "Fecha",
					color: $isDarkMode ? "#D1D5DB" : "#4B5563",
				},
				ticks: {
					color: $isDarkMode ? "#D1D5DB" : "#4B5563",
				},
				grid: {
					color: $isDarkMode
						? "rgba(75, 85, 99, 0.3)"
						: "rgba(209, 213, 219, 0.5)",
					borderColor: $isDarkMode ? "#4B5563" : "#D1D5DB",
				},
			},
			y: {
				title: {
					display: true,
					text: "Monto ($)",
					color: $isDarkMode ? "#D1D5DB" : "#4B5563",
				},
				ticks: {
					color: $isDarkMode ? "#D1D5DB" : "#4B5563",
					callback: function (value: string | number) {
						return "$" + (value as number).toFixed(0);
					},
				},
				grid: {
					color: $isDarkMode
						? "rgba(75, 85, 99, 0.3)"
						: "rgba(209, 213, 219, 0.5)",
					borderColor: $isDarkMode ? "#4B5563" : "#D1D5DB",
				},
			},
		},
	};

	// Lógica de Chart.js vanilla (sin cambios)
	let canvasElement: HTMLCanvasElement;
	let myChart: Chart | null = null;

	onMount(() => {
		const ctx = canvasElement.getContext("2d");
		if (!ctx) {
			console.error("Could not get canvas context");
			return;
		}
		myChart = new Chart(ctx, {
			type: "bar",
			data: {
				labels: chartLabels,
				datasets: chartDatasets,
			},
			options: chartOptions,
		});
	});

	onDestroy(() => {
		myChart?.destroy();
	});

	$: {
		if (myChart) {
			myChart.data.labels = chartLabels;
			myChart.data.datasets = chartDatasets;
			myChart.options = chartOptions;
			myChart.update();
		}
	}
</script>

<main class="p-4 flex flex-col gap-6 mx-auto w-full lg:max-w-screen-xl xl:max-w-screen-2xl">
	<section class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
		<section
			class="bg-white dark:bg-gray-800 shadow rounded-xl p-6 w-full space-y-4 col-span-1"
		>
			<h2 class="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mb-4">
				Resumen del Periodo
			</h2>
			<div class="grid grid-cols-2 gap-4 text-gray-700 dark:text-gray-300">
				<p>
					<strong class="block text-sm">Presupuesto Inicial:</strong>
					<span class="text-lg font-semibold">${$budget.amount.toFixed(2)}</span>
				</p>
				<p>
					<strong class="block text-sm">Ingresos (periodo):</strong>
					<span
						class="text-lg font-semibold text-green-600 dark:text-green-400"
						>${totalIngresos.toFixed(2)}</span
					>
				</p>
				<p>
					<strong class="block text-sm">Gastos (periodo):</strong>
					<span
						class="text-lg font-semibold text-red-600 dark:text-red-400"
						>${totalGastos.toFixed(2)}</span
					>
				</p>
				<p>
					<strong class="block text-sm">Restante:</strong>
					<span
						class="text-lg font-semibold text-green-600 dark:text-green-400"
						>${restante.toFixed(2)}</span
					>
				</p>
				<p>
					<strong class="block text-sm">Días restantes:</strong>
					<span class="text-lg font-semibold">{diasRestantesPeriodo}</span>
				</p>
				<p>
					<strong class="block text-sm">Fondos Disponibles:</strong>
					<span class="text-lg font-semibold"
						>${totalFondosDisponibles.toFixed(2)}</span
					>
				</p>
			</div>
			<div class="w-full mt-4">
				<h3 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
					Gasto vs Fondos Disponibles ({porcentajeGastado.toFixed(1)}%)
				</h3>
				<div class="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
					<div
						class="{progresoColor} h-2 rounded-full"
						style="width: {porcentajeGastado}%;"
					></div>
				</div>
			</div>
			<div
				class="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4 space-y-2 text-gray-700 dark:text-gray-300"
			>
				<p>
					<strong class="block text-sm">Disponible por día:</strong>
					<span class="text-lg font-semibold">${diario}</span>
				</p>
				<p>
					<strong class="block text-sm">Disponible por semana:</strong>
					<span class="text-lg font-semibold">${semanal}</span>
				</p>
			</div>
		</section>

		<section
			class="w-full flex flex-col gap-6 col-span-1"
		>
			<div class="bg-white dark:bg-gray-800 shadow rounded-xl p-6 space-y-2">
				<label for="categoria" class="font-semibold block"
					>Filtrar por categoría (Gastos):</label
				>
				<select
					id="categoria"
					bind:value={categoriaSeleccionada}
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
			</div>
			<AddTransaction
				on:add={handleAddTransaction}
				class="w-full"
			/>
			<button
				on:click={handleRequestClearAll}
				class="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg font-semibold transition w-full"
			>
				Limpiar todas las transacciones
			</button>
		</section>

		<section
			class="bg-white dark:bg-gray-800 shadow rounded-xl p-6 w-full space-y-4 col-span-1"
		>
			<h2 class="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
				Visualización de Transacciones
			</h2>
			<div class="relative h-96 w-full">
				<canvas bind:this={canvasElement}></canvas>
			</div>
		</section>
	</section>
	{#if editingExpense}
		<EditTransactionModal
			transaction={editingExpense}
			{categories}
			on:save={handleModalSave}
			on:cancel={handleModalCancel}
		/>
	{/if}
	{#if isConfirmDeleteOpen}
		<ConfirmModal
			title="Confirmar Eliminación"
			message={confirmDeleteMessage}
			on:confirm={handleConfirmDelete}
			on:cancel={handleCancelDelete}
		/>
	{/if}
	{#if isConfirmClearAllOpen}
		<ConfirmModal
			title="Confirmar Limpiar Todo"
			message={confirmClearAllMessage}
			confirmButtonText="Sí, Eliminar Todo"
			confirmButtonClass="bg-red-600 hover:bg-red-700 text-white"
			cancelButtonText="No, Cancelar"
			cancelButtonClass="bg-gray-300 hover:bg-gray-400 text-gray-800"
			on:confirm={handleConfirmClearAll}
			on:cancel={handleCancelClearAll}
		/>
	{/if}

	<ul class="w-full space-y-2 mt-6">
		{#each gastosFiltrados as transaction (transaction.id)}
			<TransactionItem
				{transaction}
				on:requestDelete={handleRequestDelete}
				on:edit={handleStartEditing}
			/>
		{/each}
	</ul>
</main>