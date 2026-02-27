# Do Santos Market - E-commerce Platform

A complete e-commerce platform with admin panel for managing products, categories, customers, payments, deliveries, banners, and more.

## Features

- Responsive design for mobile and desktop
- Complete admin panel with modals
- Product management with categories and subcategories
- Customer registration and management
- Payment methods configuration
- Delivery options management
- Banner management
- Clickable links management
- WhatsApp integration
- Email functionality
- Image gallery editor
- YouTube and video integration

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## Admin Access

Access the admin panel at `/admin` (no authentication required in development)

## Maintenance Mode

To enable maintenance mode on Vercel:

1. Go to your Vercel project settings
2. Navigate to "Environment Variables"
3. Add a new variable:
   - **Name**: `MAINTENANCE_MODE`
   - **Value**: `true`
4. Redeploy your application

To disable maintenance mode, either:
- Remove the `MAINTENANCE_MODE` environment variable, or
- Set its value to `false`

When enabled, all visitors will see a maintenance page instead of the regular site. Static files and API routes remain accessible.