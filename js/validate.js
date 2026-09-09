document.getElementById('packForm').addEventListener('submit', function (event) {
    event.preventDefault();
    const input = document.getElementById('packInput').value;
    const resultDiv = document.getElementById('result');

    if (input.trim() === '') {
        resultDiv.innerHTML = '<div class="error-message">Error: Input cannot be empty.</div>';
    } else {
        resultDiv.innerHTML = '<div class="success-message">Success: Valid input!</div>';
    }
});
