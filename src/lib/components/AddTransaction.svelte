<script lang="ts">
      import { createEventDispatcher } from 'svelte';
      import { v4 as uuid } from 'uuid';
      // Importamos el tipo Transaction
      import type { Transaction } from '$lib/types';
    
      // El evento 'add' ahora despachará un objeto Transaction
      const dispatch = createEventDispatcher<{ add: Transaction }>();
    
      let name = '';
      let amount: number | '' = '';
      let date = new Date().toISOString().slice(0, 10);
    
      // Nueva variable de estado para el tipo de transacción (gasto o ingreso)
      let transactionType: 'expense' | 'income' = 'expense'; // Por defecto, es un gasto
  
      // La categoría sigue siendo relevante, principalmente para gastos
      let category: string = 'Otros';
    
      const handleSubmit = () => {
          // Validaciones: nombre no vacío, monto positivo
          if (!name.trim() || amount === '' || +amount <= 0) {
              console.warn("Por favor, completa la descripción y el monto correctamente.");
              // TODO: Mejorar feedback de validación (Día 8)
              return;
          }
    
          // Creamos el objeto de transacción
          const newTransaction: Transaction = {
              id: uuid(),
              name,
              amount: +amount, // Aseguramos que sea número
              date,
              // Incluimos el tipo y la categoría
              type: transactionType,
              category: transactionType === 'expense' ? category : undefined // La categoría es más relevante para gastos, opcional para ingresos
          };
  
          // Disparamos el evento 'add' con el nuevo objeto de transacción
          dispatch('add', newTransaction);
    
          // Resetear los campos del formulario
          name = '';
          amount = '';
          date = new Date().toISOString().slice(0, 10);
          // No resetear el tipo y categoría si el usuario suele añadir el mismo tipo/categoría seguido?
          // O resetear a valores por defecto
          transactionType = 'expense'; // Resetear a gasto por defecto
          category = 'Otros'; // Resetear categoría por defecto
      };
    </script>
    
    <div class="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-md max-w-md w-full">
      <h2 class="text-lg font-bold mb-4 text-gray-800 dark:text-white">Nueva Transacción</h2>
  
      <div class="mb-4">
          <div class="flex gap-4">
              <label class="inline-flex items-center">
                  <input type="radio" bind:group={transactionType} value="expense" class="form-radio text-blue-600 dark:text-blue-400">
                  <span class="ml-2 text-gray-700 dark:text-gray-300">Gasto</span>
              </label>
              <label class="inline-flex items-center">
                  <input type="radio" bind:group={transactionType} value="income" class="form-radio text-green-600 dark:text-green-400">
                  <span class="ml-2 text-gray-700 dark:text-gray-300">Ingreso</span>
              </label>
          </div>
      </div>
  
      <input
        bind:value={name}
        type="text"
        placeholder="Descripción"       class="w-full p-2 mb-2 rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
      />
      <input
        bind:value={amount}
        type="number"
        placeholder="Monto"
        min="0"
         step="0.01"       class="w-full p-2 mb-2 rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
      />
      <input
        bind:value={date}
        type="date"
        class="w-full p-2 mb-2 rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
      />
  
      {#if transactionType === 'expense'}
      <select
        bind:value={category}
        class="w-full p-2 mb-4 rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
      >
           <option value="Alimentación">Alimentación</option>
        <option value="Transporte">Transporte</option>
        <option value="Entretenimiento">Entretenimiento</option>
        <option value="Salud">Salud</option>
        <option value="Educación">Educación</option>
        <option value="Otros">Otros</option>
      </select>
      {/if}
  
      <button
        on:click={handleSubmit}
        class="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-semibold transition"
      >
        Agregar Transacción
      </button>
    </div>