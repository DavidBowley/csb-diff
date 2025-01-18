import * as cheerio from 'cheerio';

import fs from 'node:fs';
import path from 'node:path';

function findInXML(version: string, bookFilename:string): string {
    // Will rename later but for now it's a proof of concept for using Cheerio to find specific sections of the XML file
    const bookXMLPath = path.join(__dirname, 'data', version, bookFilename);
    let bookXML: string;
    try {
        bookXML = fs.readFileSync(bookXMLPath, 'utf8');
    } catch (err) {
        console.error(err);
        return '';
    }
    const $ = cheerio.load(bookXML, {xml: true});
    // Removes all verse/footnote references and replaces with a space character
    // This is required for UK XML because of the terrible formatting of the orignal file (run on sentences)
    // but makes sense to also do on US as we want both files to be as close as possible before diff
    
    // $('sup').replaceWith(' ');

    replaceSups($);

    let res = '';
    
    const $chapters = $('chapter');
    res += '\n\nCSB Version: ' + version;
    res += '\nBook: ' + bookFilename;
    $chapters.each((i, element) => {
        // TODO: Remove if statement once debugging complete
        if (i !== 2) {
            // return;
        }
        // TODO: Remove extra linebreaks once finished debugging as the final page will use CSS to handle paragraph spacing
        res += '\n\n\nChapter: ' + (i+1);
        const paragraphs = $(element).find('p');
        paragraphs.each((i, element) => {
            // TODO: Remove if statement once debugging complete
            if (i !== 3) {
                // return;
            }
            let paragraph = $(element).text();
            // Remove all whitespace longer than a single character in length
            // For US XML: handles large amounts of seemingly random whitespace
            // For UK XML: removes the extra empty space added when we replaced <sup>'s earlier            
            paragraph = paragraph.replace(/\s+/g, " ");
            // UK XML uses en-dash vs. US em-dash which causes false positives in the diff 
            paragraph = paragraph.replace(/\u2013/g, "\u2014");
            // TODO: Remove extra linebreak once finished debugging as the final page will use CSS to handle paragraph spacing
            // Add back in when returning to normal...
            // console.log('\n' + paragraph);
            
            if (version === 'UK') {
                // Logic for swapping single and double curly quotes - note this must occur AFTER replacing <sup> and fixing spaces
                // or else there can be false positives in the apostrophe search below
                let str = '';                
                for (let i = 0; i < paragraph.length; i++) {
                    const char = paragraph[i];
                    // Swap open-single quote for open-double quote
                    if (char === '\u2018') {
                        str += '\u201C';
                    }
                    // Swap open-double quote for open-single quote
                    else if (char === '\u201C') {
                        str += '\u2018';
                    }
                    // Swap close-single quote for close-double quote
                    else if (char === '\u2019') {
                        // WIP: Detecting if apostrophe or close-single quote
                        // Try detecting if it's the end of a quotation using the consistency of the language styleguide
                        // Quotations always seem to be preceeded by a non-alpha character (space, comma, etc)           
                        if (/^[^a-zA-Z]$/.test(paragraph[i-1])) {
                            str += '\u201D';
                            
                        }
                        else {
                            // This is (supposedly) not the end of a quotation so keep the original as it was
                            // TODO: Add logic here for the cases where the preceeding letter is an alpha character
                            // but it is still actually a quote, e.g. paranthetical thought, question marks after quote, etc.
                            
                            // Detect quotation pattern: single-close quote > space > zero-width space > em-dash (paranthetical thought)
                            const quoteSuffix = paragraph.slice(i+1, i+4);
                            const quotePreSuffix = paragraph.slice(i-1, i+3);
                            // console.log(`\n\n\n***${quoteSuffix}***\n\n\n`);
                            if (quoteSuffix === '\u0020\u200B\u2014') {
                                str += '\u201D';
                            }
                            // Detect quotation pattern: single-close quote > space > open OR close bracket
                            else if (quoteSuffix.slice(0, 2) === '\u0020\u0028' || quoteSuffix.slice(0, 2) === '\u0020\u0029') {
                                // console.log('open bracket pattern found');
                                str += '\u201D';
                            }
                            // Detect quotation pattern: single-close quote > punctuation mark
                            else if (/[^\w\s]+/.test(quoteSuffix[0])) {
                                // console.log('match found')
                                str += '\u201D';
                            }
                             // Detect quotation pattern: not an 's' character > single-close quote > space > alpha character
                             else if (quotePreSuffix[0] !== 's' && quotePreSuffix[2] === ' ' && /^[a-zA-Z]$/.test(quotePreSuffix[3])) {
                                // console.log('match found, quotePreSuffix is: ' + quotePreSuffix)
                                str += '\u201D';
                            }                             
                            else {
                                str += char;
                            }

                            
                        }
                    }
                    // Swap close-double quote for close-single quote
                    else if (char === '\u201D') {
                        str += '\u2019';
                    }
                    // Else retain original character
                    else {
                        str += char;
                    }
                }
                paragraph = str;
            }
            
            res += '\n\n' + paragraph;
                      
            // return false;
            }
            
        )
        
        }
    )
    // console.log(res);
    return res;
}


function replaceSups($: cheerio.CheerioAPI): void {
    // Replace all <sup>s used for verse numbers with the actual number padded by a space on each side
    $('sup.verse-ref').each( (i, el) => {
        const $sup = $(el);
        const verseNum = $sup.text().trim();
        $sup.replaceWith(` ${verseNum} `)
    })
    // The only <sups> remaining are ones we don't care about, e.g. cross-references, so replace with spaces
    $('sup').replaceWith(' ');
}


const tempUS = findInXML('US', '41-Mark.xml');
const tempUK = findInXML('UK', '41-Mark.xml');

// const tempUS = findInXML('US', '45-Rom.xml');
// const tempUK = findInXML('UK', '45-Rom.xml');

// findInXML('UK', 'tempTest.xml');

const outputString = tempUS + '\n\n\n' + tempUK; 

try {
    fs.writeFileSync(path.join(__dirname, 'tempUS.txt'), tempUS);
    fs.writeFileSync(path.join(__dirname, 'tempUK.txt'), tempUK);
} catch (err) {
    console.error(err);
}