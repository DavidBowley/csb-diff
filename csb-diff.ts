import * as cheerio from 'cheerio';

import fs from 'node:fs';
import path from 'node:path';

function findInXML(version: string, bookFilename:string): void {
    // Will rename later but for now it's a proof of concept for using Cheerio to find specific sections of the XML file
    const bookXMLPath = path.join(__dirname, 'data', version, bookFilename);
    let bookXML: string;
    try {
        bookXML = fs.readFileSync(bookXMLPath, 'utf8');
    } catch (err) {
        console.error(err);
        return;
    }
    const $ = cheerio.load(bookXML, {xml: true});
    // Removes all verse/footnote references and replaces with a space character
    // This is required for UK XML because of the terrible formatting of the orignal file (run on sentences)
    // but makes sense to also do on US as we want both files to be as close as possible before diff
    $('sup').replaceWith(' ');
    const $chapters = $('chapter');
    console.log('\nCSB Version: ' + version);
    console.log('Book: ' + bookFilename);
    $chapters.each((i, element) => {
        if (i > 0) {
            return;
        }
        console.log('Chapter: ' + (i+1));
        const paragraphs = $(element).find('p');
        paragraphs.each((i, element) => {
            let paragraph = $(element).text();
            // Remove all whitespace longer than a single character in length
            // For US XML: handles large amounts of seemingly random whitespace
            // For UK XML: removes the extra empty space added when we replaced <sup>'s earlier            
            paragraph = paragraph.replace(/\s+/g, " ");
            // UK XML uses en-dash vs. US em-dash which causes false positives in the diff 
            paragraph = paragraph.replace(/\u2013/g, "\u2014");
            console.log(paragraph);
            // return false;
        }
    )
    });

}


findInXML('US', '45-Rom.xml');
findInXML('UK', '45-Rom.xml');
