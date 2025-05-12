<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { v4 as uuid } from "uuid";
  import type { Transaction } from "$lib/types";
  import { categories } from "$lib/stores"; // Importar el store de categorías

  const dispatch = createEventDispatcher<{ add: Transaction }>();

  // Estados locales para los campos del formulario
  let name = "";
  let amount: number | "" = ""; // Usamos number | "" para permitir el campo vacío inicialmente
  let date = new Date().toISOString().slice(0, 10);
  let transactionType: "expense" | "income" = "expense";
  // Inicializar categoría con la primera del store o un valor por defecto si el store está vacío
  let category: string = $categories.length > 0 ? $categories[0] : "Otros";


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
      if (!name.trim()) {
        nameError = "La descripción no puede estar vacía.";
        isValid = false;
      } else {
        nameError = null; // Limpiar error si es válido
      }
    }

    // Validar Monto
    if (fieldName === 'amount' || fieldName === 'all') {
      const numericAmount = +amount; // Convertir a número
      if (amount === "" || isNaN(numericAmount) || numericAmount <= 0) {
        amountError = "El monto debe ser un número positivo.";
        isValid = false;
      } else {
        amountError = null; // Limpiar error si es válido
      }
    }

    // Validar Fecha
    if (fieldName === 'date' || fieldName === 'all') {
       // Validación básica de formato ISO YYYY-MM-DD
       const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
       if (!date || !dateRegex.test(date)) {
           dateError = "Formato de fecha inválido (YYYY-MM-DD).";
           isValid = false;
       } else {
           // Opcional: Validar si la fecha es una fecha válida (ej. no 2023-02-30)
           const [year, month, day] = date.split('-').map(Number);
           const d = new Date(year, month - 1, day); // month - 1 porque los meses en Date son 0-indexados
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
      if (transactionType === 'expense' && !category) {
         // Esto podría ocurrir si permites una opción vacía en el select
         // Con la configuración actual ('Otros' como defecto), esto es menos probable
        categoryError = "Debes seleccionar una categoría para gastos.";
        isValid = false;
      } else {
        categoryError = null; // Limpiar error si es válido
      }
    }

    // Cuando se valida 'all', el retorno indica si TODOS los campos son válidos
    // Cuando se valida un campo específico, el retorno no es tan relevante para el flujo principal
    return isValid;
  }

  // Handler para el envío del formulario
  const handleSubmit = () => {
    // Validar todos los campos antes de enviar
    if (!validateField('all')) {
      console.warn("Errores de validación. No se agregó la transacción.");
      return; // Detener el envío si la validación falla
    }

    // Si la validación pasa, crear y despachar la nueva transacción
    const newTransaction: Transaction = {
      id: uuid(), // Generar un ID único
      name,
      amount: +amount, // Convertir el monto a número
      date,
      type: transactionType,
      category: transactionType === "expense" ? category : undefined, // Categoría solo para gastos
    };

    dispatch("add", newTransaction);

    // Resetear campos y errores después de un envío exitoso
    name = "";
    amount = "";
    date = new Date().toISOString().slice(0, 10);
    transactionType = "expense";
    category = $categories.length > 0 ? $categories[0] : "Otros"; // Resetear a la primera categoría o valor por defecto

    nameError = null;
    amountError = null;
    dateError = null;
    categoryError = null;
  };

  // --- Handlers para validación instantánea (on:blur) ---
  const handleNameBlur = () => validateField('name');
  const handleAmountBlur = () => validateField('amount');
  const handleDateBlur = () => validateField('date');
  const handleCategoryBlur = () => validateField('category');

  // --- Opcional: Validar mientras se escribe (on:input) ---
  // Puedes añadir validaciones más ligeras aquí si no son costosas
  // Por ejemplo, solo verificar si el campo no está vacío
  const handleNameInput = () => {
      if (nameError) validateField('name'); // Solo re-validar si ya había un error
  };
   const handleAmountInput = () => {
       if (amountError) validateField('amount'); // Solo re-validar si ya había un error
   };
   const handleDateInput = () => {
        if (dateError) validateField('date'); // Solo re-validar si ya había un error
   };


   // Declaración reactiva para limpiar el error de categoría si el tipo cambia a ingreso
   $: if (transactionType === 'income') {
       categoryError = null;
   }

   // Declaración reactiva para actualizar la categoría por defecto si el store de categorías cambia
   $: category = $categories.includes(category) ? category : ($categories.length > 0 ? $categories[0] : "Otros");


</script>

<div
  {...$$restProps}
  class="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-md w-full space-y-4"
>
  <h2 class="text-lg font-bold text-gray-800 dark:text-white">
    Nueva Transacción
  </h2>

  <form on:submit|preventDefault={handleSubmit} class="space-y-4">
      <div class="mb-4">
        <!-- svelte-ignore a11y_label_has_associated_control -->
        <label
          class="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-200"
          >Tipo</label
        >
        <div class="flex gap-4">
          <label class="inline-flex items-center">
            <input
              type="radio"
              bind:group={transactionType}
              value="expense"
              class="form-radio text-blue-600 dark:text-blue-400"
            />
            <span class="ml-2 text-gray-700 dark:text-gray-300">Gasto</span>
          </label>
          <label class="inline-flex items-center">
            <input
              type="radio"
              bind:group={transactionType}
              value="income"
              class="form-radio text-green-600 dark:text-green-400"
            />
            <span class="ml-2 text-gray-700 dark:text-gray-300">Ingreso</span>
          </label>
        </div>
      </div>

      <div>
        <label
          for="add-name"
          class="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-200"
          >Descripción</label
        >
        <input
          id="add-name"
          bind:value={name}
          type="text"
          placeholder="Descripción"
          class="w-full p-2 rounded border {nameError ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} dark:bg-gray-700 dark:text-white"
          on:blur={handleNameBlur}   on:input={handleNameInput} />
        {#if nameError}
          <p class="text-red-500 text-xs mt-1">{nameError}</p>
        {/if}
      </div>

      <div>
        <label
          for="add-amount"
          class="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-200"
          >Monto ($)</label
        >
        <input
          id="add-amount"
          bind:value={amount}
          type="number"
          placeholder="Monto"
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
          for="add-date"
          class="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-200"
          >Fecha</label
        >
        <input
          id="add-date"
          bind:value={date}
          type="date"
          class="w-full p-2 rounded border {dateError ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} dark:bg-gray-700 dark:text-white"
          on:blur={handleDateBlur}   on:input={handleDateInput} />
        {#if dateError}
          <p class="text-red-500 text-xs mt-1">{dateError}</p>
        {/if}
      </div>

      {#if transactionType === "expense"}
        <div>
          <label
            for="add-category"
            class="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-200"
            >Categoría</label
          >
          <select
            id="add-category"
            bind:value={category}
            class="w-full p-2 rounded border {categoryError ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} dark:bg-gray-700 dark:text-white"
             on:blur={handleCategoryBlur} on:input={handleCategoryBlur} >
             {#each $categories as cat} <option value={cat}>{cat}</option>
             {/each}
          </select>
          {#if categoryError}
            <p class="text-red-500 text-xs mt-1">{categoryError}</p>
          {/if}
        </div>
      {/if}

      <button
        type="submit"
        class="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-semibold transition mt-4"
      >
        Agregar Transacción
      </button>
  </form>
</div>
