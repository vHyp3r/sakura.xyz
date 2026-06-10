# TexturePack.xyz (sakura.xyz)

A Minecraft Bedrock texture pack gallery website inspired by [texturepack.be](https://texturepack.be/).

## Features

- Browse and search texture packs
- View recently uploaded packs
- Discover popular packs by category
- Upload your own texture packs (.mcpack files)
- Random pack discovery
- Responsive design for mobile and desktop
- Package download functionality

## Technology Stack

- **Backend**: Node.js with Express.js
- **Frontend**: HTML/CSS/JavaScript with EJS templating
- **File Uploads**: Multer middleware
- **Database**: Mongoose/MongoDB (planned for future implementation)
- **Styling**: Custom CSS with responsive design

## Project Structure

```
texturepack.xyz/
├── public/
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   └── main.js
│   ├── images/
│   │   ├── default-thumbnail.png
│   │   └── default-avatar.png
│   └── uploads/          (Uploaded files stored here)
├── views/
│   ├── index.ejs
│   ├── upload.ejs
│   ├── upload-success.ejs
│   ├── error.ejs
│   ├── packs/
│   │   ├── index.ejs
│   │   └── detail.ejs
│   ├── search/
│   │   └── results.ejs
│   └── discover/
│       └── index.ejs
├── routes/
│   ├── index.js
│   ├── packs.js
│   ├── upload.js
│   ├── search.js
│   ├── discover.js
│   └── random.js
├── server.js
├── package.json
└── README.md
```

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the server:
   ```bash
   npm start
   ```
4. Visit `http://localhost:3000` in your browser

## Development

For development with auto-restart:
```bash
npm run dev
```

## Features to Implement

- [x] Basic website structure
- [x] Home page with navigation
- [x] Texture pack browsing
- [x] Individual pack detail pages
- [x] File upload functionality
- [x] Search functionality
- [x] Discover/popular packs page
- [x] Random pack redirect
- [ ] Actual database integration (MongoDB)
- [ ] User authentication/accounts
- [ ] Pack rating and commenting system
- [ ] Discord bot integration for Java-to-Bedrock conversion
- [ ] Advanced search filters
- [ ] Pagination for large result sets
- [ ] Pack categorization and tagging system

## API Endpoints

- `GET /` - Home page
- `GET /packs` - List all texture packs
- `GET /packs/:id` - View specific texture pack
- `GET /packs/:id/download` - Download texture pack file
- `GET /upload` - Upload form
- `POST /upload` - Handle file upload
- `GET /search` - Search texture packs
- `GET /discover` - Discover popular packs
- `GET /random` - Redirect to random pack

## File Uploads

Uploaded texture packs (.mcpack files) are stored in the `public/uploads/` directory. The application accepts files up to 50MB in size.

## License

This project is licensed under the ISC License.

## Acknowledgments

- Inspired by [texturepack.be](https://texturepack.be/)
- Built with Node.js and Express.js
