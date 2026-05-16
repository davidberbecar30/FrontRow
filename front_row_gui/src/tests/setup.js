// Vitest setup: provide a proper localStorage mock since jsdom's built-in
// localStorage is broken when --localstorage-file is missing/invalid.

const store = {}

Object.defineProperty(window, 'localStorage', {
    writable: true,
    value: {
        getItem: (key) => store[key] ?? null,
        setItem: (key, value) => { store[key] = String(value) },
        removeItem: (key) => { delete store[key] },
        clear: () => { Object.keys(store).forEach(k => delete store[k]) },
        get length() { return Object.keys(store).length },
        key: (index) => Object.keys(store)[index] ?? null,
    },
})
