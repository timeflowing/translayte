import React from 'react';
import { LegalFooterLinks } from './LegalFooterLinks';

export default function Footer() {
    return (
        <footer className="py-8 border-t border-gray-800 mt-8">
            <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center">
                <div className="mb-4 md:mb-0 text-center md:text-left">
                    <div className="text-lg font-bold gradient-text mb-1">Phrasey</div>
                    <p className="text-gray-400 text-sm">© {new Date().getFullYear()} Phrasey</p>
                </div>
                <LegalFooterLinks />
            </div>
        </footer>
    );
}
