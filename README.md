# Kollektiv Spinnen

Festival web application with an interactive timetable, multilingual content, administration and contribution-based ticketing. Built with React, TypeScript and Supabase.

**[View the application](https://kollektiv-spinnen-festival.vercel.app/)**

The project brings together public event information and operational workflows for a small independent festival.

## Features
  - **Interactive Timetable**: View events in chronological list or grid format
- **Advanced Filtering**: Filter by day, venue, event type, and search query
- **Multi-language Support**: English and German language support
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Authentication & Admin**: Admin-only area for managing events, FAQs, about-page content, and ticket settings
- **Soli-Beitrag Ticketing**:
  - Role-based tickets (bar, kitchen, awareness, tech, auf-/abbau, etc.)
  - Early-bird and normal pricing with configurable limits and cut-off dates
  - Real-time inventory tracking per role and per ticket type
  - PayPal-based payment flow with generated reference codes and QR support
- **Accessibility & UX**:
  - Clear validation errors and consent checkboxes for data storage
  - Helpful status messages and toasts for all critical flows
- **Modern UI**: Built with shadcn/ui components, Radix primitives, Tailwind CSS, and lucide icons
- **Real-time Backend**: Powered by Supabase for PostgreSQL, Row Level Security, and real-time data synchronization

## Security, Reliability & Performance
  - **No Hardcoded Secrets**: Supabase URL and anon key are now **only** read from environment variables
- **Centralized Validation**:
  - Name and email validation/sanitization for ticket checkout
  - Generic string and URL validation helpers
  - XSS-resistant string handling where user input is stored
- **Centralized Error Handling**:
  - Shared error formatter for user-friendly messages
  - Safe logging that avoids leaking internal details in production
- **Improved Admin Auth Flow**: Fixed race conditions in the admin check for more reliable access control
- **RLS & Database Hardening**:
  - All core tables (events, faqs, ticket_settings, ticket_purchases, about_page_*) verified and accessible
  - Migration scripts included to fix and audit Supabase RLS policies
- **Performance Improvements**:
  - In-memory caching for frequently-read data (e.g. ticket settings)
  - Debounced admin search to avoid unnecessary renders and queries
  - Parallel loading of admin data to speed up initial load
  - React error boundary to catch rendering errors and keep the app usable

## Tech Stack
  - **Frontend**: React 18 with TypeScript
- **Build Tool**: Vite
- **Routing**: React Router DOM
- **UI Components**: shadcn/ui on top of Radix UI primitives, lucide-react icons
- **Styling**: Tailwind CSS, tailwind-merge, tailwindcss-animate
- **Backend**: Supabase (PostgreSQL + RLS + REST + real-time)
- **State / Data**: React hooks, contexts (`AuthContext`, `LanguageContext`), custom hooks (`useDebounce`, etc.)
- **Mobile**: Capacitor (iOS & Android support)

## Getting Started

### Prerequisites

- Node.js 18+ and npm (or use [nvm](https://github.com/nvm-sh/nvm#installing-and-updating) to install)
- A Supabase project (or use the existing configuration)

### Installation

1. **Clone the repository**
   ```sh
   git clone https://github.com/AaronPG095/kollektiv-spinnen-website.git
   cd kollektiv-spinnen-website
   ```

2. **Install dependencies**
   ```sh
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   # Optional – used by the Soli-Beitrag / ticket checkout flow
   VITE_PAYPAL_PAYMENT_LINK=https://paypal.me/kollektivspinnen
   VITE_PAYPAL_QR_CODE_URL=/paypal-qr-code.png
   VITE_APP_URL=http://localhost:5173
   ```

4. **Start the development server**
   ```sh
   npm run dev
   ```

   The application will be available at `http://localhost:5173`

## Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build for production
- `npm run build:dev` - Build in development mode
- `npm run preview` - Preview the production build locally
- `npm run lint` - Run ESLint

## Project Structure

```
src/
├── components/          # React components
│   ├── ui/             # shadcn/ui components
│   └── ...             # Feature components
├── contexts/           # React contexts (Auth, Language)
├── data/               # Static data files
├── hooks/              # Custom React hooks
├── integrations/       # External service integrations
│   └── supabase/       # Supabase client and types
├── lib/                # Utility functions
├── pages/              # Page components
└── main.tsx            # Application entry point
```

## Deployment

### Quick Deploy Options

For the fastest deployment, see the [QUICK_START.md](./QUICK_START.md) guide which covers:
- Vercel deployment (5 minutes)
- Netlify deployment (5 minutes)

### Detailed Migration Guide

For comprehensive deployment instructions and migration from other platforms, see [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md).

### Environment Variables for Production

Make sure to set these environment variables in your hosting platform:

- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous/public key
- `VITE_PAYPAL_PAYMENT_LINK` (optional) - PayPal payment link used in ticket checkout
- `VITE_PAYPAL_QR_CODE_URL` (optional) - QR code image URL used in ticket checkout
- `VITE_APP_URL` (optional) - Your production URL (for Capacitor mobile apps)

## Mobile App Support

This project includes Capacitor configuration for building native iOS and Android apps. After deploying your web app:

1. Update `capacitor.config.ts` with your production URL
2. Run `npx cap sync` to sync the configuration
3. Build for iOS: `npx cap open ios`
4. Build for Android: `npx cap open android`

## Additional Documentation

- `BRANCH_PROTECTION_SETUP.md` – guide for setting up GitHub branch protection rules
- `VERCEL_BRANCH_CONFIG.md` – guide for configuring Vercel branch deployments
- `ENV_SETUP.md` – detailed environment variable and local setup notes
- `SUPABASE_AUDIT.md` / `DATABASE_AUDIT_REPORT.md` – Supabase and database/RLS auditing notes
- `LOGIN_TROUBLESHOOTING.md` – tips for debugging authentication and admin access
- `REFACTORING_SUMMARY.md` – overview of recent security, performance, and reliability improvements

## Git Workflow

This project uses a two-branch strategy for stability:

### Branch Structure

- **`main`** - Production branch (protected, only merges from develop)
- **`develop`** - Development branch (default for all new work)

### Workflow

1. **Daily Development**
   - Work directly on the `develop` branch
   - Commit and push frequently to `develop`
   - Vercel will create preview deployments for `develop` branch

2. **Production Releases**
   - When ready to deploy to production:
     - Create a pull request from `develop` → `main`
     - Review and approve the PR
     - Merge the PR to `main`
   - Vercel will automatically deploy `main` to production

3. **Urgent Fixes**
   - Fix issues on `develop` branch
   - Test thoroughly
   - Merge `develop` → `main` via PR immediately

### Setting Up Branch Protection

To protect the `main` branch, follow the guide in [BRANCH_PROTECTION_SETUP.md](./BRANCH_PROTECTION_SETUP.md).

### Configuring Vercel

To configure Vercel for the two-branch workflow, see [VERCEL_BRANCH_CONFIG.md](./VERCEL_BRANCH_CONFIG.md).

### Quick Commands

```bash
# Switch to develop branch for daily work
git checkout develop

# Create a new feature (optional, can work directly on develop)
git checkout -b feature/my-feature develop

# Merge develop to main (after PR approval)
git checkout main
git merge develop
git push origin main
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

No open-source license is declared in this repository. Public visibility does not grant permission to reuse, modify or redistribute its code.

## Support

For issues, questions, or contributions, please open an issue in the repository.
