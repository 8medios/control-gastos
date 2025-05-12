<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import { onMount } from 'svelte';

    // Props del modal
    export let message: string; // Mensaje principal de confirmación
    export let title: string = 'Confirmar Acción'; // Título del modal
    export let confirmButtonText: string = 'Confirmar'; // Texto del botón de confirmar
    export let cancelButtonText: string = 'Cancelar'; // Texto del botón de cancelar
    export let confirmButtonClass: string = 'bg-red-600 hover:bg-red-700 text-white'; // Clase de Tailwind para el botón de confirmar (por defecto rojo para eliminar)
    export let cancelButtonClass: string = 'bg-gray-300 hover:bg-gray-400 text-gray-800'; // Clase para el botón de cancelar

    // Eventos que despacha el modal
    const dispatch = createEventDispatcher<{ confirm: void, cancel: void }>();

    // Handlers de los botones
    const handleConfirmClick = () => {
        dispatch('confirm');
    };

    const handleCancelClick = () => {
        dispatch('cancel');
    };

    // Cerrar con tecla Escape
    function handleKeydown(event: KeyboardEvent) {
        if (event.key === 'Escape') {
            handleCancelClick();
        }
    }

    // Añadir/eliminar listener de teclado al montar/desmontar
    onMount(() => {
        window.addEventListener('keydown', handleKeydown);
        return () => {
            window.removeEventListener('keydown', handleKeydown);
        };
    });
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-75 flex items-center justify-center p-4 z-50"
     on:click|self={handleCancelClick}>

    <section class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-sm w-full space-y-4">
        <h2 class="text-xl font-bold text-gray-800 dark:text-white">{title}</h2>

        <p class="text-gray-700 dark:text-gray-300">{message}</p>

        <div class="flex justify-end gap-3 mt-4">
            <button
                on:click={handleCancelClick}
                class="{cancelButtonClass} px-4 py-2 rounded font-semibold transition dark:text-gray-200 dark:hover:bg-gray-700"
            >
                {cancelButtonText}
            </button>
            <button
                on:click={handleConfirmClick}
                class="{confirmButtonClass} px-4 py-2 rounded font-semibold transition"
            >
                {confirmButtonText}
            </button>
        </div>
    </section>
</div>
