import React, { useEffect, useRef } from 'react';

const SynapseAnimation: React.FC<{ className?: string }> = ({ className = '' }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const rafRef = useRef<number | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        /* ------------------------------ sizing -------------------------- */
        const resize = () => {
            const dpr = window.devicePixelRatio || 1;
            canvas.width = window.innerWidth * dpr;
            canvas.height = window.innerHeight * dpr;
            canvas.style.width = window.innerWidth + 'px';
            canvas.style.height = window.innerHeight + 'px';
            ctx?.setTransform(1, 0, 0, 1, 0, 0);
            ctx?.scale(dpr, dpr);
        };
        resize();
        window.addEventListener('resize', resize);

        /* ------------------------------ nodes --------------------------- */
        const isLargeScreen = window.innerWidth >= 768;
        const NODE_COUNT = isLargeScreen ? 520 : 240; // << DOUBLE NODES
        const LINK_LIMIT = isLargeScreen ? 210 : 170; // << SLIGHTLY INCREASED LINKS
        const nodes = Array.from({ length: NODE_COUNT }, () => ({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 0.4,
            vy: (Math.random() - 0.5) * 0.4,
            alpha: 1,
        }));

        /* ------------------------------ colours ------------------------- */
        const primary = [0x8b, 0x5c, 0xf6]; // #8B5CF6
        const accent = [0xa7, 0x8b, 0xfa]; // #A78BFA
        let t = 0;

        const lerpChannel = (a: number, b: number, m: number) => Math.round(a + (b - a) * m);
        const rgba = (mix: number, alpha = 1) =>
            `rgba(${lerpChannel(primary[0], accent[0], mix)},` +
            `${lerpChannel(primary[1], accent[1], mix)},` +
            `${lerpChannel(primary[2], accent[2], mix)},${alpha})`;

        /* ------------------------------ mouse --------------------------- */
        const mouse = { x: -9999, y: -9999 };
        const onMove = (e: PointerEvent) => {
            mouse.x = e.clientX;
            mouse.y = e.clientY;
        };
        window.addEventListener('pointermove', onMove);

        /* ------------------------------ loop ---------------------------- */
        const loop = () => {
            if (!canvas || !ctx) return;
            rafRef.current = requestAnimationFrame(loop);

            t += 0.003;
            const mix = Math.sin(t) * 0.5 + 0.5;

            ctx.fillStyle = 'rgba(15,15,15,0.55)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            nodes.forEach((n, idx) => {
                const oscX = Math.sin(t * 0.15 + idx) * 0.045;
                const oscY = Math.cos(t * 0.12 + idx) * 0.045;

                n.x += oscX + n.vx;
                n.y += oscY + n.vy;

                const wrapped = n.x < 0 || n.x > canvas.width || n.y < 0 || n.y > canvas.height;
                if (n.x < 0) n.x = canvas.width;
                if (n.x > canvas.width) n.x = 0;
                if (n.y < 0) n.y = canvas.height;
                if (n.y > canvas.height) n.y = 0;
                if (wrapped) {
                    n.alpha = 0;
                }
                n.alpha = Math.min(1, (n.alpha ?? 1) + 0.01);

                const dx = n.x - mouse.x;
                const dy = n.y - mouse.y;
                const md = Math.hypot(dx, dy);
                if (md < 80) {
                    const force = ((120 - md) / 120) * 0.04;
                    n.vx += (dx / md) * force;
                    n.vy += (dy / md) * force;
                }
                n.vx *= 0.98;
                n.vy *= 0.98;

                ctx.fillStyle = rgba(mix, 0.9 * (n.alpha ?? 1));
                ctx.beginPath();
                ctx.arc(n.x, n.y, 2, 0, Math.PI * 2);
                ctx.fill();
            });

            ctx.lineWidth = 1;
            ctx.strokeStyle = rgba(mix, 0.35);
            for (let i = 0; i < nodes.length; i++) {
                for (let j = i + 1; j < nodes.length; j++) {
                    const dx = nodes[i].x - nodes[j].x;
                    const dy = nodes[i].y - nodes[j].y;
                    const d = dx * dx + dy * dy;
                    if (d < LINK_LIMIT * LINK_LIMIT) {
                        ctx.globalAlpha =
                            ((1 - Math.sqrt(d) / LINK_LIMIT) *
                                ((nodes[i].alpha ?? 1) + (nodes[j].alpha ?? 1))) /
                            2;
                        ctx.beginPath();
                        ctx.moveTo(nodes[i].x, nodes[i].y);
                        ctx.lineTo(nodes[j].x, nodes[j].y);
                        ctx.stroke();
                    }
                }
            }
            ctx.globalAlpha = 1;
        };
        loop();

        return () => {
            if (rafRef.current !== null) {
                cancelAnimationFrame(rafRef.current);
            }
            window.removeEventListener('resize', resize);
            window.removeEventListener('pointermove', onMove);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className={`absolute inset-0 w-full h-full object-cover -z-10 pointer-events-none ${className}`}
            aria-hidden
        />
    );
};

export default SynapseAnimation;
