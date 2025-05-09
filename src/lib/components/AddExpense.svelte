<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { v4 as uuid } from "uuid";
  // Importamos el tipo Expense para tipar correctamente el evento
  import type { Expense } from "$lib/types"; // Tipamos el createEventDispatcher para asegurar que el evento 'add' emite un objeto Expense
  const dispatch = createEventDispatcher<{ add: Expense }>();
  let name = "";
  let amount: number | "" = "";
  let date = new Date().toISOString().slice(0, 10); // Hoy por defecto
  // Agregamos una nueva variable de estado para la categoría seleccionada
  let category: string = "Otros"; // Puedes inicializarla con un valor por defecto
  const handleSubmit = () => {
    // Validaciones básicas (mejoraremos esto en el Día 8)
    if (!name.trim() || amount === "" || +amount <= 0) {
      console.warn("Por favor, completa el nombre y el monto correctamente.");
      return; // Detiene la ejecución si la validación falla
    }
    // Disparamos el evento 'add' incluyendo la categoría seleccionada
    dispatch("add", {
      id: uuid(),
      name,
      amount: +amount,
      date,
      category: category, // Incluimos la categoría aquí
    }); // Resetear los campos del formulario
    name = "";
    amount = "";
    date = new Date().toISOString().slice(0, 10); // Resetear a la fecha actual
    category = "Otros"; // Resetear la categoría a su valor por defecto o primero
  };
</script>

<div
  class="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-md max-w-md w-full"
>
  <h2 class="text-lg font-bold mb-4 text-gray-800 dark:text-white">
    Nuevo Gasto
  </h2><input
    bind:value={name}
    type="text"
    placeholder="Nombre"
    class="w-full p-2 mb-2 rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
  />
  <input
    bind:value={amount}
    type="number"
    placeholder="Monto"
    min="0"
    class="w-full p-2 mb-2 rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
  />
  <input
    bind:value={date}
    type="date"
    class="w-full p-2 mb-2 rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
  />
  <select
    bind:value={category}
    class="w-full p-2 mb-4 rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
  >
    <!--       {/* Las opciones deben coincidir con las categorías en el filtro de +page.svelte */} -->
    <option value="Alimentación">Alimentación</option>
    <option value="Transporte">Transporte</option>
    <option value="Entretenimiento">Entretenimiento</option>
    <option value="Salud">Salud</option>
    <option value="Educación">Educación</option>
    <option value="Otros">Otros</option>
  </select>
  <button
    on:click={handleSubmit}
    class="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-semibold transition"
  >
    Agregar
  </button>
</div>
