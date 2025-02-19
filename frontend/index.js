"use strict";
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
    const bookSelect = document.getElementById('nav-ctrl-book');
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
    chapter -= 1;
    const diffContainer = document.getElementById('diff-container');
    if (diffContainer) {
        diffContainer.innerHTML = book[chapter];
    }
}
function openBook(book) {
    // Updates the GUI to the selected book, including resetting chapter <select>'s child <option>s
    // Defaults to showing chapter 1
    const chapterSelect = document.getElementById('nav-ctrl-chapter');
    const navChapterSubmit = document.getElementById('nav-ctrl-chapter-submit');
    chapterSelect.innerHTML = '';
    for (let i = 0; i < book.length; i++) {
        const option = document.createElement('option');
        option.appendChild(document.createTextNode(String(i + 1)));
        chapterSelect === null || chapterSelect === void 0 ? void 0 : chapterSelect.appendChild(option);
    }
    // Re-enable the chapter picker and submit button now it contains valid values
    chapterSelect.removeAttribute('disabled');
    navChapterSubmit === null || navChapterSubmit === void 0 ? void 0 : navChapterSubmit.removeAttribute('disabled');
    updateChapter(book, 1);
}
(() => {
    // Used to store each book in memory instead of extra fetches of JSON file
    const bibleBook = [];
    for (let i = 0; i < 66; i++) {
        bibleBook.push(null);
    }
    const bookSelect = document.getElementById('nav-ctrl-book');
    const chapterSelect = document.getElementById('nav-ctrl-chapter');
    const navBookSubmit = document.getElementById('nav-ctrl-book-submit');
    const navChapterSubmit = document.getElementById('nav-ctrl-chapter-submit');
    // Pull in book names and setup <select> with option values that correspond to JSON filenames
    // and bibleBook top-level array indicies
    populateBookSelect();
    navBookSubmit === null || navBookSubmit === void 0 ? void 0 : navBookSubmit.addEventListener('click', () => {
        const bookRef = Number(bookSelect.value);
        // If we haven't yet fetched the JSON file and stored internally, then do so...
        if (bibleBook[bookRef] === null) {
            console.log(`bibleBook array at item ${bookRef} is null. Will download the relevant JSON file and store internally.`);
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
            console.log(`bibleBook array at item ${bookRef} already contains our JSON object.`);
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
            console.log(`Chapter: ${chapter}, bookRef: ${bookRef}`);
            console.log('book.length: ' + bibleBook[bookRef].length);
            updateChapter(bibleBook[bookRef], chapter);
        }
    });
    bookSelect.addEventListener('change', () => {
        // Once the user updates the book <select> there's no way to guarantee we won't get index
        // out-of-range issues on the chapter picker, so it should be disabled until the new book
        // is loaded
        chapterSelect.setAttribute('disabled', '');
        navChapterSubmit === null || navChapterSubmit === void 0 ? void 0 : navChapterSubmit.setAttribute('disabled', '');
    });
})();
