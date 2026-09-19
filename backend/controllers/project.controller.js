import { ProjectAnalyzerService } from '../services/analyzer/projectAnalyzer.service.js';
import { ContextService } from '../services/context/context.service.js';

export const analyzeProject = async (req, res) => {
    try {
        // Use path from query, or default to current backend directory up one level
        const projectPath = req.query.path || process.cwd() + '/../'; 
        
        const analysis = await ProjectAnalyzerService.analyzeProject(projectPath);
        
        res.json({
            success: true,
            data: analysis
        });
    } catch (error) {
        console.error('Analyze Project Error:', error);
        res.status(500).json({ success: false, message: 'Failed to analyze project', error: error.message });
    }
};

export const getContext = async (req, res) => {
    try {
        const { prompt, path } = req.body;
        
        if (!prompt) {
            return res.status(400).json({ success: false, message: "Prompt is required" });
        }

        const projectPath = path || process.cwd() + '/../';
        
        // We need the tree to search against
        const analysis = await ProjectAnalyzerService.analyzeProject(projectPath);
        
        const relevantFiles = ContextService.getContextFiles(prompt, analysis.tree);

        res.json({
            success: true,
            prompt,
            relevantFiles
        });

    } catch (error) {
        console.error('Get Context Error:', error);
        res.status(500).json({ success: false, message: 'Failed to get context', error: error.message });
    }
};
