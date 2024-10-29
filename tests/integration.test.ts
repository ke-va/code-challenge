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
        // const result = JSON.parse(stdout)
        console.log(stdout)
        console.log(typeof stdout)
        
        expect(stdout).toEqual(`{
  url: '${testUrl}',
  title: 'Example Domain',
  email: 'e38826b7f11f333e7b1ab156ef09b9b77bc11ff4cd5456a6e3965a5ec3baafa6'
  }`)
        // expect(stdout).toEqual({
        //     url: expect.any(String),
        //     title: expect.any(String),
        //     email: expect.any(String),
        //     // Every other check you need ...
        //   });
        // Check that the output contains the processed data
        // expect(stdout).toContain(testUrl);  // Check that the URL was processed
        // expect(JSON.parse(stdout)).toHaveProperty('url', testUrl);
        // expect(stdout).toContain(sha256('test@example.com'));  // Check the hashed email
    });
});
