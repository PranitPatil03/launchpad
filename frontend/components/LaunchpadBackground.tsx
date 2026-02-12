"use client";

import { useEffect, useRef } from "react";

export function LaunchpadBackground() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const dpr = window.devicePixelRatio || 1;

        function resize() {
            if (!canvas || !ctx) return;
            canvas.width = canvas.offsetWidth * dpr;
            canvas.height = canvas.offsetHeight * dpr;
            ctx.scale(dpr, dpr);
            draw();
        }

        function draw() {
            if (!canvas || !ctx) return;
            const w = canvas.offsetWidth;
            const h = canvas.offsetHeight;

            ctx.clearRect(0, 0, w, h);
            ctx.fillStyle = "#000000"; // Pure black background
            ctx.fillRect(0, 0, w, h);

            const numBars = 40; // Increased number of bars for better density
            const barWidth = w / numBars;
            const dotSize = 2.2;
            const spacing = 6;

            for (let i = 0; i < numBars; i++) {
                // Randomize bar height slightly differently to make it look organic
                const barHeight = h * (0.4 + Math.random() * 0.4);
                const startY = (h - barHeight) / 2;
                const cx = i * barWidth + barWidth / 2;

                for (let y = startY; y < startY + barHeight; y += spacing) {
                    for (let x = cx - barWidth * 0.4; x < cx + barWidth * 0.4; x += spacing) {
                        const progress = (y - startY) / barHeight;

                        let r, g, b;
                        // Adjusted colors to match "Launchpad" dark theme better (more greys/whites/subtle purples maybe?)
                        // Or stick to user's colors? User said "use this background". I will keep user's color logic essentially but ensuring variables are defined.

                        if (progress < 0.3) {
                            // Deep Blue-Violet
                            const t = progress / 0.3;
                            r = Math.floor(20 + t * 40);
                            g = Math.floor(10 + t * 20);
                            b = Math.floor(120 + t * 50);
                        } else if (progress < 0.6) {
                            // Bright Cyan/Blue
                            const t = (progress - 0.3) / 0.3;
                            r = Math.floor(60 + t * 40);
                            g = Math.floor(100 + t * 50);
                            b = Math.floor(200 + t * 55);
                        } else {
                            // White/Cyan
                            const t = (progress - 0.6) / 0.4;
                            r = Math.floor(100 + t * 155);
                            g = Math.floor(150 + t * 105);
                            b = Math.floor(255);
                        }

                        let alpha = 1;
                        if (progress < 0.15) alpha = progress / 0.15;
                        else if (progress > 0.85) alpha = (1 - progress) / 0.15;

                        alpha *= 0.3 + Math.random() * 0.7;

                        const colBrightness = 0.5 + (Math.sin(i * 1.7) * 0.3 + 0.3);
                        alpha *= colBrightness;

                        if (Math.random() > 0.35) {
                            // Fix the scope of r,g,b being used here. They are defined in the if/else above.
                            // We need to make sure they are numbers.
                            ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha * 0.8})`;
                            ctx.fillRect(x, y, dotSize, dotSize);
                        }
                    }
                }
            }
        }

        resize();
        window.addEventListener("resize", resize);
        return () => window.removeEventListener("resize", resize);
    }, []);

    return (
        <div className="absolute inset-0 z-0 h-full w-full pointer-events-none">
            <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full"
            />
            <div className="absolute top-0 left-0 right-0 h-[25%] bg-gradient-to-b from-[#000000] via-[#000000]/90 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 h-[15%] bg-gradient-to-t from-[#000000] via-[#000000]/90 to-transparent" />
            <div className="absolute inset-0" style={{
                background: "radial-gradient(ellipse 60% 50% at 50% 45%, rgba(0,0,0,0.6) 0%, transparent 70%)"
            }} />
        </div>
    );
}
