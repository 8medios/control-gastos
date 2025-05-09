import { writable } from 'svelte/store';
import { browser } from '$app/environment';

const defaultBudget = 100000; // valor por defecto

const initial = browser
	? parseFloat(localStorage.getItem('budget') || String(defaultBudget))
	: defaultBudget;

export const budget = writable<number>(initial);

if (browser) {
	budget.subscribe((val) => {
		localStorage.setItem('budget', val.toString());
	});
}
