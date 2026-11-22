import { app } from '../server/index.js';
export default function handler(req, res) {
    if (req.url && !req.url.startsWith('/api')) {
        req.url = `/api${req.url}`;
    }
    app(req, res);
}
//# sourceMappingURL=index.js.map