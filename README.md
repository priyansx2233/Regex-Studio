# Regex Studio

<div align="center">

<img src="./regex-ui/public/logo.png" alt="Regex Studio" width="120"/>

### Modern Regex Testing & Debugging Platform

Build, test, debug, and analyze Regular Expressions with real-time matching, capture groups, pattern history, and an interactive reference guide.

[Features](#features) • [Installation](#installation) • [Usage](#usage) • [Architecture](#architecture) • [Contributing](#contributing)

</div>

---

## Overview

Regex Studio is a full-stack web application designed to simplify working with Regular Expressions.

Whether you're validating form inputs, extracting data, parsing logs, or learning regex concepts, Regex Studio provides a clean and interactive environment with instant feedback and detailed pattern analysis.

---

## Features

### Real-Time Regex Testing

* Live pattern matching
* Instant result updates
* Fast regex evaluation

### Regex Flags Support

Supports common regex modifiers:

| Flag | Description         |
| ---- | ------------------- |
| `g`  | Global search       |
| `i`  | Case-insensitive    |
| `m`  | Multiline mode      |
| `s`  | Dot matches newline |

### Match Analytics

* Total matches found
* Character count
* Execution time tracking

### Capture Groups

* Group visualization
* Capture analysis
* Pattern debugging support

### History Tracking

* Automatically saves tested expressions
* Quickly revisit previous patterns

### Presets Library

* Common validation patterns
* Frequently used regex templates

### Quick Reference Panel

Built-in regex cheatsheet including:

* Character classes
* Quantifiers
* Anchors
* Groups
* Alternation
* Special characters

### Modern UI

* Dark theme
* Responsive layout
* Developer-focused workflow

---

## Screenshots

### Main Workspace

> Add screenshots inside `/screenshots`

```text
screenshots/
├── home.png
├── history.png
├── groups.png
└── presets.png
```

---

## Tech Stack

### Frontend

* React
* Vite
* JavaScript (ES6+)
* Tailwind CSS

### Backend

* Node.js
* Express.js

### Deployment

* Vercel

---

## Architecture

```text
regex-server/
│
├── config/
├── controllers/
├── middleware/
├── routes/
│   └── regex.js
├── services/
│
├── regex-ui/
│   ├── public/
│   ├── src/
│   ├── dist/
│   ├── package.json
│   └── vite.config.js
│
├── server.js
├── vercel.json
├── package.json
└── README.md
```

### Frontend Responsibilities

* Regex editor
* Test string editor
* Match visualization
* Statistics dashboard
* History management
* Presets management

### Backend Responsibilities

* Regex validation
* Match processing
* Statistics generation
* Pattern analysis services

---

## Installation

### Clone Repository

```bash
git clone https://github.com/priyansx2233/Regex-Studio.git
cd Regex-Studio
```

### Install Backend Dependencies

```bash
npm install
```

### Install Frontend Dependencies

```bash
cd regex-ui
npm install
```

---

## Running Locally

### Start Backend

```bash
npm run dev
```

### Start Frontend

```bash
cd regex-ui
npm run dev
```

Frontend:

```text
http://localhost:5173
```

Backend:

```text
http://localhost:5000
```

---

## Example

### Pattern

```regex
\d{3}-\d{4}
```

### Input

```text
Call: 555-1234
Office: 321-9876
```

### Matches

```text
555-1234
321-9876
```

---

## Roadmap

* [ ] AI Regex Generator
* [ ] Regex Explanation Engine
* [ ] Export Results
* [ ] Shareable Regex Links
* [ ] Saved Workspaces
* [ ] Multiple Regex Engines
* [ ] Advanced Match Highlighting

---

## Contributing

Contributions are welcome.

```bash
git checkout -b feature/new-feature
git commit -m "Add new feature"
git push origin feature/new-feature
```

Open a Pull Request describing your changes.

---

## License

Licensed under the MIT License.

---

## Author

**Priyanshu Jha**

GitHub: https://github.com/priyansx2233

---

<div align="center">

Built for developers who work with Regular Expressions every day.

</div>
