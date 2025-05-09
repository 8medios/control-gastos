<script lang="ts">
    import AddExpense from '$lib/components/AddExpense.svelte';
    import type { Expense } from '$lib/types';
  
    let expenses: Expense[] = [];
  
    const handleAddExpense = (e: CustomEvent<Expense>) => {
      expenses = [e.detail, ...expenses];
    };
  </script>
  
  <main class="p-4 flex flex-col items-center gap-6">
    <AddExpense on:add={handleAddExpense} />
  
    <ul class="w-full max-w-md space-y-2">
      {#each expenses as expense}
        <li class="bg-gray-100 dark:bg-gray-700 p-3 rounded-xl flex justify-between text-sm">
          <span>{expense.name}</span>
          <span>${expense.amount.toFixed(2)} – {expense.date}</span>
        </li>
      {/each}
    </ul>
  </main>
  