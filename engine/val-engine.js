/**
 * ValEngine v1.0.0
 * Moteur de rendu dynamique pour ValOS
 * Traduit une syntaxe ValCode (.txt inspiré MediaWiki) en DOM HTML pur.
 */

class ValEngine {
    constructor() {
        // Balises HTML auto-fermantes
        this.voidElements = new Set(['img', 'input', 'br', 'hr', 'meta', 'link', 'source']);
    }

    /**
     * Lit une chaîne ValCode et retourne un élément DOM complet.
     * @param {string} code - Le contenu brut du fichier .txt
     * @returns {HTMLElement}
     */
    render(code) {
        const root = document.createElement('div');
        root.className = 'valos-app-root';
        root.style.cssText = 'width: 100%; height: 100%; box-sizing: border-box;';

        // Expression régulière pour capturer {{tag ...}} et {{/tag}}
        const regex = /\{\{\s*(\/?[a-zA-Z0-9-]+)([\s\S]*?)\}\}/g;
        
        let match;
        const stack = [root];

        while ((match = regex.exec(code)) !== null) {
            const tagName = match[1].trim().toLowerCase();
            const rawArgs = match[2];

            // 1. Gestion des balises fermantes : {{/div}}, {{/button}}, etc.
            if (tagName.startsWith('/')) {
                if (stack.length > 1) {
                    stack.pop();
                }
                continue;
            }

            // 2. Création du nœud DOM HTML standard
            const element = document.createElement(tagName);

            // 3. Traitement des arguments (| clé = valeur)
            if (rawArgs) {
                const lines = rawArgs.split('\n');
                lines.forEach(line => {
                    const trimmed = line.trim();
                    if (trimmed.startsWith('|')) {
                        const separatorIndex = trimmed.indexOf('=');
                        if (separatorIndex !== -1) {
                            const key = trimmed.substring(1, separatorIndex).trim().toLowerCase();
                            const value = trimmed.substring(separatorIndex + 1).trim();

                            if (key === 'content') {
                                // Injecte le texte à l'intérieur de la balise
                                element.textContent = value;
                            } else if (key.startsWith('on')) {
                                // Événements JavaScript (onclick, onchange, oninput, etc.)
                                element.setAttribute(key, value);
                            } else {
                                // Attributs HTML/CSS standards (style, class, id, placeholder, type, etc.)
                                element.setAttribute(key, value);
                            }
                        }
                    }
                });
            }

            // 4. Emboîtement dans le DOM parent
            const currentParent = stack[stack.length - 1];
            currentParent.appendChild(element);

            // Si la balise peut contenir des enfants, elle devient le nouveau parent sur la pile
            if (!this.voidElements.has(tagName)) {
                stack.push(element);
            }
        }

        return root;
    }

    /**
     * Charge un fichier .txt distant et l'injecte dans un conteneur cible du DOM.
     * @param {string} filePath - Chemin vers le fichier .txt
     * @param {HTMLElement|string} target - Élément DOM ou sélecteur CSS
     */
    async loadApp(filePath, target) {
        try {
            const response = await fetch(filePath);
            if (!response.ok) throw new Error(`Impossible de charger l'application : ${response.statusText}`);
            const textCode = await response.text();

            const appDOM = this.render(textCode);
            const targetContainer = typeof target === 'string' ? document.querySelector(target) : target;
            
            targetContainer.innerHTML = '';
            targetContainer.appendChild(appDOM);
        } catch (error) {
            console.error('[ValEngine Error]:', error);
        }
    }
}

// Exportation globale pour ValOS
window.ValEngine = new ValEngine();
