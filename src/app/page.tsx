'use client';

import dynamic from 'next/dynamic';

// Dynamically import the Game component to avoid SSR issues
const Game = dynamic(() => import('@/components/game'), { ssr: false });

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-900 bg-[url('/wallpaper.png')] bg-cover bg-center">
      <h1 className="text-4xl font-bold text-white mb-8">DinoHunt</h1>
      <Game />
      <p className="text-white pt-4">Made by Cedar Hulick and Brian Fakhoury</p>
    </main>
  );
}
