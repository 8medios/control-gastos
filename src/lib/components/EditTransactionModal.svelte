<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { onMount } from "svelte";
  import type { Transaction } from "$lib/types";

  export let transaction: Transaction; // Transacción a editar
  export let categories: string[]; // Lista de categorías

  const dispatch = createEventDispatcher<{ save: Transaction; cancel: void }>();

  // Copia local de la transacción para editar
  let editedTransaction: Transaction = { ...transaction };

  // Estados locales para errores de validación por campo
  let nameError: string | null = null;
  let amountError: string | null = null;
  let dateError: string | null = null;
  let categoryError: string | null = null;

  // Función de validación mejorada: puede validar un campo específico o todos
  function validateField(fieldName: 'name' | 'amount' | 'date' | 'category' | 'all'): boolean {
    let isValid = true;

    // Validar Nombre
    if (fieldName === 'name' || fieldName === 'all') {
      if (!editedTransaction.name.trim()) {
        nameError = "La descripción no puede estar vacía.";
        isValid = false;
      } else {
        nameError = null; // Limpiar error si es válido
      }
    }

    // Validar Monto
    if (fieldName === 'amount' || fieldName === 'all') {
      // Asegurarse de que editedTransaction.amount sea un número antes de validar
      const numericAmount = typeof editedTransaction.amount === 'number' ? editedTransaction.amount : parseFloat(String(editedTransaction.amount));

      if (isNaN(numericAmount) || numericAmount <= 0) {
        amountError = "El monto debe ser un número positivo.";
        isValid = false;
      } else {
        amountError = null; // Limpiar error si es válido
      }
    }

    // Validar Fecha
    if (fieldName === 'date' || fieldName === 'all') {
       const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
       if (!editedTransaction.date || !dateRegex.test(editedTransaction.date)) {
           dateError = "Formato de fecha inválido (YYYY-MM-DD).";
           isValid = false;
       } else {
           // Opcional: Validar si la fecha es una fecha válida
           const [year, month, day] = editedTransaction.date.split('-').map(Number);
           const d = new Date(year, month - 1, day);
            if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day) {
               dateError = "Fecha inválida.";
               isValid = false;
           } else {
               dateError = null; // Limpiar error si es válido
           }
       }
    }

    // Validar Categoría (solo para gastos)
    if (fieldName === 'category' || fieldName === 'all') {
      if (editedTransaction.type === "expense" && !editedTransaction.category) {
        categoryError = "Debes seleccionar una categoría para gastos.";
        isValid = false;
      } else {
        categoryError = null; // Limpiar error si es válido
      }
    }

    // Cuando se valida 'all', el retorno indica si TODOS los campos son válidos
    return isValid;
  }

  // Handler para guardar cambios
  const handleSubmit = () => {
    // Validar todos los campos antes de despachar
    if (!validateField('all')) {
      console.warn("Errores de validación. No se guardaron los cambios.");
      return; // Detiene el envío si la validación falla
    }

    // Si la validación pasa, despachamos el evento 'save' con la transacción modificada
    dispatch("save", editedTransaction);
  };

  // Handler para cancelar edición
  const handleCancelClick = () => {
    dispatch("cancel"); // Despachamos evento 'cancel'
  };

  // Manejar el cierre del modal al presionar Escape
  function handleKeydown(event: KeyboardEvent) {
    if (event.key === "Escape") {
      handleCancelClick();
    }
  }

  // Asegurar que el modal captura eventos de teclado al montarse y limpia al desmontarse
  onMount(() => {
    window.addEventListener("keydown", handleKeydown);
    // Validar todos los campos al abrir el modal inicialmente
    validateField('all');
    return () => {
      // Limpiar el listener al desmontar
      window.removeEventListener("keydown", handleKeydown);
    };
  });

  // Asegurar que editedTransaction se reinicializa si la prop 'transaction' cambia
  // y re-validar los campos para la nueva transacción
  $: if (transaction) {
    editedTransaction = { ...transaction };
    // Validar todos los campos para la nueva transacción al cambiar
    validateField('all');
  }

   // --- Handlers para validación instantánea (on:blur) ---
  const handleNameBlur = () => validateField('name');
  const handleAmountBlur = () => validateField('amount');
  const handleDateBlur = () => validateField('date');
  const handleCategoryBlur = () => validateField('category');

  // --- Opcional: Validar mientras se escribe (on:input) ---
  // Puedes añadir validaciones más ligeras aquí si no son costosas
   const handleNameInput = () => {
       if (nameError) validateField('name'); // Solo re-validar si ya había un error
   };
    const handleAmountInput = () => {
        if (amountError) validateField('amount'); // Solo re-validar si ya había un error
    };
    const handleDateInput = () => {
         if (dateError) validateField('date'); // Solo re-validar si ya había un error
    };

    // Reactive statement to clear category error if type changes (though type is not editable here)
    // Kept for consistency if type editing were added later
    // $: if (editedTransaction.type === 'income') {
    //     categoryError = null;
    // }


</script>

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
          class="w-full p-2 rounded border {nameError ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} dark:bg-gray-700 dark:text-white"
          on:blur={handleNameBlur}   on:input={handleNameInput} />
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
          class="w-full p-2 rounded border {amountError ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} dark:bg-gray-700 dark:text-white"
          on:blur={handleAmountBlur}   on:input={handleAmountInput} />
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
          class="w-full p-2 rounded border {dateError ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} dark:bg-gray-700 dark:text-white"
          on:blur={handleDateBlur}   on:input={handleDateInput} />
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
            class="w-full p-2 rounded border {categoryError ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} dark:bg-gray-700 dark:text-white"
             on:blur={handleCategoryBlur} on:input={handleCategoryBlur} >
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
