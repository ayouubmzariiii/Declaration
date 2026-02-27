const { PDFDocument } = require('pdf-lib');
const fs = require('fs');

async function run() {
    const pdfBytes = fs.readFileSync('cerfa.pdf');
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const form = pdfDoc.getForm();
    const fields = form.getFields();

    const fieldNames = fields.map(f => {
        return {
            name: f.getName(),
            type: f.constructor.name
        };
    });

    fs.writeFileSync('pdf_fields.json', JSON.stringify(fieldNames, null, 2));
    console.log(`Found ${fields.length} fields.`);
}

run().catch(console.error);
