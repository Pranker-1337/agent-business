# Agent Business - AI Financial Advisor

AI-powered personal finance management platform built with Next.js 15, React 19, Tailwind CSS 4, and Gemini API.

## Setup

```bash
npm install
```

## Environment Variables

Create `.env.local` in the root:

```env
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here
GOOGLE_GEMINI_API_KEY=your_gemini_api_key_here
```

Get your Gemini API key at: https://aistudio.google.com/apikey

## Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Deploy to Vercel

1. Push to GitHub
2. Import project at [vercel.com/new](https://vercel.com/new)
3. Add environment variable `GOOGLE_GEMINI_API_KEY`
4. Deploy

## Features

- AI Chat powered by Gemini 2.0 Flash
- Income/expense tracking with auto-categorization
- Financial projects and goals
- Progress analytics
- Financial health indicator