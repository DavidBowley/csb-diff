"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
function fetchJson() {
    // Returns a promise that resolves to a JSON object
    return fetch("./data/test45.json")
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
function updateDiff(book, chapter) {
    chapter -= 1;
    const diffContainer = document.getElementById('test-romans');
    if (diffContainer) {
        diffContainer.innerHTML = book[chapter];
    }
}
(() => __awaiter(void 0, void 0, void 0, function* () {
    let testRomans;
    try {
        testRomans = yield fetchJson();
    }
    catch (error) {
        throw new Error(`Error: ${error.message}`);
    }
    console.log(testRomans.length);
    updateDiff(testRomans, 1);
    const chapterSelect = document.getElementById('nav-ctrl-chapter');
    for (let i = 0; i < testRomans.length; i++) {
        const option = document.createElement('option');
        option.appendChild(document.createTextNode(String(i + 1)));
        chapterSelect === null || chapterSelect === void 0 ? void 0 : chapterSelect.appendChild(option);
    }
    chapterSelect === null || chapterSelect === void 0 ? void 0 : chapterSelect.addEventListener('change', (e) => {
        const fetchChapter = Number(e.target.value);
        updateDiff(testRomans, fetchChapter);
    });
}))();
