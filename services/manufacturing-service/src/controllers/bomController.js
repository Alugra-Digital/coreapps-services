import * as bomService from '../services/bomService.js';

export const createBOM = async (req, res) => {
    try {
        const bom = await bomService.createBOM(req.body);
        res.status(201).json(bom);
    } catch (error) {
        res.status(500).json({ message: error.message, code: 'ERROR' });
    }
};

export const getBOMTree = async (req, res) => {
    try {
        const { id } = req.params;
        const tree = await bomService.getBOMTree(parseInt(id));
        res.json(tree);
    } catch (error) {
        res.status(404).json({ message: error.message, code: 'NOT_FOUND' });
    }
};
