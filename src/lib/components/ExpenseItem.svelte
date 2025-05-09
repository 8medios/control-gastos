<script lang="ts">
  import type { Expense } from "$lib/types"; // Este componente recibe un objeto expense como prop

  export let expense: Expense; // Función para determinar el icono basada en la categoría
  // La movemos aquí ya que es específica de la visualización del item

  function icono(cat?: string): string {
    const mapa: Record<string, string> = {
      Alimentación: "🍔", // Usamos las mismas categorías que en el filtro
      Transporte: "🚌",
      Entretenimiento: "🎮",
      Salud: "🏥", // Añadimos algunos iconos específicos
      Educación: "📚",
      Otros: "🧾",
    }; // Devuelve el icono si existe, de lo contrario usa el de 'Otros'
    // También maneja si expense.category es undefined, tratándolo como 'Otros'
    const categoriaNormalizada = cat && mapa[cat] ? cat : "Otros";
    return mapa[categoriaNormalizada];
  }
</script>

<li
  class="bg-gray-100 dark:bg-gray-700 p-3 rounded-xl flex justify-between text-sm"
>
  <span>{icono(expense.category)} {expense.name}</span>
  <span>${expense.amount.toFixed(2)} – {expense.date}</span>
</li>
