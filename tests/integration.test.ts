import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { sha256 } from '../src/task';

const execPromise = promisify(exec);

describe('Script Integration Test', () => {
    const testFilePath = path.resolve(__dirname, 'testFile.txt');
    const testUrl = 'http://example.com';
    const mockHtmlContent = `
        <html>
            <head><title>Test Page</title></head>
            <body>Contact us at test@example.com</body>
        </html>
    `;

    beforeAll(() => {
        // Create a temporary file with URLs inside brackets
        const fileContent = `[${testUrl}] [Another text]`;
        fs.writeFileSync(testFilePath, fileContent, 'utf8');

        // Mock axios to return a predefined HTML response
        jest.mock('axios', () => ({
            get: jest.fn(() => Promise.resolve({ data: mockHtmlContent }))
        }));
    });

    afterAll(() => {
        // Clean up: Remove the temporary test file and reset mock
        fs.unlinkSync(testFilePath);
        jest.resetModules();
    });

    it('should process URLs in the file and output the correct data', async () => {
        const { stdout } = await execPromise(`ts-node src/task.ts ${testFilePath}`);
        console.log('stdout', stdout)

        expect(stdout).toContain('title')
        expect(stdout).toContain('url')
        expect(stdout).not.toContain('email')
    });
});
