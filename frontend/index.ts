(() => {
  function fetchJson(filename: string) {
    // Returns a promise that resolves to a JSON object
    // Assumes that the file is in the /data subfolder
    return fetch("./data/" + filename)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error, status = ${response.status}`);
        }
        return response.json();
      })
      .catch((error) => {
        throw new Error(`Error: ${error.message}`);
      });
  }

  function populateBookSelect() {
    fetchJson("book-names.json")
      .then((bookNames: string[]) => {
        for (let i = 0; i < bookNames.length; i++) {
          const bookString = bookNames[i];
          const option = document.createElement("option");
          option.appendChild(document.createTextNode(bookString));
          option.value = String(i);
          bookSelect.appendChild(option);
        }
      })
      .catch((error) => {
        throw new Error(`Error: ${error.message}`);
      });
  }

  function updateChapter(book: string[], chapter: number) {
    // Expects a human-readable chapter number from the caller,
    // which is immediately reset for the 0-indexed array
    chapter -= 1;
    if (diffContainer) {
      diffContainer.innerHTML = book[chapter];
    }
    // Set disabled state of next/previous chapter buttons depending on what chapter we're on
    if (chapter + 1 in book) {
      nextChapterBtnTop?.removeAttribute("disabled");
      nextChapterBtnBottom?.removeAttribute("disabled");
    } else {
      nextChapterBtnTop?.setAttribute("disabled", "");
      nextChapterBtnBottom?.setAttribute("disabled", "");
    }
    if (chapter - 1 in book) {
      prevChapterBtnTop?.removeAttribute("disabled");
      prevChapterBtnBottom?.removeAttribute("disabled");
    } else {
      prevChapterBtnTop?.setAttribute("disabled", "");
      prevChapterBtnBottom?.setAttribute("disabled", "");
    }
    const chapterHeading = document.createElement("h2");
    chapterHeading.appendChild(
      document.createTextNode(`Chapter ${chapter + 1}`),
    );
    chapterHeading.setAttribute("tabindex", "-1");
    chapterHeadingContainer?.replaceChildren(chapterHeading);
    // Accessibility: as this is an SPA, focus needs to be managed when the new content appears
    // especially when that content is behind the current focus position
    // However, want to override this behaviour on the first run as page focus should start from
    // the top of a new page
    if (!isFirstRun) {
      chapterHeading.focus();
    }
    isFirstRun = false;
  }

  function openBook(book: string[]) {
    // Updates the GUI to the selected book, including resetting chapter <select>'s child <option>s
    // and enabling the relevant prev/next chapter controls
    // Defaults to showing chapter 1
    chapterSelect.innerHTML = "";
    for (let i = 0; i < book.length; i++) {
      const option = document.createElement("option");
      option.appendChild(document.createTextNode(String(i + 1)));
      option.setAttribute("value", String(i + 1));
      chapterSelect?.appendChild(option);
    }
    // Re-enable the chapter picker and submit button now it contains valid values
    chapterSelect.removeAttribute("disabled");
    navChapterSubmit?.removeAttribute("disabled");
    updateChapter(book, 1);
  }

  // Used to store each book in memory instead of extra fetches of JSON file
  const bibleBook: Array<Array<string> | null> = [];
  for (let i = 0; i < 66; i++) {
    bibleBook.push(null);
  }

  const chapterHeadingContainer = document.getElementById(
    "chapter-heading-container",
  );
  const diffContainer = document.getElementById("diff-container");
  const bookSelect = document.getElementById(
    "nav-ctrl-book",
  ) as HTMLSelectElement;
  const chapterSelect = document.getElementById(
    "nav-ctrl-chapter",
  ) as HTMLSelectElement;
  const navBookSubmit = document.getElementById("nav-ctrl-book-submit");
  const navChapterSubmit = document.getElementById("nav-ctrl-chapter-submit");
  const nextChapterBtnTop = document.getElementById(
    "nav-ctrl-next-chapter-btn-top",
  );
  const prevChapterBtnTop = document.getElementById(
    "nav-ctrl-prev-chapter-btn-top",
  );
  const nextChapterBtnBottom = document.getElementById(
    "nav-ctrl-next-chapter-btn-bottom",
  );
  const prevChapterBtnBottom = document.getElementById(
    "nav-ctrl-prev-chapter-btn-bottom",
  );

  let isFirstRun = true;

  // Pull in book names and setup <select> with option values that correspond to JSON filenames
  // and bibleBook top-level array indicies
  populateBookSelect();
  // Default to Genesis 1 on page load
  fetchJson("00.json")
    .then((book) => {
      openBook(book);
      bibleBook[0] = book;
    })
    .catch((error) => {
      console.log(
        "Error: unable to fetch bible book JSON. Caught exception shown below:\n" +
          error.message,
      );
    });

  navBookSubmit?.addEventListener("click", () => {
    const bookRef = Number(bookSelect.value);

    // If we haven't yet fetched the JSON file and stored internally, then do so...
    if (bibleBook[bookRef] === null) {
      // 0-pad the number upto 2 digits for single digit array indicies so we can find the right files on the server
      let filename = bookRef.toString();
      if (filename.length === 1) {
        filename = "0" + filename;
      }
      fetchJson(filename + ".json")
        .then((book) => {
          openBook(book);
          bibleBook[bookRef] = book;
        })
        .catch((error) => {
          console.log(
            "Error: unable to fetch bible book JSON. Caught exception shown below:\n" +
              error.message,
          );
        });
    }
    // else we have that book already stored in memory that we can use
    else {
      openBook(bibleBook[bookRef]);
    }
  });

  navChapterSubmit?.addEventListener("click", () => {
    const chapter = Number(chapterSelect.value);
    const bookRef = Number(bookSelect.value);
    if (bibleBook[bookRef] === null) {
      alert(
        "Could not find that chapter - make sure you have pressed the Open Book button first",
      );
    } else {
      updateChapter(bibleBook[bookRef], chapter);
    }
  });

  bookSelect.addEventListener("change", () => {
    // Once the user updates the book <select> there's no way to guarantee we won't get index
    // out-of-range issues on the chapter picker, so it should be disabled until the new book
    // is loaded. Same logic applies to all chapter navigation buttons.
    chapterSelect.setAttribute("disabled", "");
    navChapterSubmit?.setAttribute("disabled", "");
    nextChapterBtnTop?.setAttribute("disabled", "");
    prevChapterBtnTop?.setAttribute("disabled", "");
    nextChapterBtnBottom?.setAttribute("disabled", "");
    prevChapterBtnBottom?.setAttribute("disabled", "");
  });

  function handleNextChapterClick() {
    const chapter = Number(chapterSelect.value);
    const bookRef = Number(bookSelect.value);
    if (bibleBook[bookRef] === null) {
      alert(
        "Could not find that chapter - make sure you have pressed the Open Book button first",
      );
    } else {
      updateChapter(bibleBook[bookRef], chapter + 1);
      chapterSelect.value = String(chapter + 1);
    }
  }

  nextChapterBtnTop?.addEventListener("click", () => {
    handleNextChapterClick();
  });

  nextChapterBtnBottom?.addEventListener("click", () => {
    handleNextChapterClick();
  });

  function handlePrevChapterClick() {
    const chapter = Number(chapterSelect.value);
    const bookRef = Number(bookSelect.value);
    if (bibleBook[bookRef] === null) {
      alert(
        "Could not find that chapter - make sure you have pressed the Open Book button first",
      );
    } else {
      updateChapter(bibleBook[bookRef], chapter - 1);
      chapterSelect.value = String(chapter - 1);
    }
  }

  prevChapterBtnTop?.addEventListener("click", () => {
    handlePrevChapterClick();
  });

  prevChapterBtnBottom?.addEventListener("click", () => {
    handlePrevChapterClick();
  });
})();
