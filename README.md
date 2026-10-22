# TexturePack.xyz (sakura.xyz)

A Minecraft Bedrock texture pack gallery website inspired by [texturepack.be](https://texturepack.be/).

## Current project update

The current release focuses on the working Bedrock pack gallery rather than an unfinished Java-to-Bedrock porter. The shipped flows are:

- Browse all packs, popular packs, or a random pack
- Search pack names, descriptions, categories, resolutions, uploaders, and tags
- Upload a `.mcpack` file with optional thumbnail and metadata
- Open pack details and download the original file
- Register, sign in, and manage an account profile
- Review MongoDB data through the authenticated admin dashboard

The Java-to-Bedrock converter and Discord bot are planned features, not part of the current release. They are not presented as working features in the homepage UI.

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
- **Database**: MongoDB for site data and a separate MongoDB cluster for accounts
- **Styling**: Custom CSS with responsive design

## Project Structure

```
texturepack.xyz/
├── css/
│   ├── profile.css
│   └── validate.css
├── html/
│   ├── profile.html
│   └── validate.html
├── js/
│   └── profile.js
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

## Feature status

- [x] Basic website structure
- [x] Home page with navigation
- [x] Texture pack browsing
- [x] Individual pack detail pages
- [x] File upload functionality
- [x] Search functionality
- [x] Discover/popular packs page
- [x] Random pack redirect
- [x] MongoDB integration for packs, accounts, and the admin dashboard
- [x] User authentication/accounts
- [ ] Pack rating and commenting system
- [ ] Java-to-Bedrock conversion
- [ ] Discord bot integration
- [ ] Advanced search filters
- [ ] Pagination for large result sets
- [ ] Pack categorization and tagging system

## API Endpoints

- `POST /api/account/register` - Create an account
- `POST /api/account/login` - Sign in
- `GET /api/account/me` - Read the signed-in account
- `POST /api/account/logout` - Sign out
- `GET /api/ranks/donation-info` - Read configured donation addresses
- `POST /api/ranks/donations` - Create a donation request while signed in
- `GET /api/ranks/donations/:id` - Read the signed-in user's donation status
- `POST /api/ranks/donations/webhook` - Verify a signed wallet watcher event and issue a Donator key
- `GET /api/shop/catalog` - Read the active, automatically rotated custom shop items
- `GET /api/admin/shop/items` - List custom shop items
- `POST /api/admin/shop/items` - Create a custom shop item
- `PATCH /api/admin/shop/items/:id` - Update a custom shop item
- `DELETE /api/admin/shop/items/:id` - Delete a custom shop item

### Shop rotation

Administrators can open **Admin → Shop rotation** to create custom shop items.
Each item has a rotation period and slot count. Active items are deterministically
shuffled using the current Eastern Time period, so the same selection is shown to
everyone during that period and changes automatically at the next daily, weekly,
monthly, or seasonal boundary. Permanent items remain available. The built-in rank
items remain available alongside custom items.

- `GET /` - Home page
- `GET /packs` - List all texture packs
- `GET /packs/:id` - View specific texture pack
- `GET /packs/:id/download` - Download texture pack file
- `GET /upload` - Upload form
- `POST /upload` - Handle file upload
- `GET /search` - Search texture packs
- `GET /discover` - Discover popular packs
- `GET /random` - Redirect to random pack

### Wallet donation webhook

Configure the wallet addresses and `DONATION_WEBHOOK_SECRET` in `.env` using
the variables documented in `.env.example`. A wallet watcher must first create
a donation request through `/api/ranks/donations`, then send a signed JSON
event to `/api/ranks/donations/webhook`:

```json
{
  "id": "donation-request-id",
  "currency": "USDT",
  "destinationAddress": "configured Ethereum USDT address",
  "amountUsd": 1.25,
  "transactionId": "blockchain-transaction-id",
  "confirmations": 12
}
```

The watcher signs `${timestamp}.${JSON.stringify(body)}` with HMAC-SHA256
using `DONATION_WEBHOOK_SECRET`, then sends the hex digest in
`x-donation-signature` and the Unix timestamp in `x-donation-timestamp`.
USDT is interpreted as an Ethereum payment. The endpoint checks the configured
destination, minimum amount, confirmations, and transaction replay before
issuing a one-time Donator key.

## Account database

The account database is `accountInfo`, a separate database inside the existing MongoDB cluster. The app reuses `MONGODB_URI` and selects `accountInfo` automatically. Set `ACCOUNTINFO_DB_NAME` only if the database has a different name. Account data is stored in an `accounts` collection.

## File Uploads

Uploaded texture packs (.mcpack files) are stored in the `public/uploads/` directory. The application accepts files up to 50MB in size.

## License

This project is licensed under the ISC License.

## Acknowledgments

- Inspired by [texturepack.be](https://texturepack.be/)
- Built with Node.js and Express.js

## Goals

Create a discord bot to handle in-server requests.
Add support members to help with support tickets and requests
Revamp the old rating system to be up to date
Continue working on fixing errors ie: "Dashboard"
Create a texture porter