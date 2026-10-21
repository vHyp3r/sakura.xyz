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
    if (file) result.innerHTML = `<div class="success-message">${file.name} selected (${(file.size / 1024 / 1024).toFixed(1)} MB)</div>`;
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
    result.innerHTML = '<div class="success-message">Converting pack…</div>';
    const formData = new FormData();
    formData.append('pack', file);
    formData.append('targetVersion', targetVersion.value);
    fetch('/api/conversion', { method: 'POST', body: formData })
        .then(async (response) => {
            if (!response.ok) {
                const body = await response.text();
                let message = 'Conversion failed.';
                try {
                    message = JSON.parse(body).error || message;
                } catch (_) {
                    if (body.trim()) message = body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 180);
                }
                throw new Error(message);
            }
            const blob = await response.blob();
            const disposition = response.headers.get('Content-Disposition') || '';
            const match = disposition.match(/filename="([^"]+)"/i);
            const downloadName = match ? match[1] : `${file.name}.converted`;
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = downloadName;
            link.click();
            URL.revokeObjectURL(link.href);
            result.innerHTML = `<div class="success-message">${downloadName} is ready and the download has started.</div>`;
        })
        .catch((error) => {
            result.innerHTML = `<div class="error-message">${error.message}</div>`;
        });
});
