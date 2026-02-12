"use client";
import { Button } from "@/components/ui/button";
import Link from 'next/link';

import { Navbar } from "@/components/navbar";


export default function Home() {
  return (
    <div className="min-h-screen bg-white selection:bg-slate-900 selection:text-white">
      <Navbar />

      <main className="flex flex-col items-center justify-center p-4 pt-20 pb-20">
        <div className="w-full max-w-4xl space-y-8 flex flex-col items-center">

          {/* Hero Section */}
          <div className="text-center space-y-4 max-w-3xl">
            <h1 className="text-5xl md:text-7xl font-bold font-outfit text-slate-900 tracking-tight leading-[1.1]">
              Ship fast. <br />
              <span className="text-slate-400">Preview instantly.</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed">
              One-click deployment platform that enables automatic deployments from GitHub repositories.
            </p>
          </div>

          {/* Action Section */}
          <div className="w-full max-w-xl mt-12 flex justify-center">
            <Link href="/login">
              <Button className="h-12 px-8 text-base font-semibold bg-slate-900 text-white hover:bg-slate-800 shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transition-all duration-300 rounded-lg">
                Start Deploying
              </Button>
            </Link>
          </div>

        </div>
      </main>
    </div>
  );
}

