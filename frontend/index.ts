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

function updateDiff(book: string[], chapter: number) {
    chapter -= 1;
    const diffContainer = document.getElementById('test-romans');
    if (diffContainer) {
        diffContainer.innerHTML = book[chapter];
    }    
}

(async () => {
    let testRomans: string[];
    
    try {
        testRomans = await fetchJson();
    }
    catch (error) {
        throw new Error(`Error: ${(error as Error).message}`);
    }

    console.log(testRomans.length);
    
    updateDiff(testRomans, 1);
    const chapterSelect = document.getElementById('nav-ctrl-chapter');
    chapterSelect?.addEventListener('change', (e) => {
        const fetchChapter = Number((e.target as HTMLSelectElement).value);
        updateDiff(testRomans, fetchChapter);
    })
})();