const fileForm = document.getElementById('fileForm');
const message = document.getElementById('message');
const fileList = document.getElementById('fileList');
const refreshButton = document.getElementById('refreshButton');
const systemInfo = document.getElementById('systemInfo');
const filenameInput = document.getElementById('filename');
const contentInput = document.getElementById('content');

let editingFile = null;

fileForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const filename = filenameInput.value.trim();
    const content = contentInput.value;

    if (!filename) {
        showMessage('Please enter a file name.', true);
        return;
    }

    const response = await fetch('/api/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename, content })
    });

    const data = await response.json();
    showMessage(data.message || data.error, !response.ok);

    if (response.ok) {
        fileForm.reset();
        editingFile = null;
        loadFiles();
        loadSystemInfo();
    }
});

refreshButton.addEventListener('click', () => {
    loadFiles();
    loadSystemInfo();
});

async function loadFiles() {
    const response = await fetch('/api/files');
    const files = await response.json();

    if (!response.ok) {
        fileList.innerHTML = '<li class="empty">Unable to load files.</li>';
        return;
    }

    if (!files.length) {
        fileList.innerHTML = '<li class="empty">No files yet.</li>';
        return;
    }

    fileList.innerHTML = '';

    files.forEach((file) => {
        const item = document.createElement('li');
        item.className = 'file-item';

        const info = document.createElement('div');
        info.className = 'file-info';
        info.innerHTML = `
            <strong>${file.name}</strong>
            <span>${formatBytes(file.size)} • ${formatDate(file.modified)}</span>
        `;

        const actions = document.createElement('div');
        actions.className = 'actions';

        const openButton = document.createElement('button');
        openButton.type = 'button';
        openButton.className = 'secondary';
        openButton.textContent = 'Open';
        openButton.addEventListener('click', () => openFile(file.name));

        const deleteButton = document.createElement('button');
        deleteButton.type = 'button';
        deleteButton.className = 'danger';
        deleteButton.textContent = 'Delete';
        deleteButton.addEventListener('click', () => deleteFile(file.name));

        actions.appendChild(openButton);
        actions.appendChild(deleteButton);
        item.appendChild(info);
        item.appendChild(actions);
        fileList.appendChild(item);
    });
}

async function openFile(fileName) {
    const response = await fetch(`/api/files/${encodeURIComponent(fileName)}`);
    const data = await response.json();

    if (!response.ok) {
        showMessage(data.error || 'Could not open file.', true);
        return;
    }

    editingFile = fileName;
    filenameInput.value = data.name;
    contentInput.value = data.content;
    showMessage(`Editing: ${data.name}`);
    filenameInput.focus();
}

async function deleteFile(fileName) {
    const confirmed = window.confirm(`Delete ${fileName}?`);
    if (!confirmed) return;

    const response = await fetch(`/api/files/${encodeURIComponent(fileName)}`, {
        method: 'DELETE'
    });

    const data = await response.json();
    showMessage(data.message || data.error, !response.ok);

    if (response.ok) {
        if (editingFile === fileName) {
            fileForm.reset();
            editingFile = null;
        }
        loadFiles();
    }
}

async function loadSystemInfo() {
    const response = await fetch('/api/system');
    const data = await response.json();

    if (!response.ok) {
        systemInfo.textContent = 'System info unavailable.';
        return;
    }

    systemInfo.innerHTML = `
        <p><strong>Platform:</strong> ${data.platform}</p>
        <p><strong>Architecture:</strong> ${data.arch}</p>
        <p><strong>Total Memory:</strong> ${formatBytes(data.totalMemory)}</p>
        <p><strong>Free Memory:</strong> ${formatBytes(data.freeMemory)}</p>
        <p><strong>CPU Cores:</strong> ${data.cpus}</p>
        <p><strong>Uptime:</strong> ${Math.round(data.uptime)} seconds</p>
    `;
}

function showMessage(text, isError = false) {
    message.textContent = text;
    message.classList.toggle('error', isError);
    message.classList.toggle('success', !isError);
}

function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const units = ['Bytes', 'KB', 'MB', 'GB'];
    const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
    const value = bytes / (1024 ** index);
    return `${value.toFixed(1)} ${units[index]}`;
}

function formatDate(value) {
    const date = new Date(value);
    return date.toLocaleString();
}

loadFiles();
loadSystemInfo();
