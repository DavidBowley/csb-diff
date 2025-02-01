"use strict";
function fetchJson() {
    fetch("./data/test45.json")
        .then((response) => {
        if (!response.ok) {
            throw new Error(`HTTP error, status = ${response.status}`);
        }
        return response.json();
    })
        .then((data) => { debugInsertDiff(data); })
        .catch((error) => {
        throw new Error(`Error: ${error.message}`);
    });
}
function debugInsertDiff(book) {
    const diffContainer = document.getElementById('test-romans');
    const dFrag = document.createDocumentFragment();
    for (const chapter of book) {
        const wrapper = document.createElement('div');
        wrapper.innerHTML = '<div>' + chapter + '</div>';
        if (wrapper.firstChild) {
            dFrag.append(wrapper.firstChild);
        }
    }
    console.log(dFrag);
    diffContainer === null || diffContainer === void 0 ? void 0 : diffContainer.appendChild(dFrag);
}
fetchJson();
