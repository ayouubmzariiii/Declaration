const { generateCerfaPDF } = require('./src/lib/pdfGenerator');
const { getInitialDP } = require('./src/lib/models');
const fs = require('fs');

async function testGeneration() {
    try {
        const dp = getInitialDP();
        const pdfBytes = await generateCerfaPDF(dp);
        fs.writeFileSync('test_cerfa.pdf', pdfBytes);
        console.log('Successfully generated test_cerfa.pdf');
    } catch (e) {
        console.error('Failed to generate PDF:', e);
    }
}

// Ensure running with ts-node since the models and pdfGenerator are written in TypeScript
testGeneration();
