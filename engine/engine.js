class ValEngine {
    constructor() {
        this.voidElements = new Set(['img', 'input', 'br', 'hr', 'meta', 'link', 'source']);
    }

    render(code) {
        const root = document.createElement('div');
        root.className = 'valos-app-root';
        root.style.cssText = 'width: 100%; height: 100%; box-sizing: border-box; display: flex; flex-direction: column; gap: 12px;';

        const regex = /\{\{\s*(\/?[a-zA-Z0-9-]+)([\s\S]*?)\}\}/g;
        let match;
        const stack = [root];

        while ((match = regex.exec(code)) !== null) {
            const tagName = match[1].trim().toLowerCase();
            const rawArgs = match[2];

            if (tagName.startsWith('/')) {
                if (stack.length > 1) stack.pop();
                continue;
            }

            const element = document.createElement(tagName);

            if (rawArgs) {
                rawArgs.split('\n').forEach(line => {
                    const trimmed = line.trim();
                    if (trimmed.startsWith('|')) {
                        const sep = trimmed.indexOf('=');
                        if (sep !== -1) {
                            const key = trimmed.substring(1, sep).trim().toLowerCase();
                            const val = trimmed.substring(sep + 1).trim();

                            if (key === 'content') element.textContent = val;
                            else element.setAttribute(key, val);
                        }
                    }
                });
            }

            const parent = stack[stack.length - 1];
            parent.appendChild(element);

            if (!this.voidElements.has(tagName)) {
                stack.push(element);
            }
        }
        return root;
    }

    async loadApp(filePath, target) {
        const container = typeof target === 'string' ? document.querySelector(target) : target;
        try {
            const res = await fetch(filePath);
            if (!res.ok) throw new Error(`Erreur HTTP ${res.status}`);
            const text = await res.text();
            container.innerHTML = '';
            container.appendChild(this.render(text));
        } catch (err) {
            container.innerHTML = `<div style="color: #ef4444; padding: 20px;">Erreur de chargement du fichier .txt</div>`;
        }
    }
}
window.ValEngine = new ValEngine();
