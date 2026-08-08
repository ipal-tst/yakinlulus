const JSZip = require('jszip');
const fs = require('fs');

async function run() {
    const data = fs.readFileSync('d:/Project/EdTech/Yakinlulus.id/template_import_soal.xlsx');
    const zip = await JSZip.loadAsync(data);
    const sheet2 = await zip.file('xl/worksheets/sheet2.xml').async('text');
    const sStr = await zip.file('xl/sharedStrings.xml').async('text');

    // Parse shared strings
    const strings = [];
    const tRegex = /<t[^>]*>(.*?)<\/t>/g;
    let match;
    while ((match = tRegex.exec(sStr)) !== null) {
        strings.push(match[1]);
    }

    console.log('Sheet2 length:', sheet2.length);
    console.log('Shared strings count:', strings.length);

    ['K25', 'K26', 'K27', 'I25', 'I26', 'I27', 'H25', 'H26', 'H27'].forEach(cellRef => {
        const cRegex = new RegExp(`<c r="${cellRef}"[^>]*>(.*?)</c>`, 's');
        const cMatch = sheet2.match(cRegex);
        if (cMatch) {
            console.log(`Cell ${cellRef}:`, cMatch[0]);
            const vMatch = cMatch[0].match(/<v>(.*?)<\/v>/);
            const tType = cMatch[0].includes('t="s"');
            if (vMatch && tType) {
                const sIdx = parseInt(vMatch[1], 10);
                console.log(`  -> String value [${sIdx}]:`, strings[sIdx]);
            } else if (vMatch) {
                console.log(`  -> Raw value:`, vMatch[1]);
            }
        } else {
            console.log(`Cell ${cellRef}: not found in XML`);
        }
    });
}

run().catch(console.error);
