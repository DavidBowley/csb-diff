import * as cheerio from 'cheerio';

import fs from 'node:fs';
import path from 'node:path';

function findInXML() {
    // Will rename later but for now it's a proof of concept for using Cheerio to find specific sections of the XML file
    const bookXMLPath = path.join(__dirname, 'data', 'US', '45-Rom.xml');
    let bookXML: string;
    try {
        bookXML = fs.readFileSync(bookXMLPath, 'utf8');
    } catch (err) {
        console.error(err);
        return
    }
    const $ = cheerio.load(bookXML, {xml: true});
    const $chapters = $('chapter');
    $chapters.each((i, element) => {
        if (i > 0) {
            return
        }
        console.log('Chapter: ' + (i+1));
        const verses = $(element).find('verse');
        verses.each((i, element) => {
            const verse = $(element).text();
            // Remove all whitespace longer than a single character in length
            console.log(verse.replace(/\s+/g, " "));
        })
    });

}

findInXML();