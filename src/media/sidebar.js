(function () {
    const vscode = acquireVsCodeApi();
    const searchBtn = document.getElementById('search-btn');
    const searchInput = document.getElementById('search-input');

    searchBtn.addEventListener('click', () => {
        const query = searchInput.value.trim();
        if (query) {
            vscode.postMessage({
                type: 'search',
                query: query
            });
        }
    });

    window.addEventListener('message', event => {
        const message = event.data;
        switch (message.type) {
            case 'searchResults':
                renderResults(message.data);
                break;
        }
    });

    function renderResults(repos) {
        const container = document.getElementById('results');
        container.innerHTML = repos.map(repo => `
        <div class="repo-item">
          <h3>${repo.name}</h3>
          <p>⭐ ${repo.stars} | ${repo.description || ''}</p>
          <button onclick="cloneRepo('${repo.clone_url}')">Clone</button>
        </div>
      `).join('');
    }

    window.cloneRepo = function (url) {
        vscode.postMessage({
            type: 'clone',
            url: url
        });
    };
})();