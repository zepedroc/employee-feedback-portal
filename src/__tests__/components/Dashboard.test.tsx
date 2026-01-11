import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useQuery, useMutation } from 'convex/react';
import { Dashboard } from '../../Dashboard';
import { Id } from '../../../convex/_generated/dataModel';

// Get mocked functions
const mockedUseQuery = vi.mocked(useQuery);
const mockedUseMutation = vi.mocked(useMutation);

// Helper to create a properly typed mutation mock with required Convex properties
const createMutationMock = (mockFn: any = vi.fn()) => {
    return Object.assign(mockFn, {
        withOptimisticUpdate: vi.fn().mockReturnThis(),
    });
};

// Mock the Reports component to avoid deep dependency issues
vi.mock('../../Reports', () => ({
    Reports: () => <div data-testid="mocked-reports">Reports Component</div>,
}));


describe('Dashboard', () => {
    const mockCompany = {
        _id: 'company-id' as Id<'companies'>,
        name: 'Test Company',
        role: 'owner',
    };

    const mockMagicLink = {
        _id: 'magic-link-id' as Id<'magicLinks'>,
        linkId: 'test-link-abc123',
        companyId: 'company-id' as Id<'companies'>,
        isActive: true,
        createdBy: 'user-id' as Id<'users'>,
    };

    const mockInviteManager = createMutationMock();

    // Track call count to return different values for different useQuery calls
    let useQueryCallCount = 0;

    beforeEach(() => {
        vi.clearAllMocks();
        useQueryCallCount = 0;

        // Return values based on call order:
        // First call: getManagerLink -> mockMagicLink
        // Second call: getCompanyInvitations -> []
        mockedUseQuery.mockImplementation(() => {
            useQueryCallCount++;
            if (useQueryCallCount === 1) {
                return mockMagicLink;
            }
            return []; // pendingInvitations
        });

        mockedUseMutation.mockReturnValue(createMutationMock());
    });

    it('renders the company name in title', () => {
        render(<Dashboard company={mockCompany} />);

        expect(screen.getByText('Test Company')).toBeInTheDocument();
    });

    it('renders the reporting link section', () => {
        render(<Dashboard company={mockCompany} />);

        expect(screen.getByText('Your Reporting Link')).toBeInTheDocument();
    });

    it('displays the magic link URL', () => {
        render(<Dashboard company={mockCompany} />);

        const input = screen.getByDisplayValue(/test-link-abc123/);
        expect(input).toBeInTheDocument();
    });

    it('copies link to clipboard when copy button is clicked', async () => {
        const user = userEvent.setup();
        render(<Dashboard company={mockCompany} />);

        const copyButton = screen.getByRole('button', { name: /copy/i });
        await user.click(copyButton);

        // Verify the button shows "Copied" which indicates successful clipboard write
        await waitFor(() => {
            expect(screen.getByRole('button', { name: /copied/i })).toBeInTheDocument();
        });
    });

    it('shows copied confirmation after clicking copy', async () => {
        const user = userEvent.setup();
        render(<Dashboard company={mockCompany} />);

        const copyButton = screen.getByRole('button', { name: /copy/i });
        await user.click(copyButton);

        await waitFor(() => {
            expect(screen.getByRole('button', { name: /copied/i })).toBeInTheDocument();
        });
    });

    describe('Invite Manager section', () => {
        it('renders the invite manager form', () => {
            render(<Dashboard company={mockCompany} />);

            expect(screen.getByText('Invite Manager')).toBeInTheDocument();
            expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
        });

        it('send invite button is disabled when email is empty', () => {
            render(<Dashboard company={mockCompany} />);

            const sendButton = screen.getByRole('button', { name: /send invitation/i });
            expect(sendButton).toBeDisabled();
        });

        it('enables send button when email is entered', async () => {
            const user = userEvent.setup();
            render(<Dashboard company={mockCompany} />);

            await user.type(screen.getByLabelText('Email Address'), 'test@example.com');

            const sendButton = screen.getByRole('button', { name: /send invitation/i });
            expect(sendButton).not.toBeDisabled();
        });

        it('calls inviteManager mutation when form is submitted', async () => {
            const user = userEvent.setup();
            mockInviteManager.mockResolvedValue('invitation-id');
            mockedUseMutation.mockReturnValue(mockInviteManager);

            render(<Dashboard company={mockCompany} />);

            await user.type(screen.getByLabelText('Email Address'), 'manager@example.com');
            await user.click(screen.getByRole('button', { name: /send invitation/i }));

            await waitFor(() => {
                expect(mockInviteManager).toHaveBeenCalledWith({
                    companyId: 'company-id',
                    email: 'manager@example.com',
                });
            });
        });
    });

    describe('Pending Invitations', () => {
        it('displays pending invitations when they exist', () => {
            useQueryCallCount = 0;
            mockedUseQuery.mockImplementation(() => {
                useQueryCallCount++;
                if (useQueryCallCount === 1) {
                    return mockMagicLink;
                }
                return [
                    {
                        _id: 'inv-1',
                        email: 'pending@example.com',
                        expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
                    },
                ];
            });

            render(<Dashboard company={mockCompany} />);

            expect(screen.getByText('Pending Invitations')).toBeInTheDocument();
            expect(screen.getByText('pending@example.com')).toBeInTheDocument();
        });

        it('does not show pending invitations section when empty', () => {
            render(<Dashboard company={mockCompany} />);

            expect(screen.queryByText('Pending Invitations')).not.toBeInTheDocument();
        });
    });

    it('renders the Reports section', () => {
        render(<Dashboard company={mockCompany} />);

        expect(screen.getByText('Reports')).toBeInTheDocument();
        expect(screen.getByTestId('mocked-reports')).toBeInTheDocument();
    });
});
