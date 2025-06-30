This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.

### Setup for Production Testing

1. Copy the example configuration file:
```bash
cp cypress.config.prod.example.ts cypress.config.prod.ts
```

2. Edit `cypress.config.prod.ts` and set your actual test user credentials:
```typescript
env: {
  TEST_EMAIL: 'your-actual-email@example.com',
  TEST_PASSWORD: 'your-actual-password'
}
```

3. Run production tests:
```bash
npm run cypress:prod
```

### API Testing Options

You can configure different testing modes in `cypress.env.prod.json`:

```json
{
  "MOCK_AUTH": "true",      // Use mock authentication (fast)
  "TEST_REAL_API": "false", // Test actual API calls
  "MOCK_API": "true"        // Mock API responses
}
```

**Testing Modes:**

- **Mock Authentication Only** (`MOCK_AUTH: "true", TEST_REAL_API: "false"`):
  - Fast tests using mock authentication
  - No actual API calls
  - Good for UI testing

- **Mock Auth + Real API** (`MOCK_AUTH: "true", TEST_REAL_API: "true"`):
  - Mock authentication for speed
  - Real API calls to test backend integration
  - Good for integration testing

- **Real Authentication** (`MOCK_AUTH: "false"`):
  - Full end-to-end testing
  - Requires valid user credentials
  - Slower but comprehensive

**Note:** `cypress.config.prod.ts` and `cypress.env.prod.json` are gitignored to protect sensitive information.

