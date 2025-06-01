'use client';
import React, { useEffect, useRef, useState } from 'react';
import '@fortawesome/fontawesome-free/css/all.min.css';
import './translayte.css'; // holds gradient-text, btn-primary, feature-card, etc.
import Link from 'next/link';

/*****************************************************************************************
 *  FULL Translaytelanding page – React + Tailwind + Vanta.NET                        *
 *  ------------------------------------------------------------------------------------ *
 *  • Pixel-for-pixel port of your entire HTML.                                           *
 *  • Uses Vanta.NET with colour-tween & denser mesh.                                     *
 *  • Cleans up Vanta + interval on unmount to avoid leaks.                               *
 *                                                                                        *
 *  How to use:                                                                          *
 *      npm i tailwindcss vanta three @fortawesome/fontawesome-free                      *
 *      <LandingPage />                                                                   *
 *****************************************************************************************/

const LandingPage = () => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const rafRef = useRef<number | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        /* ------------------------------ sizing -------------------------- */
        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resize();
        window.addEventListener('resize', resize);

        /* ------------------------------ nodes --------------------------- */
        // More synapses only on larger screens
        const isLargeScreen = window.innerWidth >= 768; // Tailwind md: breakpoint
        const NODE_COUNT = isLargeScreen ? 260 : 120; // More nodes on md+ screens
        const LINK_LIMIT = isLargeScreen ? 180 : 140; // More links on md+ screens
        const nodes = Array.from({ length: NODE_COUNT }, () => ({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 0.4,
            vy: (Math.random() - 0.5) * 0.4,
        }));

        /* ------------------------------ colours ------------------------- */
        const primary = [0x8b, 0x5c, 0xf6]; // #8B5CF6
        const accent = [0xa7, 0x8b, 0xfa]; // #A78BFA
        let t = 0; // time for colour-lerp

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

            // colour-pulse (0→1→0)
            t += 0.003;
            const mix = Math.sin(t) * 0.5 + 0.5;

            ctx.fillStyle = 'rgba(15,15,15,0.55)'; // translucent paint-over
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            /* move + draw nodes */
            ctx.fillStyle = rgba(mix, 0.9);
            nodes.forEach(n => {
                // basic drift
                n.x += n.vx;
                n.y += n.vy;

                // wrap around edges for continuous field
                if (n.x < 0) n.x = canvas.width;
                if (n.x > canvas.width) n.x = 0;
                if (n.y < 0) n.y = canvas.height;
                if (n.y > canvas.height) n.y = 0;

                // mouse interaction (mild repulsion / attraction)
                const dx = n.x - mouse.x;
                const dy = n.y - mouse.y;
                const md = Math.hypot(dx, dy);
                if (md < 120) {
                    const force = ((120 - md) / 120) * 0.05;
                    n.vx += (dx / md) * force;
                    n.vy += (dy / md) * force;
                }

                // slow velocity damping so they don’t fly away
                n.vx *= 0.98;
                n.vy *= 0.98;

                // node
                ctx.beginPath();
                ctx.arc(n.x, n.y, 2, 0, Math.PI * 2);
                ctx.fill();
            });

            /* links */
            ctx.lineWidth = 1;
            ctx.strokeStyle = rgba(mix, 0.35);
            for (let i = 0; i < nodes.length; i++) {
                for (let j = i + 1; j < nodes.length; j++) {
                    const dx = nodes[i].x - nodes[j].x;
                    const dy = nodes[i].y - nodes[j].y;
                    const d = dx * dx + dy * dy;
                    if (d < LINK_LIMIT * LINK_LIMIT) {
                        ctx.globalAlpha = 1 - Math.sqrt(d) / LINK_LIMIT;
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

        /* ------------------------------ cleanup ------------------------- */
        return () => {
            if (rafRef.current !== null) {
                cancelAnimationFrame(rafRef.current);
            }
            window.removeEventListener('resize', resize);
            window.removeEventListener('pointermove', onMove);
        };
    }, []);

    // Optional: close menu on route change or resize
    useEffect(() => {
        const close = () => setMobileMenuOpen(false);
        window.addEventListener('resize', close);
        return () => window.removeEventListener('resize', close);
    }, []);

    return (
        <>
            {/* Vanta target */}
            <canvas
                ref={canvasRef}
                className="fixed top-0 left-0 w-full h-full -z-10"
                style={{ backgroundColor: '#0f0f0f' }}
            />
            {/* ------------------------------ Header -------------------------- */}
            <header className="fixed w-full z-50 bg-primary/80 backdrop-blur-md border-b border-gray-800">
                <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                    <div className="text-xl font-bold gradient-text">Translayte</div>
                    <nav className="hidden md:flex space-x-8">
                        {['How It Works', 'Benefits', 'Features', 'Pricing'].map(item => (
                            <span
                                key={item}
                                className="text-gray-300 hover:text-white transition-colors cursor-pointer"
                            >
                                {item}
                            </span>
                        ))}
                    </nav>
                    <span
                        className="hidden md:inline-block px-6 py-2 rounded-full border border-[#a78bfa] text-white font-medium hover:bg-[#a78bfa]/10 transition-colors cursor-pointer"
                        role="button"
                        tabIndex={0}
                    >
                        Sign In
                    </span>
                    <button
                        className="md:hidden text-white"
                        onClick={() => setMobileMenuOpen(v => !v)}
                        aria-label="Open menu"
                    >
                        <i className="fa-solid fa-bars text-xl" />
                    </button>
                </div>
                {/* Mobile menu */}
                {mobileMenuOpen && (
                    <div className="md:hidden bg-[#18181b] border-t border-gray-800 px-4 py-6">
                        <nav className="flex flex-col space-y-4">
                            {['How It Works', 'Benefits', 'Features', 'Pricing'].map(item => (
                                <span
                                    key={item}
                                    className="text-gray-300 hover:text-white transition-colors cursor-pointer text-lg"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    {item}
                                </span>
                            ))}
                            <span
                                className="mt-4 px-6 py-2 rounded-full border border-[#a78bfa] text-white font-medium hover:bg-[#a78bfa]/10 transition-colors cursor-pointer text-center"
                                role="button"
                                tabIndex={0}
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                Sign In
                            </span>
                        </nav>
                    </div>
                )}
            </header>

            {/* ------------------------------ Hero ---------------------------- */}
            <section id="hero" className="container mx-auto px-4 pt-24 text-center">
                <div className="max-w-4xl mx-auto mt-24">
                    <h1 className="text-4xl md:text-6xl font-bold mb-6">
                        Translate JSON files. <span className="gradient-text">Instantly.</span>
                    </h1>
                    <p className="text-xl md:text-2xl text-gray-300 mb-10 leading-relaxed">
                        Drop your .json file. Get clean, context-aware translations in seconds.
                        <span className="block mt-2">
                            No APIs. No config. Just drag, drop, done.
                        </span>
                    </p>
                    {/* CTA */}
                    <div className="relative group inline-block">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-secondary to-accent rounded-full blur opacity-70 group-hover:opacity-100 transition duration-1000 group-hover:duration-200" />
                        <Link href="/translator">
                            <button className="relative btn-primary text-white font-medium px-8 py-4 rounded-full">
                                <i className="fa-solid fa-upload mr-2" /> Upload JSON to Translate
                            </button>
                        </Link>
                    </div>

                    {/* ---------------- Translation preview window ---------------- */}
                    {/* (verbatim HTML → JSX; keys shortened for brevity) */}
                    <div className="mt-10 bg-[#18181b]/95 backdrop-blur-xl rounded-xl border border-white/10 shadow-2xl w-full max-w-5xl mx-auto p-2 sm:p-6 overflow-x-auto">
                        {/* Window top bar */}
                        <div className="flex items-center space-x-2 mb-4">
                            <div className="w-3 h-3 rounded-full bg-red-500"></div>
                            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                            <span className="ml-4 text-sm text-gray-300">
                                translation-preview.json
                            </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Original block */}
                            <CodeBlock
                                title="Original (English)"
                                badge="EN"
                                badgeColor="blue"
                                content={{
                                    'WelcomeScreen.title': 'Welcome to Translayte',
                                    'WelcomeScreen.greeting': 'Hello there,',
                                    'Navigation.home': 'Home Dashboard',
                                    'Navigation.about': 'About Our Team',
                                    'Navigation.contact': 'Contact Support',
                                    'Buttons.submit': 'Submit Form',
                                    'Buttons.cancel': 'Cancel Action',
                                    'Forms.email': 'Email address field',
                                    'Forms.password': 'Secure password',
                                    'Notification.saved': 'Changes saved successfully',
                                }}
                                valueColor="text-green-400"
                            />

                            {/* Translated block (ES) */}
                            <CodeBlock
                                title="Translated (Spanish)"
                                badge="ES"
                                badgeColor="green"
                                content={{
                                    'WelcomeScreen.title': 'Bienvenido a Translayte',
                                    'WelcomeScreen.greeting': 'Hola, ¿qué tal?',
                                    'Navigation.home': 'Panel principal',
                                    'Navigation.about': 'Sobre nuestro equipo',
                                    'Navigation.contact': 'Soporte de contacto',
                                    'Buttons.submit': 'Enviar formulario',
                                    'Buttons.cancel': 'Cancelar acción',
                                    'Forms.email': 'Campo de correo',
                                    'Forms.password': 'Contraseña segura',
                                    'Notification.saved': 'Cambios guardados con éxito',
                                }}
                                valueColor="text-purple-300"
                            />
                        </div>
                        {/* language pills */}
                        <div className="mt-8 flex justify-center">
                            <div className="flex flex-wrap items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-black/50 backdrop-blur-md text-sm text-gray-300 font-medium">
                                <span>Also translating to:</span>
                                {[
                                    { code: 'fr', color: 'blue' },
                                    { code: 'de', color: 'yellow' },
                                    { code: 'it', color: 'red' },
                                    { code: 'pt', color: 'purple' },
                                    { code: '+26 more', color: 'gray' },
                                ].map(({ code }) => (
                                    <span
                                        key={code}
                                        className="select-none px-2 py-1 bg-gray-500/30 text-gray-300 rounded text-xs font-mono border border-gray-500/50"
                                    >
                                        {code}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ------------------------------ How It Works -------------------- */}
            <Section id="how-it-works" title="How It Works" dark>
                <div className="grid md:grid-cols-3 gap-8">
                    <FeatureCard icon="fa-file-arrow-up" title="Step 1: Upload your file">
                        Drag and drop any JSON translation file — we support common formats used in
                        React, i18next, Next.js, Vue, and more.
                    </FeatureCard>
                    <FeatureCard icon="fa-language" title="Step 2: Choose target languages">
                        Pick from 30+ supported languages — context-aware AI ensures accuracy across
                        phrases.
                    </FeatureCard>
                    <FeatureCard icon="fa-download" title="Step 3: Download translated JSON">
                        Instantly get ready-to-use files you can plug back into your app.
                    </FeatureCard>
                </div>
            </Section>

            {/* ------------------------------ Benefits ------------------------ */}
            <Section id="benefits" title="Why Developers Choose Translayte">
                <p className="text-center text-gray-300 mb-16 max-w-2xl mx-auto">
                    Designed by developers, for developers — we solve the localization headaches you
                    actually have.
                </p>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                    <FeatureCard icon="fa-bolt" title="Lightning Fast" variant="dark">
                        Translate thousands of keys in seconds.
                    </FeatureCard>
                    <FeatureCard icon="fa-brain" title="Developer Friendly" variant="dark">
                        No setup, no API — just upload and go.
                    </FeatureCard>
                    <FeatureCard icon="fa-puzzle-piece" title="Context-Aware" variant="dark">
                        Maintains meaning across short strings and UI components.
                    </FeatureCard>
                    <FeatureCard icon="fa-copy" title="Copy-Paste Ready" variant="dark">
                        Keeps your original key structure and formatting.
                    </FeatureCard>
                </div>
            </Section>

            {/* ------------------------------ Features list ------------------- */}
            <Section id="features" title="Everything You Need, Nothing You Don't" dark>
                <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                    {[
                        ['Supports nested JSON', 'Complex structures? No problem.'],
                        ['Auto-detects base language', "We figure out what you're starting with."],
                        [
                            'Handles placeholders and variables',
                            'Variables like {name} and %s stay intact.',
                        ],
                        [
                            'Preserves whitespace and formatting',
                            'Your output looks as clean as your input.',
                        ],
                        ['Full preview before download', 'Review translations before exporting.'],
                        [
                            'Works with i18next, Next.js, Vue i18n',
                            'Compatible with popular frameworks.',
                        ],
                        ['Fast export to .json or .js', 'Get the format you need, instantly.'],
                        [
                            'All translation is done client-side',
                            'Your data never leaves your browser.',
                        ],
                    ].map(([title, desc]) => (
                        <div key={title} className="flex items-start space-x-4">
                            <div className="bg-[#8B5CF6]/20 p-2 rounded-lg">
                                <i className="fa-solid fa-check text-[#8B5CF6]" />
                            </div>
                            <div>
                                <h3 className="font-semibold mb-1">{title}</h3>
                                <p className="text-sm text-gray-300">{desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </Section>

            {/* ------------------------------ Testimonials -------------------- */}
            <Section id="testimonials" title={null}>
                <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
                    {[
                        [
                            '"Saved us hours on every localization update."',
                            'Frontend Lead',
                            'SaaS Startup',
                        ],
                        [
                            '"Finally a translation tool that doesn\'t get in my way."',
                            'Solo Indie Dev',
                            'Open Source Contributor',
                        ],
                    ].map(([quote, name, role]) => (
                        <div
                            key={quote}
                            className="bg-[#0f0f0f] p-8 rounded-2xl border border-white/10 backdrop-blur-xl shadow-2xl"
                        >
                            <div className="mb-6">
                                <i
                                    className="fa-solid fa-quote-left text-4xl"
                                    style={{ color: '#8B5CF6' }}
                                />
                            </div>
                            <p className="text-lg mb-6">{quote}</p>
                            <div className="flex items-center">
                                <div className="w-12 h-12 bg-[#8B5CF6]/20 p-2 rounded-full flex items-center justify-center">
                                    <i className="fa-solid fa-user text-[#8B5CF6]" />
                                </div>

                                <div className="ml-4">
                                    <p className="font-medium">{name}</p>
                                    <p className="text-sm text-gray-400">{role}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </Section>

            {/* ------------------------------ Pricing ------------------------- */}
            <Section id="pricing" title="Simple, Transparent Pricing" dark>
                <p className="text-center text-gray-300 mb-16 max-w-2xl mx-auto">
                    No surprise fees. No complicated tiers. Just what you need.
                </p>
                <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                    <PricingCard
                        name="Free Plan"
                        price="0"
                        features={[
                            'Translate up to 3 files/month',
                            '2 target languages per file',
                            'No signup required',
                        ]}
                    />
                    <PricingCard
                        name="Pro Plan"
                        price="12"
                        popular
                        gradient
                        features={[
                            'Unlimited translations',
                            'Unlimited languages',
                            'Early access to new features',
                            'Priority support',
                        ]}
                    />
                </div>
                <div className="text-center mt-12">
                    <button className="btn-primary text-white font-medium px-8 py-4 rounded-full">
                        Try it Free
                    </button>
                </div>
            </Section>

            {/* ------------------------------ Footer -------------------------- */}
            <footer className="py-12 border-t border-gray-800">
                <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center">
                    <div className="mb-6 md:mb-0">
                        <div className="text-xl font-bold gradient-text mb-2">Translayte</div>
                        <p className="text-gray-400 text-sm">
                            © {new Date().getFullYear()} Translayte – All rights reserved
                        </p>
                    </div>
                    <div className="flex flex-wrap justify-center gap-6">
                        <span className="text-gray-300 hover:text-white transition-colors flex items-center cursor-pointer">
                            <i className="fa-brands fa-github mr-2" /> GitHub
                        </span>
                        <span className="text-gray-300 hover:text-white transition-colors cursor-pointer">
                            Privacy Policy
                        </span>
                        <span className="text-gray-300 hover:text-white transition-colors cursor-pointer">
                            Contact: support@translaye.it
                        </span>
                    </div>
                </div>
            </footer>
        </>
    );
};

/* -------------------------- helper sub-components ----------------------- */
type CodeBlockProps = {
    title: string;
    badge: string;
    badgeColor: 'green' | 'blue';
    content: Record<string, string>;
    valueColor: string;
};

const CodeBlock: React.FC<CodeBlockProps> = ({ title, badge, badgeColor, content, valueColor }) => (
    <div className="bg-black/40 backdrop-blur-md rounded-lg p-4 border border-gray-700/50">
        <div className="flex items-center justify-between mb-4">
            <div className="text-xs text-gray-400 uppercase tracking-wider">{title}</div>
            {badgeColor === 'green' && (
                <span className="px-2 py-1 bg-green-500/30 text-green-300 rounded text-xs font-mono border border-green-500/50">
                    {badge}
                </span>
            )}
            {badgeColor === 'blue' && (
                <span className="px-2 py-1 bg-blue-500/30 text-blue-300 rounded text-xs font-mono border border-blue-500/50">
                    {badge}
                </span>
            )}
        </div>
        <pre className="space-y-1 text-sm font-mono overflow-x-auto">
            <code className="text-gray-400 text-left block">{'{'}</code>
            {Object.entries(content).map(([k, v]) => (
                <div key={k} className="pl-4 flex flex-nowrap w-full max-sm:flex-wrap">
                    <span className="text-orange-400 break-normal max-sm:break-all">
                        &quot;{k}&quot;:
                    </span>
                    <span className={`${valueColor} ml-2 break-normal max-sm:break-all`}>
                        &quot;{v}&quot;
                    </span>
                </div>
            ))}
            <code className="text-gray-400 text-left block">{'}'}</code>
        </pre>
    </div>
);

type SectionProps = {
    id: string;
    title: string | null;
    children: React.ReactNode;
    dark?: boolean;
};

const Section: React.FC<SectionProps> = ({ id, title, children, dark = false }) => (
    <section id={id} className={`py-20 ${dark ? 'bg-[#0f0f0f]' : ''}`}>
        <div className="container mx-auto px-4">
            {title && <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">{title}</h2>}
            {children}
        </div>
    </section>
);

type FeatureCardProps = {
    icon: string;
    title: string;
    children: React.ReactNode;
    variant?: 'primary' | 'dark';
};

const FeatureCard: React.FC<FeatureCardProps> = ({
    icon,
    title,
    children,
    variant = 'primary',
}) => (
    <div
        className={`feature-card ${
            variant === 'dark' ? 'bg-[#0f0f0f]' : 'bg-primary/50'
        } p-8 rounded-xl border border-gray-800`}
    >
        <div
            className="w-16 h-12 rounded-full flex items-center justify-center mb-6 text-4xl"
            style={{ color: '#8B5CF6' }}
        >
            <i className={`fa-solid ${icon} text-[#8B5CF6] text-5xl`} />
        </div>
        <h3 className="text-xl font-bold mb-4">{title}</h3>
        <p className="text-gray-300">{children}</p>
    </div>
);
type PricingCardProps = {
    name: string;
    price: string;
    features: string[];
    popular?: boolean;
    gradient?: boolean;
};

const PricingCard: React.FC<PricingCardProps> = ({
    name,
    price,
    features,
    popular = false,
    gradient = false,
}) => (
    <div
        className={`relative rounded-2xl p-8 border flex flex-col ${
            gradient
                ? 'bg-gradient-to-br from-[#8B5CF6]/20 to-[#8B5CF6]/10 border-[#8B5CF6]/50'
                : 'bg-[#0f0f0f] border-white/10'
        }`}
        style={{ minHeight: 420 }}
    >
        {popular && (
            <div className="absolute -top-4 right-4 bg-[#8B5CF6] text-white text-xs font-bold px-3 py-1 rounded-full tracking-wide">
                POPULAR
            </div>
        )}

        <h3 className="text-2xl font-bold mb-2 text-white">{name}</h3>
        <p className="text-sm text-[#b0b2b8] mb-6">
            {price === '0'
                ? 'Perfect for small projects and personal use'
                : 'For teams and businesses'}
        </p>

        <div className="text-4xl font-extrabold text-white mb-8">
            ${price}
            <span className="text-lg font-normal text-[#9ca3af]">/month</span>
        </div>

        <ul className="space-y-4 text-white text-sm mb-8 flex-1">
            {features.map(f => (
                <li key={f} className="flex items-start">
                    <i className="fa-solid fa-check text-green-500 mt-1 mr-2" />
                    <span>{f}</span>
                </li>
            ))}
        </ul>

        <div className="mt-auto">
            <button
                className={`w-full py-3 text-white text-sm font-semibold rounded-lg transition-all ${
                    gradient
                        ? 'bg-[#8B5CF6] hover:bg-[#a78bfa]'
                        : 'border border-[#8B5CF6] hover:bg-[#8B5CF6]/10'
                }`}
            >
                {price === '0' ? 'Get Started' : 'Upgrade to Pro'}
            </button>
        </div>
    </div>
);

export default LandingPage;
