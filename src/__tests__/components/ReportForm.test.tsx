import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useQuery, useMutation } from 'convex/react';
import { useParams } from 'react-router-dom';
import { ReportForm } from '../../ReportForm';

// Get mocked functions
const mockedUseQuery = vi.mocked(useQuery);
const mockedUseMutation = vi.mocked(useMutation);
const mockedUseParams = vi.mocked(useParams);

// Helper to create a properly typed mutation mock with required Convex properties
const createMutationMock = (mockFn: any = vi.fn()) => {
    return Object.assign(mockFn, {
        withOptimisticUpdate: vi.fn().mockReturnThis(),
    });
};

describe('ReportForm', () => {
    const mockSubmitReport = createMutationMock();

    beforeEach(() => {
        vi.clearAllMocks();
        mockedUseMutation.mockReturnValue(mockSubmitReport);
    });

    describe('when linkId is missing', () => {
        it('displays invalid link error', () => {
            mockedUseParams.mockReturnValue({});

            render(<ReportForm />);

            expect(screen.getByText('Invalid Link')).toBeInTheDocument();
            expect(screen.getByText('This reporting link is not valid.')).toBeInTheDocument();
        });
    });

    describe('when magic link is loading', () => {
        it('displays loading spinner', () => {
            mockedUseParams.mockReturnValue({ linkId: 'test-link-id' });
            mockedUseQuery.mockReturnValue(undefined);

            render(<ReportForm />);

            // Check for loading spinner (animate-spin class)
            const spinner = document.querySelector('.animate-spin');
            expect(spinner).toBeInTheDocument();
        });
    });

    describe('when magic link is not found', () => {
        it('displays link not found error', () => {
            mockedUseParams.mockReturnValue({ linkId: 'invalid-link-id' });
            mockedUseQuery.mockReturnValue(null);

            render(<ReportForm />);

            expect(screen.getByText('Link Not Found')).toBeInTheDocument();
            expect(screen.getByText('This reporting link is not active or does not exist.')).toBeInTheDocument();
        });
    });

    describe('when magic link is valid', () => {
        const mockMagicLink = {
            _id: 'magic-link-id' as any,
            linkId: 'test-link-id',
            companyId: 'company-id' as any,
            isActive: true,
            createdBy: 'user-id' as any,
        };

        beforeEach(() => {
            mockedUseParams.mockReturnValue({ linkId: 'test-link-id' });
            mockedUseQuery.mockReturnValue(mockMagicLink);
        });

        it('renders the report form', () => {
            render(<ReportForm />);

            expect(screen.getByText('Submit a Report')).toBeInTheDocument();
            expect(screen.getByLabelText('Title *')).toBeInTheDocument();
            expect(screen.getByLabelText('Description *')).toBeInTheDocument();
            expect(screen.getByRole('button', { name: 'Submit Report' })).toBeInTheDocument();
        });

        it('submit button is disabled when form is empty', () => {
            render(<ReportForm />);

            const submitButton = screen.getByRole('button', { name: 'Submit Report' });
            expect(submitButton).toBeDisabled();
        });

        it('enables submit button when form is filled', async () => {
            const user = userEvent.setup();
            render(<ReportForm />);

            await user.type(screen.getByLabelText('Title *'), 'Test Title');
            await user.type(screen.getByLabelText('Description *'), 'Test Description');

            const submitButton = screen.getByRole('button', { name: 'Submit Report' });
            expect(submitButton).not.toBeDisabled();
        });

        it('submits the form with correct data', async () => {
            const user = userEvent.setup();
            mockSubmitReport.mockResolvedValue('report-id');

            render(<ReportForm />);

            await user.type(screen.getByLabelText('Title *'), 'My Report Title');
            await user.type(screen.getByLabelText('Description *'), 'My report description');

            const submitButton = screen.getByRole('button', { name: 'Submit Report' });
            await user.click(submitButton);

            await waitFor(() => {
                expect(mockSubmitReport).toHaveBeenCalledWith({
                    magicLinkId: 'magic-link-id',
                    title: 'My Report Title',
                    description: 'My report description',
                    category: 'issue',
                    isAnonymous: true,
                    reporterName: undefined,
                    reporterEmail: undefined,
                });
            });
        });

        it('shows success message after submission', async () => {
            const user = userEvent.setup();
            mockSubmitReport.mockResolvedValue('report-id');

            render(<ReportForm />);

            await user.type(screen.getByLabelText('Title *'), 'My Report Title');
            await user.type(screen.getByLabelText('Description *'), 'My report description');
            await user.click(screen.getByRole('button', { name: 'Submit Report' }));

            await waitFor(() => {
                expect(screen.getByText('Report Submitted')).toBeInTheDocument();
                expect(screen.getByText(/Thank you for your feedback/)).toBeInTheDocument();
            });
        });

        it('shows loading state during submission', async () => {
            const user = userEvent.setup();
            // Make the mutation hang
            mockSubmitReport.mockImplementation(() => new Promise(() => { }));

            render(<ReportForm />);

            await user.type(screen.getByLabelText('Title *'), 'My Report Title');
            await user.type(screen.getByLabelText('Description *'), 'My report description');
            await user.click(screen.getByRole('button', { name: 'Submit Report' }));

            expect(screen.getByRole('button', { name: 'Submitting...' })).toBeInTheDocument();
        });
    });
});
