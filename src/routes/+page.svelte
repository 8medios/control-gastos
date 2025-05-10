<script lang="ts">
  import AddTransaction from "$lib/components/AddTransaction.svelte";
  import TransactionItem from "$lib/components/TransactionItem.svelte";
  import EditTransactionModal from "$lib/components/EditTransactionModal.svelte";
  // Importamos el nuevo componente ConfirmModal
  import ConfirmModal from "$lib/components/ConfirmModal.svelte";
  import type { Transaction, BudgetConfig } from "$lib/types";
  import { expenses } from "$lib/stores";
  import { budget } from "$lib/config";

  const handleAddTransaction = (e: CustomEvent<Transaction>) => {
    /* ... sin cambios */
    expenses.update((list) => [e.detail, ...list]);
  };

  // La función handleDeleteExpense original ya no se llama directamente desde TransactionItem.
  // Se llamará LUEGO de confirmar en el modal.
  //   const handleDeleteExpense = (e: CustomEvent<string>) => {
  //   const idToDelete = e.detail;
  //   expenses.update((list) => {
  //     return list.filter((transaction) => transaction.id !== idToDelete);
  //   });
  // };

  // ** Lógica para Modales de Confirmación **

  // Estado para el modal de eliminar transacción individual
  let isConfirmDeleteOpen = false;
  let transactionToDeleteId: string | null = null;
  let confirmDeleteMessage = "";

  // Estado para el modal de limpiar todas las transacciones
  let isConfirmClearAllOpen = false;
  let confirmClearAllMessage =
    "¿Estás seguro de que quieres eliminar TODAS las transacciones? Esta acción no se puede deshacer.";

  // Función llamada por TransactionItem cuando quiere ser eliminado
  const handleRequestDelete = (e: CustomEvent<string>) => {
    const id = e.detail;
    const transaction = $expenses.find((item) => item.id === id); // Encontrar la transacción para el mensaje

    if (transaction) {
      transactionToDeleteId = id; // Guardar el ID del que se va a borrar
      confirmDeleteMessage = `¿Estás seguro de que quieres eliminar la transacción "${transaction.name}" (${transaction.type === "expense" ? "-" : "+"}${transaction.amount.toFixed(2)})?`;
      isConfirmDeleteOpen = true; // Mostrar el modal de confirmación individual
    }
    // Si no se encuentra la transacción, simplemente no hacemos nada (o mostramos un error)
  };

  // Función llamada por el modal de eliminación individual cuando se CONFIRMA
  const handleConfirmDelete = () => {
    if (transactionToDeleteId) {
      // Ejecutamos la lógica de eliminación (movida desde handleDeleteExpense original)
      expenses.update((list) => {
        return list.filter(
          (transaction) => transaction.id !== transactionToDeleteId
        );
      });
    }
    // Cerramos el modal y reseteamos el estado
    isConfirmDeleteOpen = false;
    transactionToDeleteId = null;
    confirmDeleteMessage = ""; // Limpiar mensaje por si acaso
  };

  // Función llamada por el modal de eliminación individual cuando se CANCELA
  const handleCancelDelete = () => {
    // Cerramos el modal y reseteamos el estado
    isConfirmDeleteOpen = false;
    transactionToDeleteId = null;
    confirmDeleteMessage = "";
  };

  // Función llamada por el botón "Limpiar todas las transacciones"
  const handleRequestClearAll = () => {
    // Mostramos el modal de confirmación para limpiar todo
    isConfirmClearAllOpen = true;
  };

  // Función llamada por el modal de limpiar todo cuando se CONFIRMA
  const handleConfirmClearAll = () => {
    // Ejecutamos la lógica de limpiar todo (movida desde clearExpenses original)
    expenses.set([]);

    // Cerramos el modal
    isConfirmClearAllOpen = false;
  };

  // Función llamada por el modal de limpiar todo cuando se CANCELA
  const handleCancelClearAll = () => {
    // Cerramos el modal
    isConfirmClearAllOpen = false;
  };

  // Lógica de edición (sin cambios en las funciones, solo en el manejo del modal)
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
  // Calcular total de INGRESOS dentro del periodo
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

  $: restante = $budget.amount + totalIngresos - totalGastos;

  $: diasRestantesPeriodo = calcularDiasRestantesPeriodo($budget.startDate);

  $: diario = (
    restante / (diasRestantesPeriodo > 0 ? diasRestantesPeriodo : 1)
  ).toFixed(2);
  $: semanal = (
    restante / (diasRestantesPeriodo > 0 ? diasRestantesPeriodo / 7 : 1)
  ).toFixed(2);

  function calcularDiasTotalesPeriodo(startDateString: string): number {
    /* ... */
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
    /* ... */
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
        <strong class="block text-sm">Presupuesto Inicial:</strong>
        <span class="text-lg font-semibold">${$budget.amount.toFixed(2)}</span>
      </p>
      <p>
        <strong class="block text-sm">Ingresos (periodo):</strong>
        <span class="text-lg font-semibold text-green-600 dark:text-green-400"
          >${totalIngresos.toFixed(2)}</span
        >
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

  <section class="w-full max-w-md space-y-2">
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
  </section>

  <AddTransaction on:add={handleAddTransaction} />

  <button
    on:click={handleRequestClearAll}
    class="bg-red-600 hover:bg-red-700 text-white py-1 px-4 rounded-lg mb-2"
  >
    Limpiar todas las transacciones
  </button>

  <ul class="w-full max-w-md space-y-2">
    {#each gastosFiltrados as transaction (transaction.id)}
      <TransactionItem
        {transaction}
        on:requestDelete={handleRequestDelete}
        on:edit={handleStartEditing}
      />
    {/each}
  </ul>
</main>
