# StagePro - Scout Booking Platform

A modern platform for booking scouts and service professionals for events in Austin.

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

### Environment Variables

Create a `.env.local` file with:

```
VITE_STAGEPRO_APP_BASE_URL=http://localhost:8000
```

### Building for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Project Structure

- `src/api/stageproClient.js` - API client for communicating with the FastAPI backend
- `src/pages/` - Page components
- `src/components/` - Reusable UI components
- `src/lib/` - Utilities and context providers

## Backend

The frontend connects to a FastAPI backend running on port 8000. See the `be/` directory for backend setup.
