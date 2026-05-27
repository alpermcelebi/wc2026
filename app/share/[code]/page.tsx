import { Metadata } from 'next';
import SharedDashboardClient from './SharedDashboardClient';

interface PageProps {
  params: Promise<{ code: string }> | { code: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const code = resolvedParams.code;
  
  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    
  const ogUrl = `${baseUrl}/api/og?predictions=${code}`;

  return {
    title: 'FIFA World Cup 2026 Prediction Bracket',
    description: 'Check out my predictions for the FIFA World Cup 2026 tournament!',
    openGraph: {
      title: 'FIFA World Cup 2026 Prediction Bracket',
      description: 'Check out my predictions for the FIFA World Cup 2026 tournament!',
      images: [
        {
          url: ogUrl,
          width: 1200,
          height: 630,
          alt: 'World Cup 2026 Prediction Bracket',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'FIFA World Cup 2026 Prediction Bracket',
      description: 'Check out my predictions for the FIFA World Cup 2026 tournament!',
      images: [ogUrl],
    },
  };
}

export default async function SharePage({ params }: PageProps) {
  const resolvedParams = await params;
  return <SharedDashboardClient code={resolvedParams.code} />;
}
