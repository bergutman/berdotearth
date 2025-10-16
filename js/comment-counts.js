document.addEventListener('DOMContentLoaded', () => {
    const commentCountElements = document.querySelectorAll('.comment-count');
    if (commentCountElements.length === 0) return;

    const url = 'https://corsproxy.io/?https://docs.google.com/spreadsheets/d/e/2PACX-1vQ_tHMdbJbaRy6bD4zUJ4ktu0WCKvjOiJ62_U2XwFQp6I2uwPLpYlLyG08UVAllCd1ePSQcuctD-r1s/pub?gid=495620982&single=true&output=csv';

    fetch(url)
        .then(response => response.text())
        .then(data => {
            const commentCounts = {};
            const rows = data.split('\n').slice(1);

            rows.forEach(row => {
                const columns = row.split(',');
                if (columns.length > 1) {
                    const postId = columns[1];
                    if (postId) {
                        commentCounts[postId] = (commentCounts[postId] || 0) + 1;
                    }
                }
            });

            commentCountElements.forEach(element => {
                const postId = element.dataset.postId;
                const count = commentCounts[postId] || 0;
                element.textContent = `${count} comments`;
            });
        })
        .catch(error => {
            console.error('Error fetching comment counts:', error);
            commentCountElements.forEach(element => {
                element.textContent = 'N/A';
            });
        });
});
