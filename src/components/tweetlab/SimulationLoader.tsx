"use client";

import { useEffect, useRef, useState } from "react";

interface Node {
    x: number;
    y: number;
    vx: number;
    vy: number;
    radius: number;
    color: string;
    pulsePhase: number;
    pulseSpeed: number;
}

const COLORS = [
    "#f97316", // orange
    "#14b8a6", // teal
    "#06b6d4", // cyan
    "#ec4899", // pink
    "#10b981", // emerald
    "#3b82f6", // blue
];

const STATUS_MESSAGES = [
    "Analyzing hook...",
    "Predicting reach...",
    "Simulating engagement...",
    "Generating insights...",
];

export function SimulationLoader() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number>(0);
    const nodesRef = useRef<Node[]>([]);
    const [statusIndex, setStatusIndex] = useState(0);

    // Cycle through status messages
    useEffect(() => {
        const interval = setInterval(() => {
            setStatusIndex((prev) => (prev + 1) % STATUS_MESSAGES.length);
        }, 1400);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Set canvas size
        const resizeCanvas = () => {
            const rect = canvas.getBoundingClientRect();
            const dpr = window.devicePixelRatio || 1;
            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
            ctx.scale(dpr, dpr);
        };
        resizeCanvas();

        const width = canvas.getBoundingClientRect().width;
        const height = canvas.getBoundingClientRect().height;

        // Initialize nodes - fewer for cleaner look
        const nodeCount = 40;
        if (nodesRef.current.length === 0) {
            for (let i = 0; i < nodeCount; i++) {
                nodesRef.current.push({
                    x: Math.random() * width,
                    y: Math.random() * height,
                    vx: (Math.random() - 0.5) * 0.4,
                    vy: (Math.random() - 0.5) * 0.4,
                    radius: Math.random() * 4 + 2,
                    color: COLORS[Math.floor(Math.random() * COLORS.length)],
                    pulsePhase: Math.random() * Math.PI * 2,
                    pulseSpeed: 0.015 + Math.random() * 0.02,
                });
            }
        }

        const nodes = nodesRef.current;
        let time = 0;

        const animate = () => {
            const currentWidth = canvas.getBoundingClientRect().width;
            const currentHeight = canvas.getBoundingClientRect().height;

            ctx.clearRect(0, 0, currentWidth, currentHeight);
            time += 0.016;

            const centerX = currentWidth / 2;
            const centerY = currentHeight / 2;

            // Draw connections - thinner and more subtle
            for (let i = 0; i < nodes.length; i++) {
                for (let j = i + 1; j < nodes.length; j++) {
                    const dx = nodes[i].x - nodes[j].x;
                    const dy = nodes[i].y - nodes[j].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < 90) {
                        const opacity = (1 - dist / 90) * 0.15;
                        ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
                        ctx.lineWidth = 0.5;
                        ctx.beginPath();
                        ctx.moveTo(nodes[i].x, nodes[i].y);
                        ctx.lineTo(nodes[j].x, nodes[j].y);
                        ctx.stroke();
                    }
                }
            }

            // Update and draw nodes with gentle rotation
            nodes.forEach((node, index) => {
                // Calculate distance from center for rotation
                const dx = node.x - centerX;
                const dy = node.y - centerY;
                const dist = Math.sqrt(dx * dx + dy * dy);

                // Gentle rotation around center
                const angle = Math.atan2(dy, dx);
                const rotationSpeed = 0.0015 * (1 - Math.min(dist / (currentWidth / 2), 1));
                const newAngle = angle + rotationSpeed;

                node.x = centerX + Math.cos(newAngle) * dist + node.vx;
                node.y = centerY + Math.sin(newAngle) * dist + node.vy;

                // Gentle floating
                node.x += Math.sin(time * 0.3 + index) * 0.15;
                node.y += Math.cos(time * 0.4 + index * 0.5) * 0.15;

                // Wrap around edges
                if (node.x < -10) node.x = currentWidth + 10;
                if (node.x > currentWidth + 10) node.x = -10;
                if (node.y < -10) node.y = currentHeight + 10;
                if (node.y > currentHeight + 10) node.y = -10;

                // Velocity damping
                node.vx *= 0.998;
                node.vy *= 0.998;

                // Keep minimum velocity
                if (Math.abs(node.vx) < 0.05) node.vx = (Math.random() - 0.5) * 0.2;
                if (Math.abs(node.vy) < 0.05) node.vy = (Math.random() - 0.5) * 0.2;

                // Pulsing effect
                node.pulsePhase += node.pulseSpeed;
                const pulse = 1 + Math.sin(node.pulsePhase) * 0.2;
                const currentRadius = node.radius * pulse;

                // Draw soft glow
                const glowGradient = ctx.createRadialGradient(
                    node.x, node.y, 0,
                    node.x, node.y, currentRadius * 2.5
                );
                glowGradient.addColorStop(0, node.color + "40");
                glowGradient.addColorStop(1, "transparent");

                ctx.beginPath();
                ctx.arc(node.x, node.y, currentRadius * 2.5, 0, Math.PI * 2);
                ctx.fillStyle = glowGradient;
                ctx.fill();

                // Draw node core
                ctx.beginPath();
                ctx.arc(node.x, node.y, currentRadius, 0, Math.PI * 2);
                ctx.fillStyle = node.color;
                ctx.fill();
            });

            animationRef.current = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, []);

    return (
        <div className="relative w-full overflow-hidden bg-black" style={{ minHeight: '200px' }}>
            {/* Canvas for network animation */}
            <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full"
            />

            {/* Overlay content - centered */}
            <div className="relative z-10 flex flex-col items-center justify-center h-full py-12 gap-3">
                {/* Title */}
                <h3 className="text-base font-semibold text-white/90 tracking-wide">
                    Running Simulation
                </h3>

                {/* Status message */}
                <div className="h-5 flex items-center">
                    <span
                        key={statusIndex}
                        className="text-sm text-white/50 animate-fade-in"
                    >
                        {STATUS_MESSAGES[statusIndex]}
                    </span>
                </div>

                {/* Minimal progress dots */}
                <div className="flex gap-1.5 mt-1">
                    {[0, 1, 2].map((i) => (
                        <span
                            key={i}
                            className="w-1.5 h-1.5 rounded-full bg-white/40 animate-pulse"
                            style={{ animationDelay: `${i * 200}ms` }}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
