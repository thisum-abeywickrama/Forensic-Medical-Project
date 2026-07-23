import AutopsyModel from "../models/AutopsyModel.js";

export const saveAutopsyForm = async (req, res) => {
    try {
        const form = req.body;
        const { articlesSecured, ...autopsyData } = form;

        if (!form.id || !form.patientId) {
            return res.status(400).json({ message: "Autopsy ID and Patient ID are required" });
        }

        const existing = await AutopsyModel.getAutopsyById(form.id);
        let resultId;

        if (existing) {
            resultId = await AutopsyModel.updateAutopsyForm(form.id, autopsyData, articlesSecured);
        } else {
            const data = {
                ...autopsyData,
                createdBy: req.user ? req.user.id : autopsyData.createdBy
            };
            resultId = await AutopsyModel.createAutopsyForm(data, articlesSecured);
        }

        const savedForm = await AutopsyModel.getAutopsyById(resultId);
        res.status(200).json(savedForm);
    } catch (error) {
        console.error("Save autopsy form error:", error);
        res.status(500).json({ message: "Server error saving autopsy form" });
    }
};

export const getAutopsyById = async (req, res) => {
    try {
        const form = await AutopsyModel.getAutopsyById(req.params.id);
        if (!form) return res.status(404).json({ message: "Autopsy form not found" });
        res.status(200).json(form);
    } catch (error) {
        console.error("Fetch autopsy form by ID error:", error);
        res.status(500).json({ message: "Server error fetching autopsy form" });
    }
};

export const getAllAutopsyForms = async (req, res) => {
    try {
        const forms = await AutopsyModel.getAllAutopsyForms();
        res.status(200).json(forms);
    } catch (error) {
        console.error("Fetch autopsy forms error:", error);
        res.status(500).json({ message: "Server error fetching autopsy forms" });
    }
};
