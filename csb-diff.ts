import * as cheerio from 'cheerio';

import fs from 'node:fs';
import path from 'node:path';

function parseXML(version: 'UK' | 'US', bookFilename:string): string[][] | null {
    // Takes a CSB Bible book XML file and outputs a string which includes the text + verse numbers
    // Currently hard-codes in the meta data but likely this can be programmatically associated
    const bookXMLPath = path.join(__dirname, 'data', version, bookFilename);
    let bookXML: string;
    try {
        bookXML = fs.readFileSync(bookXMLPath, 'utf8');
    } catch (err) {
        console.error(err);
        return null;
    }
    const $ = cheerio.load(bookXML, {xml: true});
    
    // Replace all <sup>s with whitespace-padded verse number 
    // or just space if a cross-reference etc.
    replaceSups($);

    let res: string[][] = [];
    const $chapters = $('chapter');
    $chapters.each((chapterIndex, element) => {
        // TODO: Remove if statement once debugging complete
        if (chapterIndex !== 2) {
            // return;
        }
        res.push([])
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
            
            if (version === 'UK') {
                paragraph = swapQuotes(paragraph);
            }
            
            // Trimming helps remove random end of paragraph space seen in some books (that affects version diff in char diff mode)
            res[chapterIndex].push(paragraph.trim());
            }   
        )
        }
    )
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
    // This is required for UK XML because of the terrible formatting of the orignal file (run on sentences)
    // but makes sense to also do on US as we want both files to be as close as possible before diff
    $('sup').replaceWith(' ');
}


function swapQuotes(paragraph: string): string {
    // UK-specific logic for swapping single and double curly quotes - assumes <sup>s already replaced
    // All quotes are 'curly' - straight quotes are ignored
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
        else if (char === '\u2019' && isSingleCloseQuote(paragraph, i)) {      
            str += '\u201D';
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
    return str;
}

function isSingleCloseQuote(paragraph: string, i: number): boolean {
    // Boolean function to determine if the symbol represents a single quotation mark in the closed form
    // as opposed to an apostrophe used in the possessive case or a contraction
    // NOTE: This is NOT foolproof/perfect but seems to catch the majority of cases so is good enough
    // for our purposes here

    const quoteSuffix = paragraph.slice(i+1, i+4);
    const quotePreSuffix = paragraph.slice(i-1, i+3);

    // Step 1: Quotations are often preceeded by a non-alpha character (space, comma, etc)
    // While this does not catch all quotations, it is impossible for the possessive case or 
    // a contraction to meet this critera, so it is a good place to start.
    if (/^[^a-zA-Z]$/.test(paragraph[i-1])) {
        return true;
    }

    // Step 2: Detect quotation pattern: single-close quote > space > zero-width space > em-dash 
    // (quote interrupted with hyphen)
    else if (quoteSuffix === '\u0020\u200B\u2014') {
        return true;
    }
       
    // Step 3: Detect quotation pattern: single-close quote > space > open OR close bracket 
    // (quote interrupted with brackets)
    else if (quoteSuffix.slice(0, 2) === '\u0020\u0028' || quoteSuffix.slice(0, 2) === '\u0020\u0029') {
        return true;
    }

    // Step 4: Detect quotation pattern: single-close quote > punctuation mark
    else if (/[^\w\s]+/.test(quoteSuffix[0])) {
        return true;
    }

    // Step 5: Detect quotation pattern: not an 's' character > single-close quote > space > alpha character
    // A catch-all for those situations where they don't appear to be following their own styleguide
    // consistently - the detection of 's' prefix is to avoid genuine possessive cases getting caught
    else if (quotePreSuffix[0] !== 's' && quotePreSuffix[2] === ' ' && /^[a-zA-Z]$/.test(quotePreSuffix[3])) {
        return true;
    }

    // No single-close quotation mark found (in theory...)
    else {
        return false;
    }
}


function debugFormatWithSpacing(output: string[][]): string {
    let res = '';
    for (let chapterIndex = 0; chapterIndex < output.length; chapterIndex++) {
        const chapter = output[chapterIndex];
        res += `\n\n\nChapter ${chapterIndex+1}`
        for (const paragraph of chapter) {
            res += '\n\n' + paragraph;
        }
    }
    return res;
} 


const bookParagraphsUS = parseXML('US', '45-Rom.xml');
const bookParagraphsUK = parseXML('UK', '45-Rom.xml');

if (bookParagraphsUS!== null && bookParagraphsUK !== null) {
    try {
        fs.writeFileSync(path.join(__dirname, 'tempUS.txt'), debugFormatWithSpacing(bookParagraphsUS));
        fs.writeFileSync(path.join(__dirname, 'tempUK.txt'), debugFormatWithSpacing(bookParagraphsUK));
    } catch (err) {
        console.error(err);
    }
}

