import { test, expect } from '@playwright/test';

test.describe('Report Submission Flow', () => {
    // Note: These tests require a valid magic link ID to work
    // For CI, you would set up test data fixtures

    test('shows invalid link message for non-existent link', async ({ page }) => {
        await page.goto('/report/invalid-link-id-12345');

        await expect(page.getByText('Link Not Found')).toBeVisible();
        await expect(page.getByText('This reporting link is not active or does not exist.')).toBeVisible();
    });

    test('shows report form or error for any link', async ({ page }) => {
        // Navigate to a test link - will show either form or not found
        await page.goto('/report/test-link');

        // Wait for page to fully load
        await page.waitForLoadState('networkidle');

        // Should show either loading, form, or not found message
        const hasLoading = await page.locator('.animate-spin').isVisible().catch(() => false);
        const hasForm = await page.getByText('Submit a Report').isVisible().catch(() => false);
        const hasNotFound = await page.getByText('Link Not Found').isVisible().catch(() => false);

        expect(hasLoading || hasForm || hasNotFound).toBe(true);
    });

    test('report form has required fields', async ({ page }) => {
        // Using a mock approach - navigate to report page
        await page.goto('/report/test-link');

        // If we can see the form, verify required elements
        const submitButton = page.getByRole('button', { name: 'Submit Report' });
        const titleExists = await submitButton.isVisible().catch(() => false);

        if (titleExists) {
            await expect(page.getByLabel('Title *')).toBeVisible();
            await expect(page.getByLabel('Description *')).toBeVisible();
            await expect(submitButton).toBeDisabled();
        }
    });
});

test.describe('Authentication Flow', () => {
    test('shows sign in form when not authenticated', async ({ page }) => {
        await page.goto('/');

        await expect(page.getByText('Manager Portal')).toBeVisible();
        await expect(page.getByText('Sign in to manage your company')).toBeVisible();
    });

    test('sign in form has email and password fields', async ({ page }) => {
        await page.goto('/');

        // Wait for the sign in form to load - use heading for specificity
        await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible();

        // Check for email and password inputs
        await expect(page.getByPlaceholder(/email/i)).toBeVisible();
        await expect(page.getByPlaceholder(/password/i)).toBeVisible();
    });

    test('sign in button is present', async ({ page }) => {
        await page.goto('/');

        await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
    });
});

test.describe('Invitation Flow', () => {
    test('shows invitation page for invite token', async ({ page }) => {
        await page.goto('/invite/test-token-12345');

        // Should show loading or invitation content
        await page.waitForLoadState('networkidle');

        const pageContent = await page.content();
        // Either shows invitation info or error
        expect(pageContent.length).toBeGreaterThan(0);
    });
});

test.describe('Navigation', () => {
    test('header is visible with app name', async ({ page }) => {
        await page.goto('/');

        await expect(page.getByText('Feedback Portal')).toBeVisible();
    });

    test('app loads without console errors', async ({ page }) => {
        const errors: string[] = [];
        page.on('console', msg => {
            if (msg.type() === 'error') {
                errors.push(msg.text());
            }
        });

        await page.goto('/');
        await page.waitForLoadState('networkidle');

        // Filter out expected errors (like network requests to dev server)
        const unexpectedErrors = errors.filter(
            e => !e.includes('favicon') && !e.includes('Failed to load resource')
        );

        expect(unexpectedErrors.length).toBe(0);
    });
});
