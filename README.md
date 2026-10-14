# Mini File Manager

A small file manager built with Node.js, HTML, CSS, and browser JavaScript. It lets you create, view, update, and delete files stored in the app's `data` directory. The page also displays basic system information from the machine running the server.

## Requirements

- Node.js 18 or later
- No third-party packages are required

## Run locally

1. Open a terminal in this project directory.
2. Start the server:

   ```powershell
   node server.js
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.
4. Stop the server with `Ctrl+C` in the terminal.

The server creates the `data` directory if it does not already exist. Files you create in the app are stored there.

## Features

- Create and update files
- List files with their sizes and last-modified dates
- Open and delete files
- View basic server machine information, including platform, memory, CPU core count, and uptime

## API

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/files` | List files |
| `GET` | `/api/files/:filename` | Read a file |
| `POST` | `/api/files` | Create or update a file |
| `DELETE` | `/api/files/:filename` | Delete a file |
| `GET` | `/api/system` | Get server system information |

To create or update a file, send JSON to `POST /api/files`:

```json
{
  "filename": "notes.txt",
  "content": "Remember to save this."
}
```

## Project structure

```text
.
├── data/          # Files managed by the app; created automatically
├── public/
│   ├── app.js     # Browser-side behavior
│   ├── index.html # App page
│   └── style.css  # Styles
└── server.js      # Node.js HTTP server and API
```

## Security note

This is a small local/demo app, not a hardened public file hosting service. It has no authentication or authorization, and its API can create, read, and delete files. Keep it on a trusted machine/network and do not expose it to the public internet without adding appropriate security controls. The `/api/system` endpoint also reveals information about the server machine.
