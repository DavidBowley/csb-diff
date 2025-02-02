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
    return __awaiter(this, void 0, void 0, function* () {
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
    });
}
function updateDiff(book, chapter) {
    chapter -= 1;
    const diffContainer = document.getElementById('test-romans');
    // const dFrag = document.createDocumentFragment();
    if (diffContainer) {
        // For testing purposes: defaults to first chapter for now
        diffContainer.innerHTML = book[chapter];
    }
}
/*
fetchJson().then((json) => {
    updateDiff(json, 1);
    const chapterSelect = document.getElementById('nav-ctrl-chapter');
    chapterSelect?.addEventListener('change', (e) => {
        const fetchChapter = Number((e.target as HTMLSelectElement).value);
        updateDiff(json, fetchChapter);
    })
})

*/
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        const testRomans = yield fetchJson();
        updateDiff(testRomans, 1);
        const chapterSelect = document.getElementById('nav-ctrl-chapter');
        chapterSelect === null || chapterSelect === void 0 ? void 0 : chapterSelect.addEventListener('change', (e) => {
            const fetchChapter = Number(e.target.value);
            updateDiff(testRomans, fetchChapter);
        });
    });
}
main();
// updateDiff(myArray, 1)
/*




*/
