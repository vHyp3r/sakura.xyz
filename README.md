
# sakura.xyz 🌸

Welcome to sakura.xyz, we also go by sakura.dev or sakura.dll is a Minecraft utility menu that strives to create availability  along with reliability for all users. This app can suit all your needs, eg: Texture Packs, Mods, Cheat / Utility Clients etc.



![Logo](https://files.catbox.moe/qlfian.png)


## Features

- Custom Themes w.i.p
- ability to inject dll / apk files within the app
- webproxy setup 
- Cross platform


## Acknowledgements

 - [Awesome Readme Templates](https://awesomeopensource.com/project/elangosundar/awesome-README-templates)
 - [Awesome README](https://github.com/matiassingers/awesome-readme)
 - [How to write a Good readme](https://bulldogjob.com/news/449-how-to-write-a-good-readme-for-your-github-project)


## Badges


[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)
[![GPLv3 License](https://img.shields.io/badge/License-GPL%20v3-yellow.svg)](https://opensource.org/licenses/)
[![AGPL License](https://img.shields.io/badge/license-AGPL-blue.svg)](http://www.gnu.org/licenses/agpl-3.0)

--------------------------------------------------------------------------------------------------------------


# Sakura.xyz

Sakura is an open-source Minecraft utility designed to enhance gameplay for both Minecraft Bedrock and Minecraft Java editions.

## Key Features & Benefits

*   **Cross-Platform Compatibility:** Works seamlessly with both Minecraft Bedrock and Java editions.
*   **Open-Source:** Community-driven development, ensuring transparency and continuous improvement.
*   **Customizable:** Offers various configuration options to tailor the utility to individual preferences.
*   **Enhanced Gameplay:** Provides tools and features to improve the overall Minecraft experience.

## Prerequisites & Dependencies

Before installing and running Sakura, ensure you have the following installed:

*   **Node.js:** Version 16 or higher.  Download from [nodejs.org](https://nodejs.org/).
*   **npm (Node Package Manager):**  Usually comes with Node.js.
*   **Git (Git Bash): Download from [git-scm.com](https://git-scm.com/install/windows)**
## Installation & Setup Instructions

Follow these steps to set up Sakura:

1.  **Clone the Repository:**

    ```bash
    git clone https://github.com/vHyp3r/sakura.xyz.git
    cd sakura.xyz
    ```

2.  **Install Dependencies:**

    ```bash
    npm install
    ```

3.  **Configure Firebase:**

    Sakura requires Firebase for authentication and other features.  To enable these features, you need to configure Firebase:

    *   Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com/).
    *   Enable the necessary Firebase services (e.g., Authentication).
    *   Go to **Project Settings > General > Your apps > SDK setup and configuration** to find your credentials.
    *   Copy `.env.example` to `.env.local` and fill in your Firebase project credentials:

    ```bash
    cp .env.example .env.local
    ```

    Then edit `.env.local` with your actual values:

    ```
    REACT_APP_FIREBASE_API_KEY=your_api_key_here
    REACT_APP_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
    REACT_APP_FIREBASE_PROJECT_ID=your_project_id
    REACT_APP_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
    REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
    REACT_APP_FIREBASE_APP_ID=your_app_id
    ```

    > **Note:** If these variables are not set, the app will log a descriptive error in the browser console and Firebase authentication will be unavailable.

    **For GitHub Actions CI/CD:** Add the same variables as repository secrets (`REACT_APP_FIREBASE_API_KEY`, etc.) in **Settings > Secrets and variables > Actions**.

4.  **Start the Application:**

    ```bash
    npm start
    ```

    This will start the development server, and you can access the application in your browser at `http://localhost:3000`.

## Usage Examples & API Documentation

This project is a React application bootstrapped with Create React App. It includes basic example components and layouts. Refer to the React documentation for further usage details: [react.dev](https://react.dev/)

### Available Scripts

In the project directory, you can run:

#### `npm start`

Runs the app in the development mode.
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.
Please note that running multiple dev servers requires killing the previous ones for better performance 

The page will reload when you make changes.
You may also see any lint errors in the console.

#### `npm test`

Launches the test runner in the interactive watch mode.
See the section about [running tests](https://create-react-app.dev/docs/running-tests/) for more information.

#### `npm run build`

Builds the app for production to the `build` folder.
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.
Your app is ready to be deployed!

See the section about [deployment](https://create-react-app.dev/docs/deployment/) for more information.

## Configuration Options

The application can be configured through environment variables or directly within the source code.  Key configuration points include:

*   **Firebase Configuration:**  As described in the "Installation & Setup Instructions," Firebase configuration is crucial for utilizing Firebase services.
*   **API Endpoints:**  If Sakura integrates with external APIs, ensure the API endpoints are correctly configured.  These are typically defined as environment variables.

## Contributing Guidelines

We welcome contributions to Sakura!  To contribute, please follow these steps:

1.  **Fork the Repository:**  Fork the `sakura.xyz` repository to your GitHub account.
2.  **Create a Branch:**  Create a new branch for your feature or bug fix.
3.  **Implement Your Changes:**  Make your changes, ensuring they adhere to the project's coding style and guidelines.
4.  **Test Your Changes:**  Thoroughly test your changes to ensure they function correctly.
5.  **Submit a Pull Request:**  Submit a pull request to the `main` branch of the `sakura.xyz` repository.  Include a detailed description of your changes and the rationale behind them.

## License Information

This project is licensed under the [GNU General Public License v3.0](LICENSE).

## Acknowledgments

This project uses [Create React App](https://github.com/facebook/create-react-app).
