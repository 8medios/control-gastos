<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { onMount } from "svelte";
  import type { Transaction } from "$lib/types";
  import { categories, expenses } from "$lib/stores";

  export let editingExpenseId: string | null;

  const dispatch = createEventDispatcher<{ save: Transaction; cancel: void }>();

  // Variable local para la transacción a editar (copia profunda)
  let editedTransaction: Transaction | null = null;

  // Variables locales separadas para el binding de los inputs
  let localName: string = '';
  let localAmount: number = 0;
  let localDate: string = '';
  let localSelectedCategory: string = '';

  // Estados locales para errores de validación por campo
  let nameError: string | null = null;
  let amountError: string | null = null;
  let dateError: string | null = null;
  let categoryError: string | null = null;

  // Guardamos el ID previo para evitar re-asignaciones innecesarias
  let previousId: string | null = null;

  // Reactive statement: Se ejecuta cuando editingExpenseId o $expenses cambian
  $: if (editingExpenseId !== null && editingExpenseId !== previousId) {
      console.log("Nuevo editingExpenseId detectado:", editingExpenseId);
      const transactionToEdit = $expenses.find(t => t.id === editingExpenseId);
      if (transactionToEdit) {
          // Crear una copia profunda para evitar referencias al objeto original del store
          editedTransaction = JSON.parse(JSON.stringify(transactionToEdit));
          previousId = editingExpenseId;

          // Inicializar las variables locales desde editedTransaction
          localName = editedTransaction.name;
          localAmount = editedTransaction.amount;
          localDate = editedTransaction.date;
          
          // Inicializar localSelectedCategory
          if (editedTransaction.type === 'expense' && editedTransaction.category !== undefined) {
              localSelectedCategory = editedTransaction.category;
          } else {
              localSelectedCategory = $categories.length > 0 ? $categories[0] : 'Otros';
          }

          console.log("editedTransaction inicializado (copia profunda):", editedTransaction);
          console.log("Variables locales inicializadas:", { localName, localAmount, localDate, localSelectedCategory });

          // Validar todos los campos al inicializar
          validateField('all');
      } else {
          console.warn(`Transacción con ID ${editingExpenseId} no encontrada en el store.`);
          // Si la transacción no se encuentra, cerramos el modal
          handleCancelClick();
      }
  }

  // Reactive statement: Se ejecuta cuando editingExpenseId pasa a ser null
  $: if (editingExpenseId === null) {
      console.log("editingExpenseId es null. Cerrando modal y limpiando estado.");
      editedTransaction = null;
      previousId = null;
      // Limpiar también las variables locales y errores cuando el modal se cierra
      localName = '';
      localAmount = 0;
      localDate = '';
      localSelectedCategory = '';
      nameError = null;
      amountError = null;
      dateError = null;
      categoryError = null;
  }

  // Función de validación mejorada: ahora valida usando las variables locales
  function validateField(fieldName: 'name' | 'amount' | 'date' | 'category' | 'all'): boolean {
    // Asegurarse de que editedTransaction existe antes de validar.
    if (!editedTransaction) {
        console.log(`validateField: editedTransaction es null. Campo: ${fieldName}`);
        return false;
    }

    let isValid = true;

    // Validar Nombre (usando localName)
    if (fieldName === 'name' || fieldName === 'all') {
      if (!localName.trim()) {
        nameError = "La descripción no puede estar vacía.";
        isValid = false;
      } else {
        nameError = null; // Limpiar error si es válido
      }
    }

    // Validar Monto (usando localAmount)
    if (fieldName === 'amount' || fieldName === 'all') {
      if (isNaN(localAmount) || localAmount <= 0) {
        amountError = "El monto debe ser un número positivo.";
        isValid = false;
      } else {
        amountError = null; // Limpiar error si es válido
      }
    }

    // Validar Fecha (usando localDate)
    if (fieldName === 'date' || fieldName === 'all') {
       const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
       if (!localDate || !localDate.match(dateRegex)) {
           dateError = "Formato de fecha inválido (YYYY-MM-DD).";
           isValid = false;
       } else {
           // Opcional: Validar si la fecha es una fecha válida
           const [year, month, day] = localDate.split('-').map(Number);
           const d = new Date(year, month - 1, day);
            if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day) {
               dateError = "Fecha inválida.";
               isValid = false;
           } else {
               dateError = null; // Limpiar error si es válido
           }
       }
    }

    // Validar Categoría (solo para gastos, usando localSelectedCategory)
    if (fieldName === 'category' || fieldName === 'all') {
      if (editedTransaction.type === "expense" && !localSelectedCategory) {
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
    // Asegurarse de que editedTransaction existe antes de guardar
    if (!editedTransaction) return;

    // Sincronizar editedTransaction con los valores de las variables locales
    editedTransaction.name = localName;
    editedTransaction.amount = localAmount;
    editedTransaction.date = localDate;
    
    // Sincronizar categoría solo si es un gasto
    if (editedTransaction.type === 'expense') {
        editedTransaction.category = localSelectedCategory;
    } else {
        editedTransaction.category = undefined; // Asegurar que sea undefined para ingresos
    }

    console.log("Intentando guardar. editedTransaction (sincronizado):", editedTransaction);

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
    console.log("Cancelando edición.");
    dispatch("cancel"); // Despachamos evento 'cancel'
  };

  // Manejar el cierre del modal al presionar Escape, Espacio o Enter
  function handleKeydown(event: KeyboardEvent) {
    if (event.key === "Escape") {
      handleCancelClick();
    }
    // También cerrar si se presiona Espacio o Enter EN el overlay (si tiene focus)
    if ((event.key === " " || event.key === "Enter") && event.target === event.currentTarget) {
        event.preventDefault(); // Prevenir scroll si es Espacio
        handleCancelClick();
    }
  }

  // Manejar el cierre del modal con on:keypress
  function handleKeypress(event: KeyboardEvent) {
      if ((event.key === " " || event.key === "Enter") && event.target === event.currentTarget) {
          event.preventDefault(); // Prevenir scroll si es Espacio
          handleCancelClick();
      }
  }

  // Asegurar que el modal captura eventos de teclado al montarse y limpia al desmontarse
  onMount(() => {
    console.log("Modal montado.");
    window.addEventListener("keydown", handleKeydown);
    return () => {
      console.log("Modal desmontado.");
      // Limpiar el listener al desmontar
      window.removeEventListener("keydown", handleKeydown);
    };
  });

  // Reactive statement: Se ejecuta cuando el store $categories cambia
  $: if ($categories && editedTransaction) {
      console.log("Store $categories cambió.");
      // Si es un gasto y la categoría seleccionada actualmente
      // no está en la nueva lista de categorías, la ajustamos
      if (editedTransaction.type === 'expense') {
          const defaultCategory = $categories.length > 0 ? $categories[0] : 'Otros';
          // Solo ajustamos localSelectedCategory si su valor actual no es válido
          if (!$categories.includes(localSelectedCategory)) {
              console.log(`localSelectedCategory "${localSelectedCategory}" no está en la lista de categorías. Ajustando a por defecto.`);
              // Solo actualizamos si el valor va a cambiar para evitar bucles reactivos
              if (localSelectedCategory !== defaultCategory) {
                 localSelectedCategory = defaultCategory;
                 // Re-validar el campo de categoría después de cambiar localSelectedCategory
                 validateField('category');
              }
          } else {
              console.log(`localSelectedCategory "${localSelectedCategory}" es válida en la lista de categorías.`);
          }
      }
      // Si es un ingreso, la categoría no es relevante
      if (editedTransaction.type === 'income') {
          categoryError = null;
      }
  }

  // Reactive statement: Se ejecuta cuando las variables locales cambian
  $: {
      // Asegurarse de que editedTransaction existe antes de intentar actualizarlo o validar
      if (editedTransaction) {
          console.log("Variables locales cambiaron. Sincronizando editedTransaction y re-validando.");
          console.log("Estado de variables locales:", {localName, localAmount, localDate, localSelectedCategory});

          // Sincronizar editedTransaction con los valores de las variables locales
          editedTransaction.name = localName;
          editedTransaction.amount = localAmount;
          editedTransaction.date = localDate;
          
          // Sincronizar categoría solo si es un gasto
          if (editedTransaction.type === 'expense') {
              editedTransaction.category = localSelectedCategory;
          } else {
              editedTransaction.category = undefined; // Asegurar que sea undefined para ingresos
          }

          console.log("editedTransaction después de sincronización:", editedTransaction);

          // Re-validar los campos relevantes
          validateField('name');
          validateField('amount');
          validateField('date');
          
          // Validar categoría solo si es un gasto
          if (editedTransaction.type === 'expense') {
              validateField('category');
          } else {
              categoryError = null; // Limpiar error de categoría si cambia a ingreso
          }
      }
  }

  // --- Handlers para validación instantánea (on:blur) ---
  const handleNameBlur = () => { console.log("Blur en nombre. Valor:", localName); validateField('name'); };
  const handleAmountBlur = () => { console.log("Blur en monto. Valor:", localAmount); validateField('amount'); };
  const handleDateBlur = () => { console.log("Blur en fecha. Valor:", localDate); validateField('date'); };
  const handleCategoryBlur = () => {
      console.log("Blur en categoría. localSelectedCategory:", localSelectedCategory);
      validateField('category');
  };

  // --- Opcional: Validar mientras se escribe (on:input) ---
  const handleNameInput = () => { 
      console.log("Input en nombre. Valor (después de bind):", localName); 
      console.log("Estado de variables locales después de input:", {localName, localAmount, localDate, localSelectedCategory}); 
      if (nameError) validateField('name'); 
  };
  
  const handleAmountInput = () => { 
      console.log("Input en monto. Valor (después de bind):", localAmount); 
      console.log("Estado de variables locales después de input:", {localName, localAmount, localDate, localSelectedCategory}); 
      if (amountError) validateField('amount'); 
  };
  
  const handleDateInput = () => { 
      console.log("Input en fecha. Valor (después de bind):", localDate); 
      console.log("Estado de variables locales después de input:", {localName, localAmount, localDate, localSelectedCategory}); 
      if (dateError) validateField('date'); 
  };
  
  const handleCategoryInput = () => {
      console.log("Input en categoría. localSelectedCategory (después de bind):", localSelectedCategory);
      console.log("Estado de variables locales después de input (categoría):", {localName, localAmount, localDate, localSelectedCategory});
      validateField('category');
  };
</script>

{#if editedTransaction}
<div
  class="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-75 flex items-center justify-center p-4 z-50"
  on:click|self={handleCancelClick}
  on:keydown={handleKeydown}
  on:keypress={handleKeypress} 
  role="button" 
  aria-label="Cerrar modal"
  tabindex="0">
  <section
    class="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl max-w-md w-full max-h-full overflow-y-auto"
  >
    <h2 class="text-xl font-bold mb-4 text-gray-800 dark:text-white">
      Editar Transacción
    </h2>

    <form on:submit|preventDefault={handleSubmit} class="space-y-4">
      <div class="mb-4">
        <strong
          class="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-200"
          >Tipo</strong
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
          bind:value={localName} 
          type="text"
          class="w-full p-2 rounded border {nameError ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} dark:bg-gray-700 dark:text-white"
          on:blur={handleNameBlur}
          on:input={handleNameInput} />
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
          bind:value={localAmount}
          type="number"
          min="0"
          step="0.01"
          class="w-full p-2 rounded border {amountError ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} dark:bg-gray-700 dark:text-white"
          on:blur={handleAmountBlur}
          on:input={handleAmountInput} />
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
          bind:value={localDate} 
          type="date"
          class="w-full p-2 rounded border {dateError ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} dark:bg-gray-700 dark:text-white"
          on:blur={handleDateBlur}
          on:input={handleDateInput} />
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
            bind:value={localSelectedCategory} 
            class="w-full p-2 rounded border {categoryError ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} dark:bg-gray-700 dark:text-white"
            on:blur={handleCategoryBlur} 
            on:input={handleCategoryInput}>
            {#each $categories as cat}
              <option value={cat}>{cat}</option>
            {/each}
            {#if !$categories.includes(localSelectedCategory) && localSelectedCategory !== undefined}
              <option value={localSelectedCategory} selected disabled>
                {localSelectedCategory} (Inválida)
              </option>
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
          class="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-700 text-gray-800 dark:text-gray-200 font-semibold transition"
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
{/if}