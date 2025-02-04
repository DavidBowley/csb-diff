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
    const diffContainer = document.getElementById('test-romans');
    if (diffContainer) {
        diffContainer.innerHTML = book[chapter];
    }
}
function updateBook(book) {
    const chapterSelect = document.getElementById('nav-ctrl-chapter');
    chapterSelect.innerHTML = '';
    for (let i = 0; i < book.length; i++) {
        const option = document.createElement('option');
        option.appendChild(document.createTextNode(String(i + 1)));
        chapterSelect === null || chapterSelect === void 0 ? void 0 : chapterSelect.appendChild(option);
    }
    updateChapter(book, 1);
}
(() => {
    const bibleBook = [];
    for (let i = 0; i < 66; i++) {
        bibleBook.push(null);
    }
    populateBookSelect();
    const bookSelect = document.getElementById('nav-ctrl-book');
    const chapterSelect = document.getElementById('nav-ctrl-chapter');
    const navBookSubmit = document.getElementById('nav-ctrl-book-submit');
    const navChapterSubmit = document.getElementById('nav-ctrl-chapter-submit');
    navBookSubmit === null || navBookSubmit === void 0 ? void 0 : navBookSubmit.addEventListener('click', () => {
        const bookRef = bookSelect.value;
        const jsonFilename = bookRef + '.json';
        const bookInMemory = bibleBook[Number(bookRef)];
        if (bookInMemory === null) {
            console.log(`bibleBook array at item ${bookRef} is null. Will download the relevant JSON file, store in bibleBook array, and update diffContainer.`);
            fetchJson(jsonFilename).then((book) => {
                updateBook(book);
                bibleBook[Number(bookRef)] = book;
            });
        }
        else {
            console.log(`bibleBook array at item ${bookRef} is NOT null so we already have it in memory. Will update diffContainer.`);
            updateBook(bookInMemory);
        }
    });
    navChapterSubmit === null || navChapterSubmit === void 0 ? void 0 : navChapterSubmit.addEventListener('click', () => {
        const chapter = Number(chapterSelect.value);
        const bookRef = Number(bookSelect.value);
        const book = bibleBook[bookRef];
        if (book === null) {
            alert('Could not find that chapter - make sure you have pressed the Open Book button first');
        }
        else {
            console.log(`Chapter: ${chapter}, bookRef: ${bookRef}`);
            console.log('book.length: ' + book.length);
            updateChapter(book, chapter);
        }
    });
})();
