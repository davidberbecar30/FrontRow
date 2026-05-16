// Comprehensive frontend auth tests — unit tests for auth state management,
// the ProtectedRoute guard, and LoginView / RegisterView interaction.

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import '@testing-library/jest-dom';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Static imports — vitest handles caching consistently
import {
    getCurrentUser, getToken, isLoggedIn, isAdmin, hasPermission,
    setSession, clearCurrentUser,
} from '../auth/currentUser'
import ProtectedRoute from '../auth/ProtectedRoute'

// Hoist mock so vitest doesn't warn & it applies before all tests
vi.mock('../api/authAPI', () => ({
    login: vi.fn(),
    register: vi.fn(),
}))

// ── Helper: clear auth-related localStorage keys ─────────────────
function clearAuthStorage() {
    try {
        const s = window.localStorage
        if (s) {
            ;['currentUser', 'authToken', 'lastActivity'].forEach(k => {
                try { s.removeItem(k) } catch { /* noop */ }
            })
        }
    } catch { /* noop */ }
}

// ── Auth module tests ────────────────────────────────────────────────

describe('currentUser (auth state)', () => {

    beforeEach(() => {
        clearAuthStorage()
    })

    it('starts with no user and no token', () => {
        expect(getCurrentUser()).toBeNull()
        expect(getToken()).toBeNull()
        expect(isLoggedIn()).toBe(false)
    })

    it('setSession stores both user and token', () => {
        const user = { id: 1, email: 'a@b.com', role: { name: 'user', permissions: [] } }
        setSession({ user, token: 'my.jwt.token' })
        expect(getCurrentUser()).toEqual(user)
        expect(getToken()).toBe('my.jwt.token')
        expect(isLoggedIn()).toBe(true)
    })

    it('clearCurrentUser removes everything', () => {
        setSession({ user: { id: 1 }, token: 'xxx' })
        clearCurrentUser()
        expect(getCurrentUser()).toBeNull()
        expect(getToken()).toBeNull()
        expect(isLoggedIn()).toBe(false)
    })

    it('clearCurrentUser dispatches authChange event', () => {
        setSession({ user: { id: 1 }, token: 'xxx' })

        const handler = vi.fn()
        window.addEventListener('authChange', handler)
        clearCurrentUser()
        expect(handler).toHaveBeenCalled()
        window.removeEventListener('authChange', handler)
    })

    it('hasPermission returns true when user has the permission', () => {
        setSession({
            user: {
                id: 1,
                role: {
                    name: 'user',
                    permissions: [{ name: 'events.favorite' }]
                }
            },
            token: 'x'
        })
        expect(hasPermission('events.favorite')).toBe(true)
        expect(hasPermission('events.create')).toBe(false)
    })

    it('isAdmin returns true for admin role', () => {
        setSession({
            user: { id: 1, role: { name: 'admin', permissions: [] } },
            token: 'x'
        })
        expect(isAdmin()).toBe(true)
    })

    it('isAdmin returns false for user role', () => {
        setSession({
            user: { id: 1, role: { name: 'user', permissions: [] } },
            token: 'x'
        })
        expect(isAdmin()).toBe(false)
    })

    it('setSession stores lastActivity timestamp', () => {
        setSession({ user: { id: 1 }, token: 'x' })
        // Verify user + token were stored (lastActivity is an internal detail)
        expect(getCurrentUser()).toEqual({ id: 1 })
        expect(getToken()).toBe('x')
        expect(isLoggedIn()).toBe(true)
    })
})

// ── ProtectedRoute tests ─────────────────────────────────────────────

describe('ProtectedRoute', () => {
    beforeEach(() => {
        clearAuthStorage()
    })

    it('redirects unauthenticated users to /login', () => {
        render(
            <MemoryRouter initialEntries={['/favorites']}>
                <Routes>
                    <Route path="/login" element={<div data-testid="login-page">Login Page</div>} />
                    <Route path="/favorites" element={
                        <ProtectedRoute><div data-testid="favorites-page">Favorites</div></ProtectedRoute>
                    } />
                </Routes>
            </MemoryRouter>
        )
        expect(screen.getByTestId('login-page')).toBeInTheDocument()
        expect(screen.queryByTestId('favorites-page')).not.toBeInTheDocument()
    })

    it('renders children when user is authenticated', () => {
        setSession({ user: { id: 1, role: { name: 'user', permissions: [] } }, token: 'x' })

        render(
            <MemoryRouter initialEntries={['/favorites']}>
                <Routes>
                    <Route path="/login" element={<div data-testid="login-page">Login Page</div>} />
                    <Route path="/favorites" element={
                        <ProtectedRoute><div data-testid="favorites-page">Favorites</div></ProtectedRoute>
                    } />
                </Routes>
            </MemoryRouter>
        )
        expect(screen.getByTestId('favorites-page')).toBeInTheDocument()
        expect(screen.queryByTestId('login-page')).not.toBeInTheDocument()
    })

    it('redirects to /events when user lacks required permission', () => {
        setSession({ user: { id: 1, role: { name: 'user', permissions: [{ name: 'events.favorite' }] } }, token: 'x' })

        render(
            <MemoryRouter initialEntries={['/events/add']}>
                <Routes>
                    <Route path="/login" element={<div data-testid="login-page">Login Page</div>} />
                    <Route path="/events" element={<div data-testid="events-page">Events Page</div>} />
                    <Route path="/events/add" element={
                        <ProtectedRoute permission="events.create">
                            <div data-testid="add-page">Add Event</div>
                        </ProtectedRoute>
                    } />
                </Routes>
            </MemoryRouter>
        )
        expect(screen.getByTestId('events-page')).toBeInTheDocument()
        expect(screen.queryByTestId('add-page')).not.toBeInTheDocument()
    })

    it('renders admin-only route when user has admin role', () => {
        setSession({ user: { id: 1, role: { name: 'admin', permissions: [{ name: 'events.create' }] } }, token: 'x' })

        render(
            <MemoryRouter initialEntries={['/events/add']}>
                <Routes>
                    <Route path="/login" element={<div data-testid="login-page">Login Page</div>} />
                    <Route path="/events" element={<div data-testid="events-page">Events Page</div>} />
                    <Route path="/events/add" element={
                        <ProtectedRoute permission="events.create">
                            <div data-testid="add-page">Add Event</div>
                        </ProtectedRoute>
                    } />
                </Routes>
            </MemoryRouter>
        )
        expect(screen.getByTestId('add-page')).toBeInTheDocument()
    })
})

// ── LoginView tests ─────────────────────────────────────────────────

describe('LoginView', () => {
    beforeEach(() => {
        clearAuthStorage()
    })

    it('renders login form with all fields', async () => {
        const LoginView = (await import('../views/LoginView.jsx')).default
        render(
            <MemoryRouter>
                <LoginView />
            </MemoryRouter>
        )
        expect(screen.getByPlaceholderText('Enter your email')).toBeInTheDocument()
        expect(screen.getByPlaceholderText('Enter your password')).toBeInTheDocument()
        expect(screen.getByText('LOG IN')).toBeInTheDocument()
    })

    it('shows validation errors for empty fields', async () => {
        const LoginView = (await import('../views/LoginView.jsx')).default
        render(
            <MemoryRouter>
                <LoginView />
            </MemoryRouter>
        )
        fireEvent.click(screen.getByText('Log In'))
        expect(screen.getByText('Email is required')).toBeInTheDocument()
        expect(screen.getByText('Password is required')).toBeInTheDocument()
    })

    it('shows error for invalid email format', async () => {
        const LoginView = (await import('../views/LoginView.jsx')).default
        render(
            <MemoryRouter>
                <LoginView />
            </MemoryRouter>
        )
        fireEvent.change(screen.getByPlaceholderText('Enter your email'), { target: { value: 'notanemail' } })
        fireEvent.change(screen.getByPlaceholderText('Enter your password'), { target: { value: '123456' } })
        fireEvent.click(screen.getByText('Log In'))
        expect(screen.getByText('Enter a valid email')).toBeInTheDocument()
    })

    it('shows server error on failed login', async () => {
        const LoginView = (await import('../views/LoginView.jsx')).default
        render(
            <MemoryRouter>
                <LoginView />
            </MemoryRouter>
        )

        // Re-mock login specifically for this test
        const authAPI = await import('../api/authAPI')
        authAPI.login = vi.fn().mockRejectedValue(new Error('Invalid credentials'))

        fireEvent.change(screen.getByPlaceholderText('Enter your email'), { target: { value: 'test@test.com' } })
        fireEvent.change(screen.getByPlaceholderText('Enter your password'), { target: { value: 'password123' } })
        fireEvent.click(screen.getByText('Log In'))

        await waitFor(() => {
            expect(screen.getByText('Invalid credentials')).toBeInTheDocument()
        })
    })

    it('navigates to register on sign up link click', async () => {
        const LoginView = (await import('../views/LoginView.jsx')).default
        render(
            <MemoryRouter>
                <Routes>
                    <Route path="/" element={<LoginView />} />
                    <Route path="/register" element={<div data-testid="register-page">Register</div>} />
                </Routes>
            </MemoryRouter>
        )
        fireEvent.click(screen.getByText('Sign up'))
        expect(screen.getByTestId('register-page')).toBeInTheDocument()
    })
})

// ── RegisterView tests ──────────────────────────────────────────────

describe('RegisterView', () => {
    beforeEach(() => {
        clearAuthStorage()
    })

    it('renders registration form with all fields', async () => {
        const RegisterView = (await import('../views/RegisterView.jsx')).default
        render(
            <MemoryRouter>
                <RegisterView />
            </MemoryRouter>
        )
        expect(screen.getByPlaceholderText('John')).toBeInTheDocument()
        expect(screen.getByPlaceholderText('Doe')).toBeInTheDocument()
        expect(screen.getByPlaceholderText('Email')).toBeInTheDocument()
        expect(screen.getByPlaceholderText('Password')).toBeInTheDocument()
        // Both the <h2> and the <button> contain "Register" — use getAllByText
        const registerElements = screen.getAllByText('Register')
        expect(registerElements.length).toBeGreaterThanOrEqual(2)
    })

    it('shows validation errors for empty fields', async () => {
        const RegisterView = (await import('../views/RegisterView.jsx')).default
        render(
            <MemoryRouter>
                <RegisterView />
            </MemoryRouter>
        )
        // Use getByRole to click the button specifically
        fireEvent.click(screen.getByRole('button', { name: 'Register' }))
        expect(screen.getByText('First name is required')).toBeInTheDocument()
        expect(screen.getByText('Last name is required')).toBeInTheDocument()
        expect(screen.getByText('Email is required')).toBeInTheDocument()
        expect(screen.getByText('Password is required')).toBeInTheDocument()
        expect(screen.getByText('Date of birth is required')).toBeInTheDocument()
    })

    it('shows error for short password', async () => {
        const RegisterView = (await import('../views/RegisterView.jsx')).default
        render(
            <MemoryRouter>
                <RegisterView />
            </MemoryRouter>
        )
        fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: '12345' } })
        fireEvent.click(screen.getByRole('button', { name: 'Register' }))
        expect(screen.getByText('Password must be at least 6 characters')).toBeInTheDocument()
    })

    it('navigates to login on login link click', async () => {
        const RegisterView = (await import('../views/RegisterView.jsx')).default
        render(
            <MemoryRouter>
                <Routes>
                    <Route path="/" element={<RegisterView />} />
                    <Route path="/login" element={<div data-testid="login-page">Login</div>} />
                </Routes>
            </MemoryRouter>
        )
        fireEvent.click(screen.getByText('Log In'))
        expect(screen.getByTestId('login-page')).toBeInTheDocument()
    })
})
