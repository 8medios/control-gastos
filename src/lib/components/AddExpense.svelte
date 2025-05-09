<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import { v4 as uuid } from 'uuid';
  
    const dispatch = createEventDispatcher();
  
    let name = '';
    let amount: number | '' = '';
    let date = new Date().toISOString().slice(0, 10); // Hoy por defecto
  
    const handleSubmit = () => {
      if (!name.trim() || amount === '' || +amount <= 0) return;
  
      dispatch('add', {
        id: uuid(),
        name,
        amount: +amount,
        date,
      });
  
      name = '';
      amount = '';
      date = new Date().toISOString().slice(0, 10);
    };
  </script>
  
  <div class="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-md max-w-md w-full">
    <h2 class="text-lg font-bold mb-4 text-gray-800 dark:text-white">Nuevo Gasto</h2>
    <input
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
    <button
      on:click={handleSubmit}
      class="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-semibold transition"
    >
      Agregar
    </button>
  </div>
  