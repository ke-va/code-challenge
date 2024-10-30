import fs from 'fs-extra';
import axios from 'axios';
import crypto from 'crypto';
import { extractLastUrl, fetchPageContent, parseFile, sha256 } from '../src/task';
import 'dotenv/config';

jest.mock('fs-extra');
jest.mock('axios');

const IM_SECRET = process.env.IM_SECRET;

describe('Utility Functions', () => {
    describe('sha256', () => {
        it('should return the correct SHA-256 hash of the given data', () => {
            const data = 'test-data';
            console.log('im secret', IM_SECRET)
            const expectedHash = crypto.createHmac('sha256', IM_SECRET).update(data).digest('hex');
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
