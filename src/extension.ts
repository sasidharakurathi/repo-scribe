import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { GoogleGenerativeAI } from '@google/generative-ai';

// --- CONFIGURATION --
const CHAT_MODEL_ID = "gemma-3-27b-it";
const EMBED_MODEL_ID = "text-embedding-004";

// --- TYPES FOR OUR MINI-DATABASE ---
interface VectorRecord {
    filePath: string;
    text: string;
    vector: number[];
}

function cosineSimilarity(vecA: number[], vecB: number[]): number {
    let dot = 0.0;
    let normA = 0.0;
    let normB = 0.0;
    for (let i = 0; i < vecA.length; i++) {
        dot += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

// --- HELPER: GET API KEY ---
async function getApiKey(config: vscode.WorkspaceConfiguration): Promise<string | undefined> {
    let apiKey = config.get<string>('apiKey');
    if (!apiKey) {
        apiKey = await vscode.window.showInputBox({ 
            prompt: "Enter Google Gemini API Key", 
            password: true 
        });
        if (apiKey) {
            await config.update('apiKey', apiKey, vscode.ConfigurationTarget.Global);
        }
    }
    return apiKey;
}

export function activate(context: vscode.ExtensionContext) {
    console.log('✨ Repo-Scribe Lite is active!');

    let ingestDisposable = vscode.commands.registerCommand('repo-scribe.reindex', async () => {
        const config = vscode.workspace.getConfiguration('repoScribe');
        const apiKey = await getApiKey(config);
        if (!apiKey) return;

        const workspaceRoot = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
        if (!workspaceRoot) {
            vscode.window.showErrorMessage("Please open a folder first.");
            return;
        }

        const docsFolder = config.get<string>('docsFolder') || 'docs';
        const docsPath = path.join(workspaceRoot, docsFolder);
        
        if (!fs.existsSync(docsPath)) {
            vscode.window.showErrorMessage(`Docs folder not found: ${docsFolder}`);
            return;
        }

        vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "🧠 Learning Documentation (Cloud)...",
            cancellable: false
        }, async (progress) => {
            try {
                const genAI = new GoogleGenerativeAI(apiKey);
                const model = genAI.getGenerativeModel({ model: EMBED_MODEL_ID });

                // Read All Markdown Files
                const records: VectorRecord[] = [];
                const files = fs.readdirSync(docsPath).filter(f => f.endsWith('.md'));
                
                if (files.length === 0) {
                    vscode.window.showWarningMessage("No Markdown files found in docs folder.");
                    return;
                }

                // Process Files & Embed
                for (const file of files) {
                    progress.report({ message: `Reading ${file}...` });
                    const content = fs.readFileSync(path.join(docsPath, file), 'utf-8');
                    
                    // Simple Chunking (Split by paragraphs to keep it light)
                    const chunks = content.split('\n\n').filter(c => c.length > 50);

                    for (const chunk of chunks) {
                        const result = await model.embedContent(chunk);
                        const vector = result.embedding.values;
                        
                        records.push({
                            filePath: file,
                            text: chunk,
                            vector: vector
                        });
                    }
                }

                // Save to JSON (Our "Lite" Database)
                const dbPath = path.join(workspaceRoot, '.vscode', 'repo-scribe-memory.json');
                if (!fs.existsSync(path.dirname(dbPath))) fs.mkdirSync(path.dirname(dbPath));
                
                fs.writeFileSync(dbPath, JSON.stringify(records, null, 2));
                
                vscode.window.showInformationMessage(`✅ Learned ${records.length} knowledge chunks!`);

            } catch (e: any) {
                vscode.window.showErrorMessage(`Ingest Failed: ${e.message}`);
                console.error(e);
            }
        });
    });

    let generateDisposable = vscode.commands.registerCommand('repo-scribe.generate', async () => {
        const config = vscode.workspace.getConfiguration('repoScribe');
        const apiKey = await getApiKey(config);
        if (!apiKey) return;

        // Git Setup
        const gitExtension = vscode.extensions.getExtension('vscode.git');
        if (!gitExtension) return;
        const git = gitExtension.exports.getAPI(1);
        const repo = git.repositories[0];
        if (!repo) {
            vscode.window.showErrorMessage("No Git repo open.");
            return;
        }

        // Get Diff
        const diff = await repo.diff(true);
        if (!diff || diff.trim().length === 0) {
            vscode.window.showWarningMessage("No staged changes.");
            return;
        }

        let docContext = "";
        const workspaceRoot = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
        
        if (workspaceRoot) {
            const dbPath = path.join(workspaceRoot, '.vscode', 'repo-scribe-memory.json');
            
            if (fs.existsSync(dbPath)) {
                vscode.window.setStatusBarMessage("🧠 Searching Memory...", 2000);
                try {
                    // Load DB
                    const records: VectorRecord[] = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
                    
                    // Embed the Query
                    const genAI = new GoogleGenerativeAI(apiKey);
                    const model = genAI.getGenerativeModel({ model: EMBED_MODEL_ID });
                    
                    const queryText = "Project commit rules, coding standards, and conventions. Context: " + diff.substring(0, 500);
                    
                    const result = await model.embedContent(queryText);
                    const queryVector = result.embedding.values;

                    // Vector Search
                    const relevantDocs = records
                        .map(record => ({ 
                            ...record, 
                            score: cosineSimilarity(queryVector, record.vector) 
                        }))
                        .sort((a, b) => b.score - a.score) // Sort best matches first
                        .slice(0, 3); // Take top 3

                    console.log("Top Match Score:", relevantDocs[0]?.score);
                    console.log("Top Match Text:", relevantDocs[0]?.text);


                    if (relevantDocs.length > 0 && relevantDocs[0].score > 0.35) {
                        docContext = relevantDocs.map(d => d.text).join("\n---\n");
                        vscode.window.showInformationMessage("📘 RAG Context Found & Applied!");
                    } else {
                        console.log("RAG Match found but score too low:", relevantDocs[0]?.score);
                    }
                } catch (e) {
                    console.error("RAG Retrieval Error:", e);
                }
            } else {
                console.log("No memory file found at:", dbPath);
            }
        }

        const prompt = `
            Role: Tech Lead. Task: Git commit message.
            
            --- PROJECT RULES ---
            ${docContext}
            ---------------------

            Code Changes:
            ${diff.substring(0, 100000)}

            Format: <type>(<scope>): <summary>
            - Bullet points.
        `;

        vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Repo-Scribe: Thinking...",
        }, async () => {
            try {
                const genAI = new GoogleGenerativeAI(apiKey);
                const model = genAI.getGenerativeModel({ model: CHAT_MODEL_ID });
                
                const result = await model.generateContent(prompt);
                const commitMsg = result.response.text().trim();
                
                repo.inputBox.value = commitMsg;
                vscode.window.showInformationMessage("✅ Commit Generated!");
            } catch (e: any) {
                vscode.window.showErrorMessage(`AI Error: ${e.message}`);
            }
        });
    });

    context.subscriptions.push(generateDisposable);
    context.subscriptions.push(ingestDisposable);
}

export function deactivate() {}