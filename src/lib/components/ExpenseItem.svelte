<script lang="ts">
  import { createEventDispatcher } from "svelte"; // Importamos createEventDispatcher
  import type { Expense } from "$lib/types";

  export let expense: Expense;

  // Tipamos el dispatcher para un evento 'delete' que emitirá un string (el id del gasto)
  const dispatch = createEventDispatcher<{ delete: string }>();

  function icono(cat?: string): string {
    const mapa: Record<string, string> = {
      Alimentación: "🍔",
      Transporte: "🚌",
      Entretenimiento: "🎮",
      Salud: "🏥",
      Educación: "📚",
      Otros: "🧾",
    };
    const categoriaNormalizada = cat && mapa[cat] ? cat : "Otros";
    return mapa[categoriaNormalizada];
  }

  // Función que se llama al hacer clic en el botón de eliminar
  const handleDeleteClick = () => {
    // Aquí podríamos añadir una confirmación más adelante (Día 9)
    dispatch("delete", expense.id); // Dispara el evento 'delete' pasando el id del gasto
  };
</script>

<li
  class="bg-gray-100 dark:bg-gray-700 p-3 rounded-xl flex justify-between items-center text-sm"
>
  <span class="flex items-center gap-2">
    {icono(expense.category)}
    {expense.name}
  </span>
  <span class="flex items-center gap-4">
    <span>${expense.amount.toFixed(2)} – {expense.date}</span>

    <button
      on:click={handleDeleteClick}
      class="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-600 transition"
      aria-label="Eliminar gasto {expense.name}"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="h-4 w-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        stroke-width="2"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m14 0H5m10 0V5a2 2 0 00-2-2H9a2 2 0 00-2 2v2m7 0v2m-4-2v2"
        />
      </svg>
    </button>
  </span>
</li>
