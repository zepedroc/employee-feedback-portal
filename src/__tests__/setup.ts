import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Cleanup after each test
afterEach(() => {
    cleanup();
});

// Mock Convex hooks globally
vi.mock('convex/react', () => ({
    useQuery: vi.fn(),
    useMutation: vi.fn(() => vi.fn()),
    useAction: vi.fn(() => vi.fn()),
    Authenticated: ({ children }: { children: React.ReactNode }) => children,
    Unauthenticated: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useParams: vi.fn(() => ({})),
        useNavigate: vi.fn(() => vi.fn()),
    };
});

// Mock sonner toast
vi.mock('sonner', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
        info: vi.fn(),
    },
    Toaster: () => null,
}));
