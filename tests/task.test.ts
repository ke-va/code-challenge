import fs from 'fs-extra';
import axios from 'axios';
import crypto from 'crypto';
import { extractLastUrl, fetchPageContent, parseFile, sha256 } from '../src/task';

jest.mock('fs-extra');
jest.mock('axios');

// Mock Environment Variables
process.env.IM_SECRET = 'test-secret';

describe('Utility Functions', () => {
    describe('sha256', () => {
        it('should return the correct SHA-256 hash of the given data', () => {
            const data = 'test-data';
            const expectedHash = crypto.createHmac('sha256', process.env.IM_SECRET + '').update(data).digest('hex');
            console.log('expectedHash', expectedHash)
            console.log(sha256(data))
            expect(sha256(data)).toEqual(expectedHash);
        });
    });

    describe('extractLastUrl', () => {
        it('should extract the last URL from a string', () => {
            const text = 'This is a test with multiple URLs http://example.com and http://test.com';
            expect(extractLastUrl(text)).toEqual('http://test.com');
        });

        it('should return null if no URL is present', () => {
            const text = 'This is a test with no URLs';
            expect(extractLastUrl(text)).toBeNull();
        });
    });
});

describe('File Parsing Functions', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('parseFile', () => {
        it('should parse file and return URLs in valid brackets', () => {
            const mockFilePath = 'test-file.txt';
            const fileContent = '[http://example.com] some text [http://test.com]';
            (fs.readFileSync as jest.Mock).mockReturnValue(fileContent);

            const result = parseFile(mockFilePath);
            expect(result).toEqual(['http://example.com', 'http://test.com']);
        });

        it('should return undefined if file reading fails', () => {
            const mockFilePath = 'invalid-file.txt';
            (fs.readFileSync as jest.Mock).mockImplementation(() => {
                throw new Error('File read error');
            });

            const result = parseFile(mockFilePath);
            expect(result).toBeUndefined();
        });
    });
});

describe('URL Processing Functions', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // describe('retryRequest', () => {
    //     it('should retry fetching the URL after a delay if the first attempt fails', async () => {
    //         jest.useFakeTimers();
    //         const mockUrl = 'http://example.com';
    //         const retrySpy = jest.spyOn(global, 'setTimeout');
    //         (axios.get as jest.Mock).mockRejectedValueOnce(new Error('Network error')).mockResolvedValue({ data: '<html><title>Retry Test</title></html>' });

    //         await retryRequest(mockUrl);

    //         expect(retrySpy).toHaveBeenCalledWith(expect.any(Function), 60000);
    //         jest.runAllTimers();

    //         expect(axios.get).toHaveBeenCalledWith(mockUrl);
    //     });
    // });

    describe('fetchPageContent', () => {
        it('should log page title and hashed email if present', async () => {
            const mockUrl = 'http://example.com';
            const mockTitle = 'Test Page';
            const mockEmail = 'test@example.com';
            const mockHtml = `<html><title>${mockTitle}</title><body>Email: ${mockEmail}</body></html>`;
            (axios.get as jest.Mock).mockResolvedValue({ data: mockHtml });

            console.log = jest.fn();
            await fetchPageContent(mockUrl);

            expect(console.log).toHaveBeenCalledWith({
                url: mockUrl,
                title: mockTitle,
                email: sha256(mockEmail),
            });
        });

        it('should log an error message if page fetch fails', async () => {
            const mockUrl = 'http://example.com';
            (axios.get as jest.Mock).mockRejectedValue(new Error('Network error'));

            console.error = jest.fn();
            await fetchPageContent(mockUrl);

            expect(console.error).toHaveBeenCalledWith('Error fetching the page:', expect.any(Error));
        });
    });
});


// // import { parseFile, parseUrls } from '../src/parseFile';
// import fs from 'fs-extra';
// import path from 'path';
// import { parseFile } from '../src/task';

// jest.mock('fs-extra');

// describe('parseFile', () => {
//   it('should read a file and extract URLs within brackets', () => {
//     const testContent = '[https://example.com] some text [http://another.com]';
//     const filePath = 'test.txt';
//     (fs.readFileSync as jest.Mock).mockReturnValue(testContent);

//     const result = parseFile(filePath);
//     expect(result).toEqual(['https://example.com', 'http://another.com']);
//   });

//   it('should handle empty files gracefully', () => {
//     (fs.readFileSync as jest.Mock).mockReturnValue('');
//     const result = parseFile('empty.txt');
//     expect(result).toEqual([]);
//   });
// });
