<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { v4 as uuid } from "uuid";
  import type { Transaction } from "$lib/types";
  const dispatch = createEventDispatcher<{ add: Transaction }>();
  let name = "";
  let amount: number | "" = "";
  let date = new Date().toISOString().slice(0, 10);
  let transactionType: "expense" | "income" = "expense";
  let category: string = "Otros"; // Valor por defecto

  // ** Estado local para errores de validación **
  let nameError: string | null = null;
  let amountError: string | null = null;
  let dateError: string | null = null;
  let categoryError: string | null = null; // Para gastos

  // Función de validación
  function validateForm(): boolean {
    // Resetear errores
    nameError = null;
    amountError = null;
    dateError = null;
    categoryError = null;

    let isValid = true;

    // Validación del nombre/descripción
    if (!name.trim()) {
      nameError = "La descripción no puede estar vacía.";
      isValid = false;
    }

    // Validación del monto
    // Comprobar si es un número válido y positivo
    const numericAmount = +amount; // Convierte a número
    if (amount === "" || isNaN(numericAmount) || numericAmount <= 0) {
      amountError = "El monto debe ser un número positivo.";
      isValid = false;
    }

    // Validación de la fecha (básica)
    if (!date || !date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      dateError = "Formato de fecha inválido.";
      isValid = false;
    }

    // Validación de categoría (solo para gastos, si se muestra el campo)
    if (transactionType === "expense" && !category) {
      // Esta validación es relevante si tuvieras una opción vacía o null en el select
      // Con 'Otros' como defecto y valor, esta check específica podría no ser necesaria,
      // pero la dejo como patrón. Podrías necesitarla si modificas las opciones del select.
      categoryError = "Debes seleccionar una categoría para gastos.";
      isValid = false;
    }

    return isValid;
  }

  const handleSubmit = () => {
    // Ejecutar validación
    if (!validateForm()) {
      console.warn("Errores de validación en el formulario de añadir.");
      return; // Detiene el envío si la validación falla
    }

    // Si la validación pasa, creamos y despachamos la transacción
    const newTransaction: Transaction = {
      id: uuid(),
      name,
      amount: +amount, // Aseguramos que sea número
      date,
      type: transactionType,
      category: transactionType === "expense" ? category : undefined,
    };

    dispatch("add", newTransaction); // Resetear campos y errores después de un envío exitoso
    name = "";
    amount = "";
    date = new Date().toISOString().slice(0, 10);
    transactionType = "expense";
    category = "Otros";

    // Resetear errores también
    nameError = null;
    amountError = null;
    dateError = null;
    categoryError = null;
  };

  // Opcional: Resetear errores si el usuario cambia de tipo de transacción
  $: {
    // Esto se ejecuta cuando transactionType cambia
    // Podrías decidir resetear solo ciertos errores o todos
    // nameError = null;
    // amountError = null;
    // dateError = null;
    // categoryError = null; // Si cambias de gasto a ingreso, el error de categoría ya no aplica
  }
</script>

<div
  class="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-md max-w-md w-full"
>
  <h2 class="text-lg font-bold mb-4 text-gray-800 dark:text-white">
    Nueva Transacción
  </h2>

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
      for="add-date"
      class="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-200"
      >Fecha</label
    >
    <input
      id="add-date"
      bind:value={date}
      type="date"
      class="w-full p-2 rounded border {dateError
        ? 'border-red-500'
        : 'border-gray-300 dark:border-gray-600'} dark:bg-gray-700 dark:text-white"
    />
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
        class="w-full p-2 rounded border {categoryError
          ? 'border-red-500'
          : 'border-gray-300 dark:border-gray-600'} dark:bg-gray-700 dark:text-white"
      >
        <option value="Alimentación">Alimentación</option>
        <option value="Transporte">Transporte</option>
        <option value="Entretenimiento">Entretenimiento</option>
        <option value="Salud">Salud</option>
        <option value="Educación">Educación</option>
        <option value="Otros">Otros</option>
      </select>
      {#if categoryError}
        <p class="text-red-500 text-xs mt-1">{categoryError}</p>
      {/if}
    </div>
  {/if}
  <button
    on:click={handleSubmit}
    class="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-semibold transition mt-4"
  >
    Agregar Transacción
  </button>
</div>
