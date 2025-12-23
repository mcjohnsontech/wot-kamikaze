# WOT Kamikaze - Delivery Management System

A real-time delivery order management system with WhatsApp integration. Track orders, manage delivery statuses, and communicate with customers instantly via WhatsApp.

## Features

- Real-time order status updates (no page refresh needed)
- WhatsApp messaging integration for customer notifications
- Order pipeline with 5 status columns (NEW, PROCESSING, READY, DISPATCHED, COMPLETED)
- Rider assignment and tracking
- Customer satisfaction (CSAT) surveys
- Real-time analytics dashboard
- Responsive design for mobile and desktop
- Professional UI with Tailwind CSS

## Tech Stack

- Frontend: React 19 + TypeScript + Vite
- Backend: Express.js + Node.js
- Database: Supabase (PostgreSQL)
- Real-time: Supabase Realtime (WebSocket)
- Messaging: Twilio WhatsApp API
- Styling: Tailwind CSS
- Icons: Lucide React

## Project Structure

```
wot-kamikaze/
├── src/
│   ├── App.tsx                 # Main app component
│   ├── main.tsx                # Entry point
│   ├── views/                  # Page components
│   │   ├── SmeDashboard.tsx    # Order management dashboard
│   │   ├── RiderPwa.tsx        # Rider tracking view
│   │   ├── CustomerTracking.tsx # Customer order tracking
│   │   ├── CsatSubmission.tsx  # Satisfaction surveys
│   │   ├── HelpPage.tsx        # Help documentation
│   │   └── AuthPage.tsx        # Authentication
│   ├── hooks/
│   │   └── useOrders.ts        # Real-time orders hook
│   ├── context/
│   │   └── AuthContext.tsx     # Authentication context
│   ├── lib/
│   │   ├── supabase.ts         # Supabase client
│   │   ├── whatsapp.ts         # WhatsApp utilities
│   │   └── utils.ts            # Helper functions
│   └── assets/                 # Static assets
├── server/
│   ├── index.ts                # Express server entry
│   ├── routes/
│   │   └── whatsapp.ts         # WhatsApp webhook routes
│   └── services/
│       └── whatsapp.ts         # WhatsApp message logic
├── migrations/
│   └── 01_create_whatsapp_logs.sql # Database schema
├── package.json                # Dependencies
├── tsconfig.json               # TypeScript config
├── vite.config.ts              # Vite config
└── tailwind.config.ts          # Tailwind config
```

## Prerequisites

- Node.js 18+ and npm
- Supabase account (free tier available)
- Twilio account with WhatsApp enabled
- Git

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd wot-kamikaze
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Then update `.env.local` with your credentials:
```
# Supabase
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Twilio (backend)
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_WHATSAPP_NUMBER=whatsapp:+1234567890
```

4. Set up the database:
   - Create a new project in Supabase
   - Run the migration: `migrations/01_create_whatsapp_logs.sql`
   - Create the `orders` table with these columns:
     - `id` (uuid, primary key)
     - `sme_id` (uuid)
     - `customer_name` (text)
     - `customer_phone` (text)
     - `pickup_address` (text)
     - `delivery_address` (text)
     - `amount` (numeric)
     - `status` (enum: NEW, PROCESSING, READY, DISPATCHED, COMPLETED, CANCELLED)
     - `rider_id` (uuid, nullable)
     - `rider_phone` (text, nullable)
     - `created_at` (timestamp)
     - `updated_at` (timestamp)

## Running Locally

### Development Mode

Start the frontend development server:
```bash
npm run dev
```

In another terminal, start the backend server:
```bash
npm run server:dev
```

The app will be available at `http://localhost:5173`

### Production Build

Build the frontend:
```bash
npm run build
```

Preview the production build:
```bash
npm run preview
```

## Usage

### For SMEs (Order Management)

1. Navigate to the SME Dashboard
2. Click "Create Order" to add a new delivery
3. Enter customer details and payment amount
4. Orders appear in the "NEW" column
5. Move orders through the pipeline by changing status:
   - NEW to PROCESSING (when order is being prepared)
   - PROCESSING to READY (when order is packed)
   - READY to DISPATCHED (when rider picks up)
   - DISPATCHED to COMPLETED (when delivered)

Each status change triggers automatic WhatsApp notifications to the customer.

### For Riders

1. Access the Rider PWA view
2. See assigned orders with delivery details
3. Mark deliveries as completed
4. View delivery routes on the map
5. Receive push notifications for new orders

### For Customers

1. Use the Customer Tracking view with order ID
2. See real-time order status
3. View rider location on map
4. Receive WhatsApp updates at each status change
5. Submit satisfaction survey upon delivery

## API Endpoints

### WhatsApp Webhook
- POST `/api/whatsapp/webhook` - Receive WhatsApp messages
- POST `/api/whatsapp/send` - Send WhatsApp message

### Order Management
- GET `/api/orders` - Get all orders for user
- POST `/api/orders` - Create new order
- PATCH `/api/orders/:id` - Update order status
- DELETE `/api/orders/:id` - Cancel order

## Real-Time Updates

The app uses Supabase Realtime for instant updates:
- Orders update immediately when status changes
- No page refresh needed
- Uses WebSocket connections
- Automatic reconnection handling

## WhatsApp Integration

Messages are sent automatically at these events:
- Order created: Customer receives confirmation
- Status changed: Customer gets update with new status
- Rider assigned: Customer gets rider contact and ETA
- Order completed: Customer receives CSAT survey link

Message templates are customizable in `server/services/whatsapp.ts`.

## Troubleshooting

### Orders not updating in real-time
- Check browser console for WebSocket connection errors
- Verify Supabase connection in `.env.local`
- Ensure user has permission to read orders table

### WhatsApp messages not sending
- Verify Twilio credentials in `.env`
- Check that phone numbers are in +234XXXXXXXXXX format
- Review server logs for detailed error messages
- Ensure Twilio WhatsApp template is approved

### Build errors
- Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Delete cache: `rm -rf dist .vite`
- Rebuild: `npm run build`

## Development

### Available Scripts

```bash
npm run dev          # Start frontend development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run server:dev   # Start backend development server
npm run server       # Start backend production mode
npm run lint         # Run ESLint
```

### Type Checking

The project uses TypeScript with strict mode. Type check without building:
```bash
tsc -b
```

### Code Style

ESLint is configured for code quality. Fix issues automatically:
```bash
npm run lint -- --fix
```

## Deployment

### Frontend (Vercel/Netlify)
- Build command: `npm run build`
- Output directory: `dist/`
- Environment variables: Add all `VITE_*` vars

### Backend (Railway/Render/Heroku)
- Build command: `npm install`
- Start command: `npm run server`
- Environment variables: Add all `TWILIO_*` and `SUPABASE_*` vars

## License

This project is proprietary.

## Support

For detailed documentation and guides, see the [docs/](docs/) directory.
