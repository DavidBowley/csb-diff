async function fetchJson() {
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

function updateDiff(book: string[], chapter: number) {
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

async function main() {
    const testRomans = await fetchJson();
    updateDiff(testRomans, 1);
    const chapterSelect = document.getElementById('nav-ctrl-chapter');
    chapterSelect?.addEventListener('change', (e) => {
        const fetchChapter = Number((e.target as HTMLSelectElement).value);
        updateDiff(testRomans, fetchChapter);
    })
}


main();

// updateDiff(myArray, 1)


/*




*/
