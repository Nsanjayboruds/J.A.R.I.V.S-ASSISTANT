import fs from 'fs';
import path from 'path';

export class ContextService {
    /**
     * Extracts relevant files based on user prompt.
     * Future versions will use Semantic Search / Vector Embeddings.
     * Current MVP uses simple keyword matching against file names.
     */
    static getContextFiles(prompt, projectTree) {
        if (!prompt || !projectTree) return [];

        const keywords = this.extractKeywords(prompt);
        if (keywords.length === 0) return [];

        const relevantFiles = [];
        this.searchTreeForKeywords(projectTree, keywords, relevantFiles);

        // Sort by match count (descending) and return top 10
        relevantFiles.sort((a, b) => b.score - a.score);
        return relevantFiles.slice(0, 10).map(item => ({
            name: item.node.name,
            path: item.node.path,
            matchScore: item.score
        }));
    }

    static extractKeywords(prompt) {
        // Very basic NLP processing: lowercase, remove special chars, filter small words
        const cleaned = prompt.toLowerCase().replace(/[^a-z0-9\s]/g, '');
        const words = cleaned.split(/\s+/);
        const stopWords = ['a', 'an', 'the', 'is', 'in', 'to', 'for', 'of', 'and', 'with', 'fix', 'add', 'create', 'update', 'delete', 'make'];
        
        return words.filter(word => word.length > 2 && !stopWords.includes(word));
    }

    static searchTreeForKeywords(node, keywords, results) {
        if (node.type === 'file') {
            const fileName = node.name.toLowerCase();
            let score = 0;
            
            for (const keyword of keywords) {
                if (fileName.includes(keyword)) {
                    score += 1;
                }
            }

            if (score > 0) {
                results.push({ node, score });
            }
        } else if (node.children) {
            for (const child of node.children) {
                this.searchTreeForKeywords(child, keywords, results);
            }
        }
    }
}
