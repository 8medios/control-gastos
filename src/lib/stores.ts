// src/lib/stores.ts
import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import type { Expense } from './types';

const initial: Expense[] = browser
	? JSON.parse(localStorage.getItem('expenses') || '[]')
	: [];

export const expenses = writable<Expense[]>(initial);

if (browser) {
	expenses.subscribe((val) => {
		localStorage.setItem('expenses', JSON.stringify(val));
	});
}
