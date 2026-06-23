import MlefModel from "../models/MlefModel.js";

export const saveMlefForm = async (req, res) => {
    try {
        const form = req.body;
        if (!form.id || !form.patientId) {
            return res.status(400).json({ message: "Form ID and Patient ID are required" });
        }

        const existing = await MlefModel.getMlefById(form.id);
        let result;

        if (existing) {
            result = await MlefModel.updateMlefForm(form.id, form);
        } else {
            const data = {
                ...form,
                createdBy: req.user ? req.user.id : form.createdBy
            };
            result = await MlefModel.createMlefForm(data);
        }

        res.status(200).json(result);
    } catch (error) {
        console.error("Save MLEF error:", error);
        res.status(500).json({ message: "Server error saving MLEF form" });
    }
};

export const getMlefById = async (req, res) => {
    try {
        const form = await MlefModel.getMlefById(req.params.id);
        if (!form) return res.status(404).json({ message: "MLEF form not found" });
        res.status(200).json(form);
    } catch (error) {
        console.error("Fetch MLEF by ID error:", error);
        res.status(500).json({ message: "Server error fetching MLEF form" });
    }
};

export const getAllMlefForms = async (req, res) => {
    try {
        const forms = await MlefModel.getAllMlefForms();
        res.status(200).json(forms);
    } catch (error) {
        console.error("Fetch MLEF forms error:", error);
        res.status(500).json({ message: "Server error fetching MLEF forms" });
    }
};
