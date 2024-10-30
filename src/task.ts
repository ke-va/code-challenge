import fs from 'fs-extra';
import path from 'path';
import axios from 'axios';
import crypto from 'crypto';
import parse from 'node-html-parser';

// * Load environment variables
const IM_SECRET = process.env.IM_SECRET || '';
const URL_REGEX = /https?:\/\/[^\s]+/g;

export type ResultType = {
    url: string;
    title?: string;
    email?: string;
};

// Utility functions

/**
 * Computes a SHA-256 hash of the given data using a secret.
 */
export function sha256(data: string): string {
    return crypto.createHmac('sha256', IM_SECRET).update(data).digest('hex');
}

/**
 * Extracts the last valid URL from a string using regex.
 */
export function extractLastUrl(text: string): string | null {
    const matches = text.match(URL_REGEX);
    return matches ? matches[matches.length - 1] : null;
}

// File Parsing Functions

/**
 * Parses a file to extract URLs within valid bracketed sections.
 */
export function parseFile(filePath: string): string[] | undefined {
    const absolutePath = path.resolve(filePath);
    let content: string;

    try {
        content = fs.readFileSync(absolutePath, 'utf8');
    } catch (error) {
        console.error(`Error reading file: ${error}`);
        return;
    }

    const results: string[] = [];
    let insideBrackets = false;
    let escapeNextChar = false;
    let bracketContent = '';
    let openBracketCount = 0;

    for (const char of content) {
        if (escapeNextChar) {
            bracketContent += char;
            escapeNextChar = false;
        } else if (char === '\\') {
            escapeNextChar = true;
        } else if (char === '[') {
            insideBrackets ? openBracketCount++ : (insideBrackets = true, bracketContent = '', openBracketCount = 1);
        } else if (char === ']' && insideBrackets) {
            openBracketCount--;
            if (openBracketCount === 0) {
                insideBrackets = false;
                const lastUrl = extractLastUrl(bracketContent);
                if (lastUrl) results.push(lastUrl);
            }
        } else if (insideBrackets) {
            bracketContent += char;
        }
    }

    return results;
}

/**
 * Fetches and logs the page title and hashed email from the URL content.
 */
export async function fetchPageContent(url: string): Promise<void> {
    let res: ResultType = {
        url: ''
    }
    try {
        const { data } = await axios.get(url);
        const result = parse(data);
        const pageTitle = result.getElementsByTagName('title')[0]?.text || '';
        const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/;
        const firstEmail = (result.text.match(emailRegex) || [])[0];

        // Set default values for url and title
        res.url = url;
        res.title = pageTitle || '';

        if (firstEmail) {
            // Set email only if firstEmail exists
            res.email = sha256(firstEmail);
        }

        console.log(res);
    } catch (error) {
        console.error('Error fetching the page:', error);
    }
}

// Main Entry Point

async function main() {
    const filePath = process.argv[2];

    try {
        let content

        if (filePath) {
            // Read from the file if a path is provided
            const absolutePath = path.resolve(__dirname, filePath);
            try {
                const content = parseFile(absolutePath);
                if (content) {
                    for (const url of content) {
                        await fetchPageContent(url);
                        await new Promise(resolve => setTimeout(resolve, 1000));
                    }
                }
            } catch (error) {
                console.error(`Error reading file: ${error}`);
                process.exit(1);
            }
        } else {
            // Read from stdin if no file path is provided
            content = await new Promise<string>(() => {
                process.stdin.on('data', data => {
                    fetchPageContent(data + '')
                })
            });

            if (content) {
                for (const url of content) {
                    await fetchPageContent(url);
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }
        }

        if (!content) {
            return
        }

        const urls = parseFile(content);
        console.log('urls', urls)

        if (urls) {
            for (const url of urls) {
                await fetchPageContent(url);
                await new Promise(resolve => setTimeout(resolve, 1000)); // Delay of 1 second between requests
            }
        }

    } catch (err) {
        console.error(`Error: ${err}`);
        process.exit(1);
    }
}

if (require.main === module) {
    main().catch(err => {
        console.error('Error in main function:', err);
        process.exit(1);
    });
}
