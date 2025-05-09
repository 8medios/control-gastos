<script lang="ts">
      import { createEventDispatcher } from 'svelte';
      import type { Expense } from '$lib/types';
  
      export let expense: Expense;
  
      // El dispatcher ahora también puede emitir un evento 'edit' con el id del gasto
      const dispatch = createEventDispatcher<{ delete: string, edit: string }>();
  
      function icono(cat?: string): string {
          const mapa: Record<string, string> = {
            Alimentación: "🍔",
            Transporte: "🚌",
            Entretenimiento: "🎮",
            Salud: "🏥",
            Educación: "📚",
            Otros: "🧾",
          };
          const categoriaNormalizada = cat && mapa[cat] ? cat : 'Otros';
          return mapa[categoriaNormalizada];
      }
  
      const handleDeleteClick = () => {
          dispatch('delete', expense.id);
      };
  
      // Nueva función que se llama al hacer clic en el botón de editar
      const handleEditClick = () => {
          dispatch('edit', expense.id); // Dispara el evento 'edit' pasando el id del gasto
      };
  </script>
  
  <li class="bg-gray-100 dark:bg-gray-700 p-3 rounded-xl flex justify-between items-center text-sm">
      <span class="flex items-center gap-2">
          {icono(expense.category)}
          {expense.name}
      </span>
      <span class="flex items-center gap-4">
          <span>${expense.amount.toFixed(2)} – {expense.date}</span>
  
          <button
              on:click={handleEditClick}
              class="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-600 transition"
              aria-label="Editar gasto {expense.name}"
          >
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                  <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
              </svg>
          </button>
  
                  <button
              on:click={handleDeleteClick}
              class="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-600 transition"
              aria-label="Eliminar gasto {expense.name}"
          >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m14 0H5m10 0V5a2 2 0 00-2-2H9a2 2 0 00-2 2v2m7 0v2m-4-2v2" />
              </svg>
          </button>
      </span>
  </li>