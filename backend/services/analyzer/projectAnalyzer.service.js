import fs from 'fs';
import path from 'path';

const IGNORED_DIRS = ['node_modules', 'dist', 'build', '.git', '.next', 'coverage'];
const IMPORTANT_FILES = [
    'package.json', 'README.md', 'tsconfig.json', 'docker-compose.yml', 'Dockerfile', '.env.example'
];

export class ProjectAnalyzerService {
    
    static async analyzeProject(projectPath) {
        if (!fs.existsSync(projectPath)) {
            throw new Error(`Project path does not exist: ${projectPath}`);
        }

        const stats = {
            totalFiles: 0,
            totalFolders: 0,
            projectSizeBytes: 0
        };

        const tree = this.buildTree(projectPath, stats);
        
        const importantFilesFound = this.findImportantFiles(tree, projectPath);
        
        let dependencies = {};
        let frameworks = [];
        
        if (importantFilesFound['package.json']) {
            const pkgData = this.parsePackageJson(importantFilesFound['package.json']);
            dependencies = pkgData.deps;
            frameworks = this.detectFrameworks(pkgData.raw, importantFilesFound);
        }

        return {
            path: projectPath,
            statistics: {
                totalFiles: stats.totalFiles,
                totalFolders: stats.totalFolders,
                projectSizeMB: (stats.projectSizeBytes / (1024 * 1024)).toFixed(2)
            },
            frameworks: frameworks,
            dependencies: dependencies,
            importantFiles: importantFilesFound,
            tree: tree
        };
    }

    static buildTree(currentPath, stats) {
        const result = {
            name: path.basename(currentPath),
            type: 'folder',
            path: currentPath,
            children: []
        };

        let items;
        try {
            items = fs.readdirSync(currentPath);
        } catch (error) {
            return result; // Permission denied or similar
        }

        for (const item of items) {
            if (IGNORED_DIRS.includes(item)) continue;

            const fullPath = path.join(currentPath, item);
            try {
                const itemStat = fs.statSync(fullPath);

                if (itemStat.isDirectory()) {
                    stats.totalFolders++;
                    result.children.push(this.buildTree(fullPath, stats));
                } else {
                    stats.totalFiles++;
                    stats.projectSizeBytes += itemStat.size;
                    result.children.push({
                        name: item,
                        type: 'file',
                        path: fullPath,
                        size: itemStat.size
                    });
                }
            } catch (error) {
                console.warn(`Could not read stat for: ${fullPath}`);
            }
        }
        return result;
    }

    static findImportantFiles(tree, rootPath) {
        const foundFiles = {};
        
        const searchTree = (node) => {
            if (node.type === 'file') {
                if (IMPORTANT_FILES.includes(node.name) || 
                    node.name.startsWith('vite.config.') || 
                    node.name.startsWith('next.config.') || 
                    node.name.startsWith('tailwind.config.')) {
                    
                    if (!foundFiles[node.name]) {
                        foundFiles[node.name] = node.path;
                    }
                }
            } else if (node.children) {
                node.children.forEach(searchTree);
            }
        };

        searchTree(tree);
        return foundFiles;
    }

    static parsePackageJson(packagePath) {
        try {
            const content = fs.readFileSync(packagePath, 'utf-8');
            const pkg = JSON.parse(content);
            return {
                raw: pkg,
                deps: {
                    dependencies: pkg.dependencies || {},
                    devDependencies: pkg.devDependencies || {},
                    scripts: pkg.scripts || {}
                }
            };
        } catch (error) {
            return { raw: {}, deps: {} };
        }
    }

    static detectFrameworks(pkg, importantFiles) {
        const frameworks = [];
        const allDeps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };

        if (allDeps['react']) frameworks.push('React');
        if (allDeps['next'] || importantFiles['next.config.js'] || importantFiles['next.config.mjs']) frameworks.push('Next.js');
        if (allDeps['express']) frameworks.push('Express');
        if (allDeps['vite'] || Object.keys(importantFiles).some(k => k.startsWith('vite.config.'))) frameworks.push('Vite');
        if (allDeps['@nestjs/core']) frameworks.push('NestJS');
        if (allDeps['tailwindcss'] || Object.keys(importantFiles).some(k => k.startsWith('tailwind.config.'))) frameworks.push('TailwindCSS');
        
        frameworks.push('Node.js'); // Assuming Node environment since we analyze package.json

        return [...new Set(frameworks)]; // Remove duplicates
    }
}
