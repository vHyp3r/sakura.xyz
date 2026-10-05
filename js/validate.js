const form = document.getElementById('packForm');
const input = document.getElementById('packInput');
const targetVersion = document.getElementById('targetVersion');
const result = document.getElementById('result');

document.querySelectorAll('[data-version]').forEach((button) => {
    button.addEventListener('click', () => {
        targetVersion.value = button.dataset.version;
        document.querySelectorAll('[data-version]').forEach((item) => item.classList.toggle('selected', item === button));
    });
});

input.addEventListener('change', () => {
    const file = input.files[0];
    if (file) result.textContent = `${file.name} selected (${(file.size / 1024 / 1024).toFixed(1)} MB)`;
});

form.addEventListener('submit', (event) => {
    event.preventDefault();
    const file = input.files[0];
    if (!file) {
        result.innerHTML = '<div class="error-message">Choose a .zip or .mcpack file first.</div>';
        return;
    }
    if (!/\.(zip|mcpack)$/i.test(file.name)) {
        result.innerHTML = '<div class="error-message">Only .zip and .mcpack files are supported.</div>';
        return;
    }
    if (file.size > 300 * 1024 * 1024) {
        result.innerHTML = '<div class="error-message">That file is larger than the 300 MB limit.</div>';
        return;
    }
    if (!targetVersion.value) {
        result.innerHTML = '<div class="error-message">Choose a target version.</div>';
        return;
    }
    result.innerHTML = `<div class="success-message">${file.name} is ready for ${targetVersion.value}. Conversion service setup is valid, but no file was uploaded.</div>`;
});
