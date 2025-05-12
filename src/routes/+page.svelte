<script lang="ts">
	import AddTransaction from "$lib/components/AddTransaction.svelte";
	import TransactionItem from "$lib/components/TransactionItem.svelte";
	import EditTransactionModal from "$lib/components/EditTransactionModal.svelte";
	import ConfirmModal from "$lib/components/ConfirmModal.svelte";
	import type { Transaction, BudgetConfig } from "$lib/types";
	import { expenses, budget, categories } from "$lib/stores"; // Importar los stores necesarios

	// Importar Chart.js directamente
	import Chart from "chart.js/auto"; // Importa Chart.js (usa 'auto' para registrar controladores básicos)
	import { onMount, onDestroy } from "svelte"; // Importar hooks de ciclo de vida
    import { browser } from '$app/environment'; // Importar 'browser' para verificar si estamos en el navegador

	const handleAddTransaction = (e: CustomEvent<Transaction>) => {
		expenses.update((list) => [e.detail, ...list]);
	};

	const handleDeleteExpense = (e: CustomEvent<string>) => {
		const idToDelete = e.detail;
		expenses.update((list) => {
			return list.filter((transaction) => transaction.id !== idToDelete);
		});
	};

	// Lógica de modales de confirmación
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
		isConfirmDeleteOpen = false;
		transactionToDeleteId = null;
		confirmDeleteMessage = "";
	};

	const handleRequestClearAll = () => {
		isConfirmClearAllOpen = true;
	};
	const handleConfirmClearAll = () => {
		expenses.set([]);
		isConfirmClearAllOpen = false;
	};
	const handleCancelClearAll = () => {
		isConfirmClearAllOpen = false;
	};

	// Lógica de edición
	// Ahora almacenamos solo el ID de la transacción que se está editando
	let editingExpenseId: string | null = null;

	const handleStartEditing = (e: CustomEvent<string>) => {
		const idToEdit = e.detail;
		// Simplemente establecemos el ID de la transacción a editar.
		// El modal se encargará de encontrar la transacción por este ID.
		editingExpenseId = idToEdit;
	};

	const handleModalSave = (e: CustomEvent<Transaction>) => {
		const updatedTransaction = e.detail;
		expenses.update((list) => {
			return list.map((transaction) => {
				if (transaction.id === updatedTransaction.id) {
					return updatedTransaction;
				}
				return transaction;
			});
		});
		// Después de guardar, cerramos el modal estableciendo editingExpenseId a null
		editingExpenseId = null;
	};

	const handleModalCancel = () => {
		// Al cancelar, simplemente cerramos el modal estableciendo editingExpenseId a null
		editingExpenseId = null;
	};


	// Cálculos basados en el periodo de presupuesto
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

	// Función auxiliar para obtener la fecha de fin del periodo
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

	// Función para obtener todas las fechas dentro de un rango
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
		const isExpense = transaction.type === "expense";
		const matchesCategory =
			categoriaSeleccionada === "Todas" ||
			(isExpense && transaction.category === categoriaSeleccionada);
		return (isExpense && matchesCategory) || transaction.type === "income";
	});

	// Las categorías ahora vienen del store importado

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

	// ** Datos y Opciones para los Gráficos **
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

	// --- Datos para el Gráfico de Barras (Gastos/Ingresos Diarios) ---
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
	$: barChartDatasets = [
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
	$: barChartOptions = {
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

	// --- Datos para el Gráfico de Tarta (Gastos por Categoría) ---
	$: periodExpenses = $expenses.filter(t => t.type === 'expense' && t.date >= periodStartDate && t.date <= periodEndDate);
	$: categoryTotals = periodExpenses.reduce((acc, transaction) => { /* ... */ const category = transaction.category || 'Otros'; if (!acc[category]) { acc[category] = 0; } acc[category] += transaction.amount; return acc; }, {} as Record<string, number>);
	$: pieChartLabels = Object.keys(categoryTotals);
	$: pieChartDataValues = Object.values(categoryTotals);
	function generateColors(numColors: number): string[] { /* ... */ const colors = [ '#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#3B82F6', '#A855F7', '#EC4899', '#6EE7B7', '#FCD34D', '#F87171', '#818CF8', '#C084FC', '#F472B6', '#A7F3D0', '#FDE68A' ]; const generated = []; for(let i = 0; i < numColors; i++){ generated.push(colors[i % colors.length]); } return generated; }
	$: pieChartDatasets = [ { label: 'Gasto por Categoría', data: pieChartDataValues, backgroundColor: generateColors(pieChartLabels.length), borderColor: $isDarkMode ? '#1F2937' : '#FFFFFF', borderWidth: 1, } ];
	$: pieChartOptions = { responsive: true, maintainAspectRatio: false, plugins: { title: { display: true, text: 'Distribución de Gastos por Categoría', color: $isDarkMode ? '#E5E7EB' : '#1F2937', }, legend: { display: true, position: 'top' as const, labels: { color: $isDarkMode ? '#D1D5DB' : '#4B5563', } }, tooltip: { backgroundColor: $isDarkMode ? 'rgba(229, 231, 235, 0.9)' : 'rgba(31, 41, 55, 0.9)', titleColor: $isDarkMode ? '#1F2937' : '#E5E7EB', bodyColor: $isDarkMode ? '#1F2937' : '#E5E7EB', borderColor: $isDarkMode ? '#4B5563' : '#D1D5DB', borderWidth: 1, cornerRadius: 4, callbacks: { label: function(context: any) { const label = context.label || ''; const value = context.raw || 0; const total = context.chart.data.datasets[0].data.reduce((sum: number, val: number) => sum + val, 0); const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0; return `${label}: $${value.toFixed(2)} (${percentage}%)`; } } } } };


	// ** Lógica de Chart.js vanilla (Adaptada para 2 gráficos) **
	let barCanvasElement: HTMLCanvasElement; // Canvas para el gráfico de barras
	let pieCanvasElement: HTMLCanvasElement; // Canvas para el gráfico de tarta

	let myBarChart: Chart | null = null; // Instancia del gráfico de barras
	let myPieChart: Chart | null = null; // Instancia del gráfico de tarta


	onMount(() => {
		if (!browser) return; // Asegurarse de estar en el navegador

		// Crear Gráfico de Barras
		const barCtx = barCanvasElement.getContext("2d");
		if (!barCtx) { console.error("No se pudo obtener el contexto del canvas para el gráfico de barras"); return; }
		myBarChart = new Chart(barCtx, { type: "bar", data: { labels: chartLabels, datasets: barChartDatasets, }, options: barChartOptions, });

		// Crear Gráfico de Tarta
		const pieCtx = pieCanvasElement.getContext("2d");
		if (!pieCtx) { console.error("No se pudo obtener el contexto del canvas para el gráfico de tarta"); return; }
		myPieChart = new Chart(pieCtx, { type: "pie", data: { labels: pieChartLabels, datasets: pieChartDatasets }, options: pieChartOptions, });
	});

	onDestroy(() => {
		if (browser) { // Asegurarse de estar en el navegador antes de destruir
			myBarChart?.destroy(); // Destruir ambos gráficos
			myPieChart?.destroy();
		}
	});

	// Bloque reactivo: Se ejecuta cuando los datos o opciones de CUALQUIER gráfico cambian
	$: {
		if (browser && myBarChart) { // Asegurarse de estar en el navegador y el gráfico existe
			myBarChart.data.labels = chartLabels; // Labels compartidos por ahora
			myBarChart.data.datasets = barChartDatasets;
			myBarChart.options = barChartOptions;
			myBarChart.update();
		}

		if (browser && myPieChart) { // Asegurarse de estar en el navegador y el gráfico existe
			myPieChart.data.labels = pieChartLabels;
			myPieChart.data.datasets = pieChartDatasets;
			myPieChart.options = pieChartOptions;
			myPieChart.update();
		}
	}

	// ** Lógica del botón "Ver Gráfico" **
	const scrollToCharts = () => {
		if (browser) { // Asegurarse de estar en el navegador
			const chartsSection = document.getElementById('charts-section');
			if (chartsSection) {
				chartsSection.scrollIntoView({ behavior: 'smooth' }); // Scroll suave
			}
		}
	};


	// ** FUNCIÓN: Exportar Transacciones a CSV (Con BOM y Punto y Coma como Delimitador, ID Secuencial) **
	const exportTransactionsAsCsv = () => {
		if (!browser) return; // Solo ejecutar en el navegador

		const data = $expenses; // Obtener los datos de la store

		if (data.length === 0) {
			alert("No hay transacciones para exportar.");
			return;
		}

		// Definir el encabezado CSV usando PUNTO Y COMA como delimitador
		// Se elimina la columna ID ya que usaremos un índice secuencial
		const header = "Número;Nombre;Monto;Tipo;Fecha;Categoría\n"; // Encabezado sin ID, usando 'Número'

		// Formatear los datos
		const csvRows = data.map((transaction, index) => { // Añadido 'index'
			// Función auxiliar para escapar delimitadores y dobles comillas en campos
			const escapeCsvField = (field: any) => {
                if (field === null || field === undefined) return '';
                const stringField = String(field);
				// Escapar campos si contienen el delimitador (punto y coma), comillas dobles o salto de línea
				if (stringField.includes(';') || stringField.includes('"') || stringField.includes('\n')) { // Escapando ';'
					// Si el campo contiene punto y coma, comillas dobles o salto de línea, enciérralo entre comillas dobles
					// y escapa cualquier comilla doble dentro duplicándola.
					return `"${stringField.replace(/"/g, '""')}"`;
				}
				return stringField;
			};

			// Formatear el monto: añadir signo y reemplazar punto decimal por coma
			const formattedAmount = `${transaction.type === 'income' ? '+' : '-'}${transaction.amount.toFixed(2).replace('.', ',')}`;

			return [
				escapeCsvField(index + 1), // Usar número secuencial (empezando en 1)
				escapeCsvField(transaction.name),
				escapeCsvField(formattedAmount), // Usar el monto formateado con signo y coma decimal
				escapeCsvField(transaction.type),
				escapeCsvField(transaction.date),
				escapeCsvField(transaction.category || 'Sin categoría') // Manejar categoría opcional
			].join(';'); // Unir campos con PUNTO Y COMA
		}).join('\n'); // Unir filas con salto de línea

		// Combinar encabezado y filas de datos, AÑADIENDO EL BOM UTF-8 al inicio
		const csvString = '\ufeff' + header + csvRows; // Mantenemos '\ufeff' para codificación

		// Crear un Blob
		const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' }); // Mantenemos type

		// Crear un enlace temporal para descargar el archivo
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `transacciones-${new Date().toISOString().slice(0,10)}.csv`; // Nombre del archivo

		// Disparar la descarga
		a.click();

		// Liberar la URL del Blob después de un pequeño retraso
		setTimeout(() => {
			URL.revokeObjectURL(url);
		}, 0);
	};


</script>

<main class="p-4 flex flex-col gap-4 mx-auto w-full lg:max-w-screen-xl xl:max-w-screen-2xl">

	<section class="flex flex-col md:flex-row gap-6">

		<div class="w-full md:w-1/2 flex flex-col gap-6">

			<section
				class="bg-white dark:bg-gray-800 shadow rounded-xl p-6 space-y-4"
			>
				<h2 class="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
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

			<section class="bg-white dark:bg-gray-800 shadow rounded-xl p-6 w-full space-y-4 flex flex-col h-96 overflow-hidden"> <div class="flex justify-between items-center">
					<h2 class="text-2xl font-bold text-indigo-600 dark:text-indigo-400">Transacciones</h2>
					<button
						on:click={handleRequestClearAll}
						class="bg-red-600 hover:bg-red-700 text-white py-1 px-3 rounded-lg font-semibold text-sm transition"
					>
						Limpiar todas
					</button>
				</div>
                <div class="space-y-2 flex-grow overflow-y-auto pr-2 custom-scrollbar"> <label for="categoria" class="font-semibold block"
						>Filtrar por categoría (Gastos):</label
					>
					<select
						id="categoria"
						bind:value={categoriaSeleccionada}
						class="w-full p-2 rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
					>
						<option value="Todas">Todas las categorías</option>
						{#each $categories as cat} <option value={cat}>{cat}</option>
						{/each}
					</select>
                    <ul class="w-full space-y-2">
                        {#each gastosFiltrados as transaction (transaction.id)}
                            <TransactionItem
                                {transaction}
                                on:requestDelete={handleRequestDelete}
                                on:edit={handleStartEditing}
                            />
                        {/each}
                         {#if $expenses.length === 0}
                             <p class="text-center text-gray-500 dark:text-gray-400 py-8">Aún no hay transacciones.</p>
                        {/if}
                    </ul>
                </div>
			</section>
		</div>

		<div class="w-full md:w-1/2 flex flex-col gap-6">

			<section class="bg-white dark:bg-gray-800 shadow rounded-xl p-6 space-y-2">
				 <h2 class="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                    Nueva Transacción
                 </h2>
				<AddTransaction on:add={handleAddTransaction} class="w-full" />
			</section>

			<section class="bg-white dark:bg-gray-800 shadow rounded-xl p-6 flex flex-col gap-4">
                <button
                    on:click={scrollToCharts}
                    class="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-4 rounded-lg font-semibold transition"
                > Ver Gráficos
                </button>
                <a
                    href="/configuration"
                    class="block text-center w-full bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 px-4 rounded-lg font-semibold transition dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white"
                > Ir a Configuración
                </a>
                 <button
                    on:click={exportTransactionsAsCsv}
                    class="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 px-4 rounded-lg font-semibold transition dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white"
                 > Exportar Datos
                 </button>
             </section>

		</div>

	</section>

	<section id="charts-section" class="flex flex-col md:flex-row gap-6 mt-6">

		<section
			class="bg-white dark:bg-gray-800 shadow rounded-xl p-6 w-full md:w-1/2 space-y-4"
		>
			<h2 class="2xl font-bold text-indigo-600 dark:text-indigo-400">
				Gastos e Ingresos Diarios
			</h2>
			<div class="relative h-96 w-full">
				<canvas bind:this={barCanvasElement}></canvas>
			</div>
		</section>

		<section
			class="bg-white dark:bg-gray-800 shadow rounded-xl p-6 w-full md:w-1/2 space-y-4 flex flex-col items-center justify-center"
		>
			<h2 class="2xl font-bold text-indigo-600 dark:text-indigo-400">
				Distribución de Gastos
			</h2>
			<div class="relative h-72 w-72 md:h-80 md:w-80">
				<canvas bind:this={pieCanvasElement}></canvas>
			</div>
			{#if pieChartDataValues.length === 0 && periodExpenses.length > 0}
				<p class="text-center text-gray-500 dark:text-gray-400 text-sm">No hay gastos con categoría en este periodo para mostrar en el gráfico de tarta.</p>
		   {/if}
			{#if periodExpenses.length === 0}
				 <p class="text-center text-gray-500 dark:text-gray-400 text-sm">No hay gastos en este periodo para mostrar en el gráfico de tarta.</p>
			{/if}
		</section>

	</section>

	{#if editingExpenseId !== null} <EditTransactionModal editingExpenseId={editingExpenseId} on:save={handleModalSave} on:cancel={handleModalCancel} />
	{/if}
	{#if isConfirmDeleteOpen} <ConfirmModal title="Confirmar Eliminación" message={confirmDeleteMessage} on:confirm={handleConfirmDelete} on:cancel={handleCancelDelete} /> {/if}
	{#if isConfirmClearAllOpen} <ConfirmModal title="Confirmar Limpiar Todo" message={confirmClearAllMessage} confirmButtonText="Sí, Eliminar Todo" confirmButtonClass="bg-red-600 hover:bg-red-700 text-white" cancelButtonText="No, Cancelar" cancelButtonClass="bg-gray-300 hover:bg-gray-400 text-gray-800" on:confirm={handleConfirmClearAll} on:cancel={handleCancelClearAll} /> {/if}

</main>

<style>
	/* Estilos para Webkit (Chrome, Safari, Edge) */
	.custom-scrollbar::-webkit-scrollbar {
		width: 8px; /* Ancho de la barra */
	}

	.custom-scrollbar::-webkit-scrollbar-track {
		background: transparent; /* Fondo transparente del riel */
        border-radius: 10px;
	}

    /* Estilos para el pulgar (modo claro) */
	.custom-scrollbar::-webkit-scrollbar-thumb {
		background-color: rgba(0, 0, 0, 0.2); /* Color del pulgar (semitransparente oscuro) */
		border-radius: 10px; /* Bordes redondeados del pulgar */
        border: 2px solid transparent; /* Borde transparente para hacer el pulgar más delgado visualmente */
        background-clip: content-box; /* Asegura que el borde no afecte el tamaño del fondo */
	}

	/* Estilos para el pulgar al pasar el ratón (modo claro) */
	.custom-scrollbar::-webkit-scrollbar-thumb:hover {
		background-color: rgba(0, 0, 0, 0.3); /* Pulgar un poco más visible al pasar el ratón */
	}

    /* Estilos para el pulgar en modo oscuro usando :global() */
    :global(.dark) .custom-scrollbar::-webkit-scrollbar-thumb {
        background-color: rgba(255, 255, 255, 0.3); /* Pulgar semitransparente claro en modo oscuro */
         border-color: transparent; /* Mantener borde transparente */
    }
     :global(.dark) .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background-color: rgba(255, 255, 255, 0.5); /* Pulgar más visible en modo oscuro al pasar el ratón */
         border-color: transparent; /* Mantener borde transparente */
    }


	/* Estilos básicos para Firefox */
    /* Nota: Firefox styling is limited compared to Webkit */
	.custom-scrollbar {
		scrollbar-width: thin; /* "auto" o "thin" */
		scrollbar-color: rgba(0, 0, 0, 0.2) transparent; /* color del pulgar y color del track (transparente) */
	}

    /* Estilos básicos para Firefox en modo oscuro usando :global() */
     :global(.dark) .custom-scrollbar {
        scrollbar-color: rgba(255, 255, 255, 0.3) transparent; /* color del pulgar y color del track (transparente) en modo oscuro */
     }

	/* Esconder la barra de scroll en IE y Edge anterior */
	.custom-scrollbar {
	  -ms-overflow-style: none;
	}

	/* Esconder la barra de scroll en navegadores Webkit pero mantener la funcionalidad */
	/* .custom-scrollbar::-webkit-scrollbar {
	  display: none;
	} */ /* Descomentar si quieres ocultar la barra pero mantener scroll */

</style>
