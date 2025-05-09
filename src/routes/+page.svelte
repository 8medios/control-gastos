<script lang="ts">
  import AddExpense from "$lib/components/AddExpense.svelte";
  import ExpenseItem from "$lib/components/ExpenseItem.svelte";
  import type { Expense, BudgetConfig } from "$lib/types"; // Importar BudgetConfig
  import { expenses } from "$lib/stores";
  import { budget } from "$lib/config"; // Ahora este store contiene BudgetConfig

  const handleAddExpense = (e: CustomEvent<Expense>) => {
    expenses.update((list) => [e.detail, ...list]);
  };

  const handleDeleteExpense = (e: CustomEvent<string>) => {
    const idToDelete = e.detail;
    expenses.update((list) => {
      return list.filter((expense) => expense.id !== idToDelete);
    });
  };

  let editingExpense: Expense | null = null;

  const handleStartEditing = (e: CustomEvent<string>) => {
    const idToEdit = e.detail;
    const expenseToEdit = $expenses.find((expense) => expense.id === idToEdit);
    editingExpense = expenseToEdit || null;
  };

  const handleCancelEditing = () => {
    editingExpense = null;
  };

  const handleUpdateExpense = () => {
    if (!editingExpense) {
      console.warn("No hay gasto seleccionado para editar.");
      return;
    }
    if (!editingExpense.name.trim() || editingExpense.amount <= 0) {
      console.warn(
        "Por favor, completa el nombre y el monto correctamente al editar."
      );
      return;
    }

    expenses.update((list) => {
      return list.map((expense) => {
        if (expense.id === editingExpense?.id) {
          return editingExpense;
        }
        return expense;
      });
    });

    editingExpense = null;
  };

  // ** CÁLCULOS BASADOS EN EL PERIODO DE PRESUPUESTO **

  // El total de gastos ahora suma solo los gastos DENTRO del periodo actual
  $: totalGastos = $expenses.reduce((acc, item) => {
    // Parsear las fechas para comparar, o comparar las strings ISO directamente si están en YYYY-MM-DD
    const expenseDate = item.date;
    const startDate = $budget.startDate;

    // Determinar la fecha de fin del periodo (ej. un mes después de startDate)
    const start = new Date(startDate);
    const endDate = new Date(
      start.getFullYear(),
      start.getMonth() + 1,
      start.getDate() - 1
    )
      .toISOString()
      .slice(0, 10); // Fin del mes

    // Comparar fechas: item.date >= startDate Y item.date <= endDate
    if (expenseDate >= startDate && expenseDate <= endDate) {
      return acc + item.amount;
    }
    return acc;
  }, 0);

  $: restante = $budget.amount - totalGastos; // Usamos $budget.amount
  $: diasTotalesPeriodo = calcularDiasTotalesPeriodo($budget.startDate); // Necesitamos esta función
  $: diasRestantesPeriodo = calcularDiasRestantesPeriodo($budget.startDate); // Necesitamos esta función
  $: diario = (restante / diasRestantesPeriodo).toFixed(2);
  $: semanal = (restante / (diasRestantesPeriodo / 7)).toFixed(2); // Semanas restantes

  // Función para calcular el número total de días en el periodo
  function calcularDiasTotalesPeriodo(startDateString: string): number {
    const start = new Date(startDateString);
    // El periodo termina un mes después del día de inicio (ej. 15 Mayo -> 14 Junio)
    const endOfPeriod = new Date(
      start.getFullYear(),
      start.getMonth() + 1,
      start.getDate()
    );
    const diffTime = endOfPeriod.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  // Función para calcular los días restantes en el periodo
  function calcularDiasRestantesPeriodo(startDateString: string): number {
    const hoy = new Date();
    // Asegurarse de comparar solo la parte de la fecha
    hoy.setHours(0, 0, 0, 0);

    const start = new Date(startDateString);
    start.setHours(0, 0, 0, 0);

    // El periodo termina un mes después del día de inicio
    const endOfPeriod = new Date(
      start.getFullYear(),
      start.getMonth() + 1,
      start.getDate()
    );
    endOfPeriod.setHours(0, 0, 0, 0);

    // Si hoy es ANTES del inicio del periodo, los días restantes son los días totales del periodo
    if (hoy < start) {
      return calcularDiasTotalesPeriodo(startDateString);
    }
    // Si hoy es DESPUÉS del fin del periodo, los días restantes son 0
    if (hoy >= endOfPeriod) {
      return 0;
    }

    // Si hoy está DENTRO del periodo
    const diffTime = endOfPeriod.getTime() - hoy.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // Usamos ceil para contar el día actual
    return diffDays;
  }

  // Las funciones anteriores diasRestantes y semanasRestantes ya no son necesarias
  // function diasRestantes(): number { /* ... */ }
  // function semanasRestantes(): number { /* ... */ }

  const clearExpenses = () => {
    if (confirm("¿Borrar todos los gastos?")) {
      expenses.set([]);
    }
  };

  let categoriaSeleccionada: string = "Todas";

  $: gastosFiltrados = $expenses.filter((expense) => {
    const expenseCategory = expense.category || "Otros";
    return (
      categoriaSeleccionada === "Todas" ||
      expenseCategory === categoriaSeleccionada
    );
  });

  const categories = [
    "Alimentación",
    "Transporte",
    "Entretenimiento",
    "Salud",
    "Educación",
    "Otros",
  ];

  // ** MEJORAS DE ESTILO EN LA SECCIÓN DE RESUMEN **
  $: porcentajeGastado =
    $budget.amount > 0
      ? Math.min((totalGastos / $budget.amount) * 100, 100)
      : 0;
  $: progresoColor =
    porcentajeGastado < 50
      ? "bg-green-500"
      : porcentajeGastado < 85
        ? "bg-yellow-500"
        : "bg-red-500";
</script>

<main class="p-4 flex flex-col items-center gap-6">
  <section
    class="bg-white dark:bg-gray-800 shadow rounded-xl p-6 w-full max-w-md space-y-4"
  >
    <h2 class="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mb-4">
      Resumen del Periodo
    </h2>
    <div class="grid grid-cols-2 gap-4 text-gray-700 dark:text-gray-300">
      <p>
        <strong class="block text-sm">Presupuesto:</strong>
        <span class="text-lg font-semibold">${$budget.amount.toFixed(2)}</span>
      </p>
      <p>
        <strong class="block text-sm">Gastos (periodo):</strong>
        <span class="text-lg font-semibold text-red-600 dark:text-red-400"
          >${totalGastos.toFixed(2)}</span
        >
      </p>
      <p>
        <strong class="block text-sm">Restante:</strong>
        <span class="text-lg font-semibold text-green-600 dark:text-green-400"
          >${restante.toFixed(2)}</span
        >
      </p>
      <p>
        <strong class="block text-sm">Días restantes:</strong>
        <span class="text-lg font-semibold">{diasRestantesPeriodo}</span>
      </p>
    </div>

    <div class="w-full mt-4">
      <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        Progreso del Gasto ({porcentajeGastado.toFixed(1)}%)
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

  {#if editingExpense}
    <section
      class="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-md max-w-md w-full"
    >
      <h2 class="text-lg font-bold mb-4 text-gray-800 dark:text-white">
        Editar Gasto
      </h2>
      <form on:submit|preventDefault={handleUpdateExpense} class="space-y-2">
        <div>
          <label
            for="edit-name"
            class="block text-sm font-medium text-gray-700 dark:text-gray-200"
            >Nombre</label
          >
          <input
            id="edit-name"
            bind:value={editingExpense.name}
            type="text"
            class="w-full p-2 rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
        </div>
        <div>
          <label
            for="edit-amount"
            class="block text-sm font-medium text-gray-700 dark:text-gray-200"
            >Monto ($)</label
          >
          <input
            id="edit-amount"
            bind:value={editingExpense.amount}
            type="number"
            min="0"
            class="w-full p-2 rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
        </div>
        <div>
          <label
            for="edit-date"
            class="block text-sm font-medium text-gray-700 dark:text-gray-200"
            >Fecha</label
          >
          <input
            id="edit-date"
            bind:value={editingExpense.date}
            type="date"
            class="w-full p-2 rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
        </div>
        <div>
          <label
            for="edit-category"
            class="block text-sm font-medium text-gray-700 dark:text-gray-200"
            >Categoría</label
          >
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
          <button
            type="button"
            on:click={handleCancelEditing}
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
  {/if}

  <section class="w-full max-w-md space-y-2">
    <label for="categoria" class="font-semibold block"
      >Filtrar por categoría:</label
    >
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
      <ExpenseItem
        {expense}
        on:delete={handleDeleteExpense}
        on:edit={handleStartEditing}
      />
    {/each}
  </ul>
</main>
