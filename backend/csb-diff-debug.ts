// Somewhere to store my debug functions that are cluttering up the main codebase

function debugFindOrphanedTextOutsideVerseTags(filepath: string) {
  // Searches for any text that should be in <verse> tags so I can see the extent of the issue
  // Removes anything that is definitely not actual verse text, e.g. headings
  // Traverses the DOM and removes elements from <chapter> and outputs what remains
  let bookXML: string;
  try {
    bookXML = fs.readFileSync(filepath, "utf8");
  } catch (err) {
    console.error(err);
    return null;
  }
  const $ = cheerio.load(bookXML, { xml: true });
  const $chapters = $("chapter");
  for (const chapter of $chapters) {
    for (const verse of $(chapter).find("verse")) {
      $(verse).remove();
    }
    for (const head1 of $(chapter).find("head1")) {
      $(head1).remove();
    }

    console.log($(chapter).text().trim());
    // break;
  }
}

function debugCallingVerseTracker() {
  const sourcePath = path.join(__dirname, "data", "US");
  const sourceFiles = fs
    .readdirSync(sourcePath)
    .map((filename) => {
      return path.join(sourcePath, filename);
    })
    .filter(isFile);

  for (const filePath of sourceFiles) {
    const filename = path.basename(filePath);

    const allVerses = debugVerseTracker(filename);
    const baseline = allVerses?.versesBaseline;
    const paragraphs = allVerses?.versesParagraphs;
    const verses = allVerses?.versesVerses;

    if (baseline && paragraphs && verses) {
      for (let i = 0; i < baseline.length; i++) {
        const chapterBaseline = baseline[i];
        // const chapterParagraphs = paragraphs[i];
        const chapterVerses = verses[i];

        // Same logic but for comparing Baseline to Paragraphs...
        // if (chapterBaseline.size !== chapterParagraphs.size) {
        //   console.log(`\n\n***${filename}, Chapter: ${i + 1}***`);
        //   let missingVerses = "";
        //   for (const verse of chapterBaseline.difference(chapterParagraphs)) {
        //     missingVerses += ` ${verse}, `;
        //   }
        //   console.log(missingVerses);
        // }

        if (chapterBaseline.size !== chapterVerses.size) {
          console.log(`\n\n***${filename}, Chapter: ${i + 1}***`);
          let missingVerses = "";
          for (const verse of chapterBaseline.difference(chapterVerses)) {
            missingVerses += ` ${verse}, `;
          }
          console.log(missingVerses);
        }

        // console.log(`\n\n***Chapter: ${i + 1} Baseline***`);
        // console.log(chapterBaseline);
        // console.log(`\n\n***Chapter: ${i + 1} Paragraphs Only***`);
        // console.log(chapterVerses);
        // console.log("The missing verses are: ");
        // console.log(chapterBaseline.difference(chapterVerses));
      }
    }
  }
}

function debugVerseTracker(
  bookFilename: string,
  stopAtChapter: number | null = null,
): {
  versesBaseline: Array<Set<number>>;
  versesParagraphs: Array<Set<number>>;
  versesVerses: Array<Set<number>>;
} | null {
  // Debug function that will track each verse within each chapter within each book
  // The output will be an array containing verse numbers in order
  // Work in progress... lots copy pasted from parseXML function
  const bookXMLPath = path.join(__dirname, "data", "US", bookFilename);
  let bookXML: string;
  try {
    bookXML = fs.readFileSync(bookXMLPath, "utf8");
  } catch (err) {
    console.error(err);
    return null;
  }
  const $ = cheerio.load(bookXML, { xml: true });
  const versesBaseline: Array<Set<number>> = [];
  const versesParagraphs: Array<Set<number>> = [];
  const versesVerses: Array<Set<number>> = [];
  const $chapters = $("chapter");
  $chapters.each((chapterIndex, chapter) => {
    if (stopAtChapter && chapterIndex >= stopAtChapter) {
      return;
    }
    versesBaseline.push(new Set());
    // Find all verse numbers from <chapter> tags (theoretically that should be all of them)
    for (const sup of $(chapter).find("sup.verse-ref")) {
      versesBaseline[chapterIndex].add(Number($(sup).text().trim()));
    }
    // Same as above search in <chapter> tags but specifically restricted to child <p> tags
    versesParagraphs.push(new Set());
    for (const p of $(chapter).find("p")) {
      for (const sup of $(p).find("sup.verse-ref")) {
        versesParagraphs[chapterIndex].add(Number($(sup).text().trim()));
      }
    }
    // Same as above search in <chapter> tags but specifically restricted to child <verse> tags
    versesVerses.push(new Set());
    for (const verse of $(chapter).find("verse")) {
      for (const sup of $(verse).find("sup.verse-ref")) {
        versesVerses[chapterIndex].add(Number($(sup).text().trim()));
      }
    }
  });
  const res = {
    versesBaseline: versesBaseline,
    versesParagraphs: versesParagraphs,
    versesVerses: versesVerses,
  };
  return res;
}

function debugFormatWithSpacing(output: string[][]): string {
  let res = "";
  for (let chapterIndex = 0; chapterIndex < output.length; chapterIndex++) {
    const chapter = output[chapterIndex];
    res += `\n\n\nChapter ${chapterIndex + 1}`;
    for (const paragraph of chapter) {
      res += "\n\n" + paragraph;
    }
  }
  return res;
}

function debugTestOutputToFile() {
  // Outputs a string with lots of line breaks for readability to a test file for debugging
  const bookParagraphsUS = parseXML("US", "45-Rom.xml");
  const bookParagraphsUK = parseXML("UK", "45-Rom.xml");

  if (bookParagraphsUS !== null && bookParagraphsUK !== null) {
    try {
      fs.writeFileSync(
        path.join(__dirname, "tempUS.txt"),
        debugFormatWithSpacing(bookParagraphsUS),
      );
      fs.writeFileSync(
        path.join(__dirname, "tempUK.txt"),
        debugFormatWithSpacing(bookParagraphsUK),
      );
    } catch (err) {
      console.error(err);
    }
  }
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
