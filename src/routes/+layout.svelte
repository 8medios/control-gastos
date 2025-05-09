<script lang="ts">
	import '../app.css';
	//export let data;
	let { children } = $props();
</script>

<div class="min-h-screen bg-gray-100 text-gray-900 dark:bg-gray-900 dark:text-gray-100">
	<header class="bg-white dark:bg-gray-800 shadow-md p-4">
	  <div class="container mx-auto flex justify-between items-center">
		<h1 class="text-2xl font-bold text-indigo-600 dark:text-indigo-400">💸 Control de Gastos</h1>
	  <nav>
		<a href="/" class="text-gray-700 font-bold hover:text-indigo-600">Inicio</a>
		<a href="/configuracion" class="text-gray-700 font-bold hover:text-indigo-600">Configuración</a>
	  </nav>
	</div>
	</header>
	<main class="container mx-auto p-4">
	  <!-- <slot /> -->
	</main>
  </div>

{@render children()}


<!-- Export let data no sirve, se usa props ahora -->
 <!-- Conflicto con render children, ahora se usa <slot>, leer bien documentacion actual -->