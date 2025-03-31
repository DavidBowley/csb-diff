import * as cheerio from "cheerio";
import * as Diff from "diff";

import fs from "node:fs";
import path from "node:path";

function parseXML(version: "UK" | "US", bookFilename: string): string[] | null {
  // Takes a CSB Bible book XML file and outputs an array of strings (chapters)
  // which includes the text + verse numbers
  const bookXMLPath = path.join(__dirname, "data", version, bookFilename);
  let bookXML: string;
  try {
    bookXML = fs.readFileSync(bookXMLPath, "utf8");
  } catch (err) {
    console.error(err);
    return null;
  }
  const $ = cheerio.load(bookXML, { xml: true });

  replaceSups($);

  // Remove all headings from text
  for (const head1 of $("head1")) {
    $(head1).remove();
  }

  // Remove all <psalm> tags - these contain text like "BOOK I" and "Psalm 1"
  for (const psalm of $("psalm")) {
    $(psalm).remove();
  }

  // Extract child text nodes from <chapter> tags
  const res: string[] = [];
  const $chapters = $("chapter");
  $chapters.each((chapterIndex, chapter) => {
    let chapterStr = $(chapter).text();
    // Remove all whitespace longer than a single character in length
    // For US XML: handles large amounts of seemingly random whitespace
    // For UK XML: removes the extra empty space added when we replaced <sup>'s earlier
    chapterStr = chapterStr.replace(/\s+/g, " ");
    // UK XML uses en-dash vs. US em-dash which causes false positives in the diff
    chapterStr = chapterStr.replace(/\u2013/g, "\u2014");
    if (version === "UK") {
      chapterStr = swapQuotes(chapterStr);
    }
    // Add the <sup>s back in - see replaceSups() for rationale
    chapterStr = chapterStr.replace(/\*\*\*(\d+)\*\*\*/g, "<sup>$1</sup>");
    res.push(chapterStr);
  });
  return res;
}

function replaceSups($: cheerio.CheerioAPI): void {
  // Replace all <sup>s used for verse numbers with the actual number padded by '***'
  // This seems strange, but there is a reason... there is no way to get a reliable diff unless
  // we extract all text nodes from <chapter> tags, which means we don't have programmatic access
  // to the verse numbers. Tagging them with an identifiable padding like this means later on
  // I can write the <sup> tags back into the final string before it gets sent to the diff function
  $("sup.verse-ref").each((i, el) => {
    const $sup = $(el);
    const verseNum = $sup.text().trim();
    $sup.replaceWith(` ***${verseNum}*** `);
  });

  // Replace all <sup>s used for fractions in US version with the number itself padded by spaces
  // If we don't do this then the next part of this function will remove/break the formatting on these
  // The logic relies on finding the <sub> tags as <sup> has too many uses, but <sub> is only ever fractions
  // All previous siblings of <sub>s appear to be the corresponding <sup> tag
  // Note that we do not need to replace the <sub> tags as their text nodes are extracted without issue later
  for (const sub of $("sub")) {
    const supElement = $(sub).prev();
    const supText = supElement.text();
    // Guardrail in the event that this element is some random verse text on future revisions
    if (supElement[0].tagName === "sup") {
      supElement.replaceWith(` ${supText} `);
    }
  }

  // The only <sups> remaining are ones we don't care about, e.g. cross-references, so replace with spaces
  // This is required for UK XML because of the terrible formatting of the orignal file (run on sentences)
  // but makes sense to also do on US as we want both files to be as close as possible before diff
  $("sup").replaceWith(" ");
  // For future reference, these are the <sup> classes I have observed so far...
  // ... verse-ref, cross-ref, translate-note, alt-reading-note, help-note
}

function swapQuotes(string: string): string {
  // UK-specific logic for swapping single and double curly quotes - assumes <sup>s already replaced
  // All quotes are 'curly' - straight quotes are ignored
  let str = "";
  for (let i = 0; i < string.length; i++) {
    const char = string[i];
    // Swap open-single quote for open-double quote
    if (char === "\u2018") {
      str += "\u201C";
    }
    // Swap open-double quote for open-single quote
    else if (char === "\u201C") {
      str += "\u2018";
    }
    // Swap close-single quote for close-double quote
    else if (char === "\u2019" && isSingleCloseQuote(string, i)) {
      str += "\u201D";
    }
    // Swap close-double quote for close-single quote
    else if (char === "\u201D") {
      str += "\u2019";
    }
    // Else retain original character
    else {
      str += char;
    }
  }
  return str;
}

function isSingleCloseQuote(string: string, i: number): boolean {
  // Boolean function to determine if the symbol represents a single quotation mark in the closed form
  // as opposed to an apostrophe used in the possessive case or a contraction
  // NOTE: This is NOT foolproof/perfect but seems to catch the majority of cases so is good enough
  // for our purposes here

  const quoteSuffix = string.slice(i + 1, i + 4);
  const quotePreSuffix = string.slice(i - 1, i + 3);

  // Step 1: Quotations are often preceeded by a non-alpha character (space, comma, etc)
  // While this does not catch all quotations, it is impossible for the possessive case or
  // a contraction to meet this critera, so it is a good place to start.
  if (/^[^a-zA-Z]$/.test(string[i - 1])) {
    return true;
  }

  // Step 2: Detect quotation pattern: single-close quote > space > zero-width space > em-dash
  // (quote interrupted with hyphen)
  else if (quoteSuffix === "\u0020\u200B\u2014") {
    return true;
  }

  // Step 3: Detect quotation pattern: single-close quote > space > open OR close bracket
  // (quote interrupted with brackets)
  else if (
    quoteSuffix.slice(0, 2) === "\u0020\u0028" ||
    quoteSuffix.slice(0, 2) === "\u0020\u0029"
  ) {
    return true;
  }

  // Step 4: Detect quotation pattern: single-close quote > punctuation mark
  else if (/[^\w\s]+/.test(quoteSuffix[0])) {
    return true;
  }

  // Step 5: Detect quotation pattern: not an 's' character > single-close quote > space > alpha character
  // A catch-all for those situations where they don't appear to be following their own styleguide
  // consistently - the detection of 's' prefix is to avoid genuine possessive cases getting caught
  else if (
    quotePreSuffix[0] !== "s" &&
    quotePreSuffix[2] === " " &&
    /^[a-zA-Z]$/.test(quotePreSuffix[3])
  ) {
    return true;
  }

  // No single-close quotation mark found (in theory...)
  else {
    return false;
  }
}

function csbDiffVersions(usVersion: string[], ukVersion: string[]): string[] {
  const res: string[] = [];
  for (let chapterIndex = 0; chapterIndex < usVersion.length; chapterIndex++) {
    const usChapter = usVersion[chapterIndex];
    const ukChapter = ukVersion[chapterIndex];
    res.push("<p>\n" + diffWords(usChapter, ukChapter, 4) + "\n  </p>\n");
  }
  return res;
}

function diffWords(s1: string, s2: string, indent = 0): string {
  // Uses jsdiff to compare two strings using diffWords
  // indent = sets the number of indent spaces for cleaner output files
  // Returns a HTML fragment as a string
  const diff = Diff.diffWords(s1, s2);
  let res = "";

  diff.forEach((part) => {
    // Accessibility Note: The choice was made to keep the semantic <ins> and <del> tags
    // because they work across 3 of the 5 major screen reader/browser combinations (as of 2025)
    // I tried adding off-screen text but this interfered with the existing working tags on the
    // environments that were implementing them well, so in the end I left it for the screen
    // reader to determine the semantic meaning of the element.
    if (part.added) {
      res += " ".repeat(indent) + "<ins>" + part.value + "</ins>\n";
    } else if (part.removed) {
      res += " ".repeat(indent) + "<del>" + part.value + "</del>\n";
    } else {
      res += " ".repeat(indent) + "<span>" + part.value + "</span>\n";
    }
  });
  return res.trimEnd();
}

function debugHtmlFragmentWithBoilerplate(
  bookDiff: string[],
  filename: string,
) {
  const boilerplateHtmlStart = `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="X-UA-Compatible" content="ie=edge">
        <title>HTML 5 Boilerplate</title>
        <link rel="stylesheet" href="testDiffStyle.css">
    </head>
    <body>
    `;
  const boilerplateHtmlEnd = `  </body>
    </html>`;

  let htmlFragment = "";
  for (let i = 0; i < bookDiff.length; i++) {
    const chapter = bookDiff[i];
    htmlFragment += `\n<h2>Chapter: ${i + 1}</h2>\n`;
    htmlFragment += chapter;
  }

  const outputFile = boilerplateHtmlStart + htmlFragment + boilerplateHtmlEnd;
  // Change filename to zero-indexed (to match frontend) and .html extension
  filename = filename.replace(
    /(\d+)(-\w+)(\.xml)/,
    (match: string, p1: string, p2: string): string => {
      const index = String(Number(p1) - 1).padStart(2, "0");
      return index + p2 + ".html";
    },
  );

  try {
    fs.writeFileSync(
      path.join(__dirname, "debug_output", filename),
      outputFile,
    );
  } catch (err) {
    console.error(err);
  }
}

function debugOutputToJson() {
  // WIP function that outputs the diff HTML fragment into a JSON file ready for the frontend
  // Currently only takes hard-coded filenames but in the future will be modified to take the
  // filenames from the XML files directory
  const bookChaptersUS = parseXML("US", "01-Gen.xml");
  const bookChaptersUK = parseXML("UK", "01-Gen.xml");

  if (bookChaptersUS !== null && bookChaptersUK !== null) {
    const bookDiff = csbDiffVersions(bookChaptersUS, bookChaptersUK);

    try {
      fs.writeFileSync(
        path.join(__dirname, "0.json"),
        JSON.stringify(bookDiff),
      );
    } catch (err) {
      console.error(err);
    }
  }
}

function isFile(filename: string) {
  return fs.lstatSync(filename).isFile();
}

function debugOutputAllAsHtmlFiles() {
  const sourcePath = path.join(__dirname, "data", "US");
  const sourceFiles = fs
    .readdirSync(sourcePath)
    .map((filename) => {
      return path.join(sourcePath, filename);
    })
    .filter(isFile);

  for (const filePath of sourceFiles) {
    const filename = path.basename(filePath);
    const bookChaptersUS = parseXML("US", filename);
    const bookChaptersUK = parseXML("UK", filename);

    if (bookChaptersUS && bookChaptersUK) {
      const bookDiff = csbDiffVersions(bookChaptersUS, bookChaptersUK);
      debugHtmlFragmentWithBoilerplate(bookDiff, filename);
    }
  }
}

function debugOutputOneAsHtmlFile(filename: string) {
  const bookChaptersUS = parseXML("US", filename);
  const bookChaptersUK = parseXML("UK", filename);

  if (bookChaptersUS && bookChaptersUK) {
    const bookDiff = csbDiffVersions(bookChaptersUS, bookChaptersUK);
    debugHtmlFragmentWithBoilerplate(bookDiff, filename);
  }
}

function debugTestFindingFractions() {
  // Try US first, then if working try on UK versions
  // const bookXMLPath = path.join(__dirname, "data", "US", "02-Ex.xml");

  const sourcePath = path.join(__dirname, "data", "US");
  const sourceFiles = fs
    .readdirSync(sourcePath)
    .map((filename) => {
      return path.join(sourcePath, filename);
    })
    .filter(isFile);

  for (const filePath of sourceFiles) {
    let bookXML: string;
    try {
      bookXML = fs.readFileSync(filePath, "utf8");
    } catch (err) {
      console.error(err);
      return null;
    }
    const $ = cheerio.load(bookXML, { xml: true });
    // $("sup.verse-ref").each((i, el) => {
    //   const $sup = $(el);
    //   const verseNum = $sup.text().trim();
    //   $sup.replaceWith(` ***${verseNum}*** `);
    // });

    for (const sub of $("sub")) {
      const supText = $(sub).prev().text();
      const subText = $(sub).text();
      console.log(supText + " / " + subText + "          " + filePath);
      // const subText = $(sub).text();
    }
  }

  //$("sup").replaceWith(" ");
}

// debugOutputOneAsHtmlFile("02-Ex.xml");
// debugTestFindingFractions();

debugOutputAllAsHtmlFiles();
