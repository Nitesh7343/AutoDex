# AutoDex

AutoDex is a browser extension that saves your application details in one profile and helps fill repetitive forms. It works locally in your browser, including on Google Forms.

## Downloads

Download the latest release for your browser:

- [Chrome (ZIP)](https://github.com/YOUR_GITHUB_USERNAME/AutoDex/releases/latest/download/autodex-0.1.0-chrome.zip)
- [Microsoft Edge (ZIP)](https://github.com/YOUR_GITHUB_USERNAME/AutoDex/releases/latest/download/autodex-0.1.0-edge.zip)
- [All releases](https://github.com/YOUR_GITHUB_USERNAME/AutoDex/releases)

> Replace `YOUR_GITHUB_USERNAME` in these links with your GitHub username. The download links will work after you create a GitHub Release and upload the matching ZIP files. See [Publishing a release](#publishing-a-release).

## Features

- Save personal details, contact information, location, education, experience, skills, and application answers in one profile.
- Keep useful links to GitHub, LinkedIn, LeetCode, projects, and documents. Add as many custom links as you need and copy a link from the popup.
- Fill recognized empty form fields with one click, including supported Google Forms questions.
- Import and export your profile as a JSON backup.
- Store profile data in your browser's local extension storage. AutoDex does not send your profile to an AutoDex server.

AutoDex skips password and file-upload fields and preserves answers that are already filled in. It fills fields only when it can identify them with reasonable confidence. Dropdowns, checkboxes, and radio buttons are selected only when an option exactly matches a saved answer. Always review your answers before submitting. Google Forms file uploads must be completed directly in Google Forms.

## Install from a release

Chrome and Edge install unpacked extensions from a folder:

1. Download the browser ZIP above and extract it.
2. Open `chrome://extensions` in Chrome or `edge://extensions` in Edge.
3. Turn on **Developer mode**.
4. Click **Load unpacked** and select the extracted folder containing `manifest.json`.
5. Pin AutoDex from the browser's extensions menu for quick access.

## Use AutoDex

1. Click the AutoDex toolbar icon.
2. Open **Profile** to add your personal, education, experience, and skill details. Add important profile or document links as needed.
3. Open the **Fill form** section while viewing a form and choose **Fill form**.
4. Review every answer on the page and make any corrections before submitting it yourself.

Use the links section in the popup to open or copy a saved profile/document link. Use **Export** to save a JSON backup, or **Import** to restore one.

## Build from source

Requirements: Node.js and npm.

```sh
git clone https://github.com/YOUR_GITHUB_USERNAME/AutoDex.git
cd AutoDex
npm install
npm run typecheck
npm run build
```

Then open `chrome://extensions`, enable **Developer mode**, choose **Load unpacked**, and select the generated `.output/chrome-mv3` folder. For Microsoft Edge, build with `npm run build -- --browser edge` and load `.output/edge-mv3` from `edge://extensions`.

To create ZIP packages:

```sh
npm run zip
npm run zip -- -b edge
```

The packages are written to `.output/autodex-0.1.0-chrome.zip` and `.output/autodex-0.1.0-edge.zip`.

## Publishing a release

1. Push this project to a GitHub repository named `AutoDex` (or update the links above if you choose a different name).
2. Build both ZIPs using the commands above.
3. On GitHub, open the repository's **Releases** page and choose **Draft a new release**.
4. Create a version tag such as `v0.1.0`, then attach `autodex-0.1.0-chrome.zip` and `autodex-0.1.0-edge.zip` from `.output`.
5. Publish the release. The download links at the top will then point to those files.

## Development

```sh
npm install
npm run dev
```

Use the development build while working on the extension. For normal use, load a production build or release ZIP; the development server does not need to stay running.

## Tech stack

WXT, React, TypeScript, and the browser extension storage API.
