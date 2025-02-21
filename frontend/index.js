"use strict";
(() => {
    function fetchJson(filename) {
        // Returns a promise that resolves to a JSON object
        // Assumes that the file is in the /data subfolder
        return fetch('./data/' + filename)
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
        fetchJson('book-names.json')
            .then((bookNames) => {
            for (let i = 0; i < bookNames.length; i++) {
                const bookString = bookNames[i];
                const option = document.createElement('option');
                option.appendChild(document.createTextNode(bookString));
                option.value = String(i);
                bookSelect.appendChild(option);
            }
        })
            .catch((error) => {
            throw new Error(`Error: ${error.message}`);
        });
    }
    function updateChapter(book, chapter) {
        // Expects a human-readable chapter number from the caller, 
        // which is immediately reset for the 0-indexed array
        chapter -= 1;
        if (diffContainer) {
            diffContainer.innerHTML = book[chapter];
        }
        // Set disabled state of next/previous chapter buttons depending on what chapter we're on
        if (chapter + 1 in book) {
            nextChapterBtnTop === null || nextChapterBtnTop === void 0 ? void 0 : nextChapterBtnTop.removeAttribute('disabled');
            nextChapterBtnBottom === null || nextChapterBtnBottom === void 0 ? void 0 : nextChapterBtnBottom.removeAttribute('disabled');
        }
        else {
            nextChapterBtnTop === null || nextChapterBtnTop === void 0 ? void 0 : nextChapterBtnTop.setAttribute('disabled', '');
            nextChapterBtnBottom === null || nextChapterBtnBottom === void 0 ? void 0 : nextChapterBtnBottom.setAttribute('disabled', '');
        }
        if (chapter - 1 in book) {
            prevChapterBtnTop === null || prevChapterBtnTop === void 0 ? void 0 : prevChapterBtnTop.removeAttribute('disabled');
            prevChapterBtnBottom === null || prevChapterBtnBottom === void 0 ? void 0 : prevChapterBtnBottom.removeAttribute('disabled');
        }
        else {
            prevChapterBtnTop === null || prevChapterBtnTop === void 0 ? void 0 : prevChapterBtnTop.setAttribute('disabled', '');
            prevChapterBtnBottom === null || prevChapterBtnBottom === void 0 ? void 0 : prevChapterBtnBottom.setAttribute('disabled', '');
        }
        const chapterHeading = document.createElement('h2');
        chapterHeading.appendChild(document.createTextNode(`Chapter ${chapter + 1}`));
        chapterHeading.setAttribute('tabindex', '-1');
        chapterHeadingContainer === null || chapterHeadingContainer === void 0 ? void 0 : chapterHeadingContainer.replaceChildren(chapterHeading);
        // Accessibility: as this is an SPA, focus needs to be managed when the new content appears
        // especially when that content is behind the current focus position
        chapterHeading.focus();
    }
    function openBook(book) {
        // Updates the GUI to the selected book, including resetting chapter <select>'s child <option>s
        // and enabling the relevant prev/next chapter controls
        // Defaults to showing chapter 1
        chapterSelect.innerHTML = '';
        for (let i = 0; i < book.length; i++) {
            const option = document.createElement('option');
            option.appendChild(document.createTextNode(String(i + 1)));
            option.setAttribute('value', String(i + 1));
            chapterSelect === null || chapterSelect === void 0 ? void 0 : chapterSelect.appendChild(option);
        }
        // Re-enable the chapter picker and submit button now it contains valid values
        chapterSelect.removeAttribute('disabled');
        navChapterSubmit === null || navChapterSubmit === void 0 ? void 0 : navChapterSubmit.removeAttribute('disabled');
        updateChapter(book, 1);
    }
    // Used to store each book in memory instead of extra fetches of JSON file
    const bibleBook = [];
    for (let i = 0; i < 66; i++) {
        bibleBook.push(null);
    }
    const chapterHeadingContainer = document.getElementById('chapter-heading-container');
    const diffContainer = document.getElementById('diff-container');
    const bookSelect = document.getElementById('nav-ctrl-book');
    const chapterSelect = document.getElementById('nav-ctrl-chapter');
    const navBookSubmit = document.getElementById('nav-ctrl-book-submit');
    const navChapterSubmit = document.getElementById('nav-ctrl-chapter-submit');
    const nextChapterBtnTop = document.getElementById('nav-ctrl-next-chapter-btn-top');
    const prevChapterBtnTop = document.getElementById('nav-ctrl-prev-chapter-btn-top');
    const nextChapterBtnBottom = document.getElementById('nav-ctrl-next-chapter-btn-bottom');
    const prevChapterBtnBottom = document.getElementById('nav-ctrl-prev-chapter-btn-bottom');
    // Pull in book names and setup <select> with option values that correspond to JSON filenames
    // and bibleBook top-level array indicies
    populateBookSelect();
    navBookSubmit === null || navBookSubmit === void 0 ? void 0 : navBookSubmit.addEventListener('click', () => {
        const bookRef = Number(bookSelect.value);
        // If we haven't yet fetched the JSON file and stored internally, then do so...
        if (bibleBook[bookRef] === null) {
            // console.log(`bibleBook array at item ${bookRef} is null. Will download the relevant JSON file and store internally.`)
            fetchJson(bookRef + '.json')
                .then((book) => {
                openBook(book);
                bibleBook[bookRef] = book;
            })
                .catch((error) => {
                console.log('Error: unable to fetch bible book JSON. Caught exception shown below:\n' + error.message);
            });
        }
        // else we have that book already stored in memory that we can use
        else {
            // console.log(`bibleBook array at item ${bookRef} already contains our JSON object.`);
            openBook(bibleBook[bookRef]);
        }
    });
    navChapterSubmit === null || navChapterSubmit === void 0 ? void 0 : navChapterSubmit.addEventListener('click', () => {
        const chapter = Number(chapterSelect.value);
        const bookRef = Number(bookSelect.value);
        if (bibleBook[bookRef] === null) {
            alert('Could not find that chapter - make sure you have pressed the Open Book button first');
        }
        else {
            // console.log(`Chapter: ${chapter}, bookRef: ${bookRef}`)
            // console.log('book.length: ' + bibleBook[bookRef].length)
            updateChapter(bibleBook[bookRef], chapter);
        }
    });
    bookSelect.addEventListener('change', () => {
        // Once the user updates the book <select> there's no way to guarantee we won't get index
        // out-of-range issues on the chapter picker, so it should be disabled until the new book
        // is loaded. Same logic applies to all chapter navigation buttons.
        chapterSelect.setAttribute('disabled', '');
        navChapterSubmit === null || navChapterSubmit === void 0 ? void 0 : navChapterSubmit.setAttribute('disabled', '');
        nextChapterBtnTop === null || nextChapterBtnTop === void 0 ? void 0 : nextChapterBtnTop.setAttribute('disabled', '');
        prevChapterBtnTop === null || prevChapterBtnTop === void 0 ? void 0 : prevChapterBtnTop.setAttribute('disabled', '');
        nextChapterBtnBottom === null || nextChapterBtnBottom === void 0 ? void 0 : nextChapterBtnBottom.setAttribute('disabled', '');
        prevChapterBtnBottom === null || prevChapterBtnBottom === void 0 ? void 0 : prevChapterBtnBottom.setAttribute('disabled', '');
    });
    function handleNextChapterClick() {
        const chapter = Number(chapterSelect.value);
        const bookRef = Number(bookSelect.value);
        if (bibleBook[bookRef] === null) {
            alert('Could not find that chapter - make sure you have pressed the Open Book button first');
        }
        else {
            updateChapter(bibleBook[bookRef], chapter + 1);
            chapterSelect.value = String(chapter + 1);
        }
    }
    nextChapterBtnTop === null || nextChapterBtnTop === void 0 ? void 0 : nextChapterBtnTop.addEventListener('click', () => {
        handleNextChapterClick();
    });
    nextChapterBtnBottom === null || nextChapterBtnBottom === void 0 ? void 0 : nextChapterBtnBottom.addEventListener('click', () => {
        handleNextChapterClick();
    });
    function handlePrevChapterClick() {
        const chapter = Number(chapterSelect.value);
        const bookRef = Number(bookSelect.value);
        if (bibleBook[bookRef] === null) {
            alert('Could not find that chapter - make sure you have pressed the Open Book button first');
        }
        else {
            updateChapter(bibleBook[bookRef], chapter - 1);
            chapterSelect.value = String(chapter - 1);
        }
    }
    prevChapterBtnTop === null || prevChapterBtnTop === void 0 ? void 0 : prevChapterBtnTop.addEventListener('click', () => {
        handlePrevChapterClick();
    });
    prevChapterBtnBottom === null || prevChapterBtnBottom === void 0 ? void 0 : prevChapterBtnBottom.addEventListener('click', () => {
        handlePrevChapterClick();
    });
})();
