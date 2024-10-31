import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

describe('Script Integration Test', () => {
    const testFilePath = path.resolve(__dirname, 'testFile.txt');
    const testUrl = 'http://example.com';

    beforeAll(() => {
        // Create a temporary file with URLs inside brackets
        const fileContent = `[${testUrl}] [Another text]`;
        fs.writeFileSync(testFilePath, fileContent, 'utf8');
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
