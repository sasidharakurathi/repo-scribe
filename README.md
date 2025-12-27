# ✨ Repo-Scribe: The AI Commit Assistant with Memory

> **Stop writing generic commit messages.**  
> Repo-Scribe uses Google gemma-3-27b + RAG (Retrieval-Augmented Generation) to write context-aware, professional commit messages directly inside VS Code.

![License](https://img.shields.io/badge/license-MIT-blue.svg)  
![Version](https://img.shields.io/badge/version-0.0.1-green.svg)  

---

## 🚀 Why Repo-Scribe?

Unlike other AI commit tools that just look at your code diff, **Repo-Scribe reads your project documentation first.**

- **🧠 It Has Memory:** It learns your coding conventions, rules, and style from your `docs/` folder.  
- **⚡ Lightweight:** Runs entirely in VS Code (TypeScript). **No Python**, no Docker, no heavy databases required.  
- **🔍 Smart Context:** Uses "Smart Batching" to handle massive files without crashing.  
- **🔒 Secure:** Your code is sent only to the official Google Gemini API. No third-party servers.  

---

## 📦 Installation

### Option 1: Install from VSIX (Recommended)

1. Download the latest `.vsix` release from the [Releases page](https://github.com/sasidharakurathi/repo-scribe/releases).  
2. Open VS Code Extensions (`Ctrl+Shift+X` or `Cmd+Shift+X` on Mac).  
3. Click the **... (Three Dots)** menu > **Install from VSIX...**  
4. Select the downloaded `.vsix` file.  

### Option 2: Run from Source

```bash
git clone https://github.com/sasidharakurathi/repo-scribe.git
cd repo-scribe
npm install
code .
```

Then press `F5` to launch the extension in a new VS Code window.

---

## ⚙️ Configuration

### 1. Set Your Gemini API Key

1. Get a free API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Open VS Code Settings (`Ctrl+,` or `Cmd+,`)
3. Search for **Repo-Scribe**
4. Enter your API key in the `Repo-Scribe: Gemini API Key` field

### 2. Configure Documentation Path (Optional)

By default, Repo-Scribe looks for documentation in the `docs/` folder at your project root. You can customize this:

- **Setting:** `repo-scribe.docsPath`
- **Default:** `docs/`
- **Example:** `documentation/`, `wiki/`, etc.

---

## 🎯 Usage

### Generate a Commit Message

1. Make changes to your code and stage them in Git
2. Open the Source Control panel (`Ctrl+Shift+G`)
3. Click the **✨ Generate Commit Message** button in the Source Control toolbar
4. Repo-Scribe will analyze your changes and documentation, then generate a professional commit message

### Manual Command

You can also run the command directly:

1. Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
2. Type **"Repo-Scribe: Generate Commit Message"**
3. Press Enter

---

## 🧠 How It Works

Repo-Scribe uses a three-step process:

1. **📖 Documentation Indexing:** Scans your `docs/` folder to understand your project's conventions, style guides, and coding standards
2. **🔍 Diff Analysis:** Examines your staged Git changes to understand what was modified
3. **✍️ AI Generation:** Sends the context to Google gemma-3-27b, which generates a professional, context-aware commit message

### Smart Batching

Large files are automatically chunked to stay within API limits, ensuring reliable performance even on massive codebases.

---

## 🛠️ Features

- ✅ **Context-Aware Messages:** Understands your project's unique conventions
- ✅ **Fast & Lightweight:** Pure TypeScript, no heavy dependencies
- ✅ **Privacy-Focused:** Only sends data to official Google Gemini API
- ✅ **Smart File Handling:** Automatically handles large diffs
- ✅ **Configurable:** Customize documentation paths and behavior
- ✅ **Works Offline (for indexing):** Documentation is indexed locally

---

## 📝 Example Output

### Before Repo-Scribe
```
Update files
```

### After Repo-Scribe
```
feat(auth): implement JWT token refresh mechanism

- Add refreshToken endpoint to auth controller
- Implement token rotation strategy per security guidelines
- Add unit tests for token expiration scenarios
- Update API documentation in docs/api/authentication.md

Follows the authentication patterns documented in docs/security/auth-standards.md
```

---

## 🤝 Contributing

Contributions are welcome! Here's how to get started:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- Powered by [Google gemma-3-27b](https://deepmind.google/technologies/gemini/)
- Built with [VS Code Extension API](https://code.visualstudio.com/api)
- Inspired by the need for better, context-aware developer tools

---

## 📞 Support

- 🐛 [Report a Bug](https://github.com/sasidharakurathi/repo-scribe/issues)
- 💡 [Request a Feature](https://github.com/sasidharakurathi/repo-scribe/issues)
- 📧 Email: your.email@example.com

---

**Made with ❤️ by Sasidhar Akurathi, for developers**