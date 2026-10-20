import { test, expect } from '@playwright/test';

test.describe('Login', () => {
  test('logs in with mocked credentials and lands on Home as the user', async ({ page }) => {
    await page.route('**/api/v1/auth/login', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ token: 'fake-token', user: { id: 1, name: 'Test User', email: 'test@example.com' } }),
      })
    );

    await page.goto('/login');
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Password').fill('correct-password');
    await page.getByRole('button', { name: /log in|sign in/i }).click();

    await expect(page).toHaveURL('/');
    // "Log Out" (unlike the username, which is hidden below the md breakpoint)
    // is always rendered once logged in, so this holds on both projects.
    await expect(page.getByRole('button', { name: /log out/i })).toBeVisible();
  });

  test('shows the server error message on invalid credentials', async ({ page }) => {
    await page.route('**/api/v1/auth/login', (route) =>
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Invalid email or password' }),
      })
    );

    await page.goto('/login');
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Password').fill('wrong-password');
    await page.getByRole('button', { name: /log in|sign in/i }).click();

    await expect(page.getByText('Invalid email or password')).toBeVisible();
    await expect(page).toHaveURL('/login');
  });
});

test.describe('Sign up', () => {
  test('blocks submission when the passwords do not match', async ({ page }) => {
    let signupCalled = false;
    await page.route('**/api/v1/auth/signup', (route) => {
      signupCalled = true;
      return route.fulfill({ status: 201, body: '{}' });
    });

    await page.goto('/signup');
    await page.getByLabel('Name', { exact: true }).fill('Test User');
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Password', { exact: true }).fill('password123');
    await page.getByLabel('Confirm Password').fill('different123');
    await page.getByRole('button', { name: /sign up|create account/i }).click();

    await expect(page.getByText(/password.*match/i)).toBeVisible();
    expect(signupCalled).toBe(false);
  });
});

test.describe('Forgot password', () => {
  test('shows the confirmation screen after submitting, regardless of whether the email exists', async ({ page }) => {
    await page.route('**/api/v1/auth/forgot-password', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'If an account with that email exists, a password reset link has been sent.' }),
      })
    );

    await page.goto('/forgot-password');
    await page.getByLabel('Email').fill('whoever@example.com');
    await page.getByRole('button', { name: /send reset link/i }).click();

    await expect(page.getByText(/check your email for reset instructions/i)).toBeVisible();
  });
});
