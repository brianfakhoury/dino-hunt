'use client';

import dynamic from 'next/dynamic';

// Dynamically import the Game component to avoid SSR issues
const Game = dynamic(() => import('@/components/game'), { ssr: false });

export default function Home() {
  return (
    <main className="flex min-h-[100dvh] w-screen max-w-[100vw] flex-col items-center justify-start sm:justify-center bg-gray-900 bg-[url('/wallpaper.png')] bg-cover bg-center bg-fixed px-2 py-4 sm:py-8 overflow-x-hidden">
      <h1 className="text-2xl sm:text-4xl font-bold text-white mb-4 sm:mb-8 break-words">DinoHunt</h1>
      <div className="flex justify-center w-full">
        <Game />
      </div>
      <p className="text-white text-sm sm:text-base pt-2 sm:pt-4 px-4 text-center">Made by Cedar Hulick and Brian Fakhoury</p>
    </main>
  );
}
