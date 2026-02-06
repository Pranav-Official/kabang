# Kabang Dashboard

A modern dashboard for managing search bangs with TanStack React, Tailwind CSS, and shadcn/ui.

## Features

- **Authentication**: Simple login system (default: admin/admin)
- **Dashboard**: Manage all your search bangs in one place
- **CRUD Operations**: Create, read, update, and delete bangs
- **Set Default**: Mark a bang as the default search engine
- **Search & Filter**: Quickly find bangs by name, trigger, or category
- **Responsive Design**: Works on desktop, tablet, and mobile

## Getting Started

### Prerequisites

- Node.js 18+ or Bun
- The kabang-api server running on port 3000

### Installation

```bash
# Install dependencies
bun install

# Start development server
bun run dev
```

The UI will be available at `http://localhost:5123`

### Configuration

Create a `.env` file (or modify `.env.example`):

```env
VITE_API_URL=http://localhost:3000
```

## Usage

1. **Login**: Use the default credentials `admin` / `admin`
2. **Add Bangs**: Click "Add Bang" to create new search shortcuts
3. **Edit**: Click the Edit button on any bang card
4. **Delete**: Click the Delete button with confirmation
5. **Set Default**: Click the Default button to set a bang as the default search engine

### Bang Format

- **Name**: Display name (e.g., "Google")
- **Bang**: The trigger word (e.g., "g" for !g)
- **URL**: Search URL with `{query}` placeholder (e.g., `https://google.com/search?q={query}`)
- **Category**: Optional grouping (e.g., "Search", "Social", "Dev")

## Project Structure

```
src/
├── components/        # UI components
├── hooks/            # React hooks (auth, kabangs)
├── lib/              # Utilities and API client
├── routes/           # TanStack Router routes
│   ├── login.tsx     # Login page
│   ├── _authenticated.tsx  # Protected layout
│   └── _authenticated/
│       └── dashboard.tsx   # Main dashboard
└── styles.css        # Tailwind styles
```

## Scripts

- `bun run dev` - Start development server
- `bun run build` - Build for production
- `bun run preview` - Preview production build
- `bun run lint` - Run ESLint
- `bun run format` - Format with Prettier
