import PmrModel from "../models/PmrModel.js";

export const savePmrReport = async (req, res) => {
    try {
        const report = req.body;
        const { identifiers, ...pmrData } = report;

        if (!report.id || !report.patientId) {
            return res.status(400).json({ message: "PMR ID and Patient ID are required" });
        }

        const existing = await PmrModel.getPmrById(report.id);
        let resultId;

        if (existing) {
            resultId = await PmrModel.updatePmrReport(report.id, pmrData, identifiers);
        } else {
            const data = {
                ...pmrData,
                createdBy: req.user ? req.user.id : pmrData.createdBy
            };
            resultId = await PmrModel.createPmrReport(data, identifiers);
        }

        const savedReport = await PmrModel.getPmrById(resultId);
        res.status(200).json(savedReport);
    } catch (error) {
        console.error("Save PMR error:", error);
        res.status(500).json({ message: "Server error saving PMR report" });
    }
};

export const getPmrById = async (req, res) => {
    try {
        const report = await PmrModel.getPmrById(req.params.id);
        if (!report) return res.status(404).json({ message: "PMR report not found" });
        res.status(200).json(report);
    } catch (error) {
        console.error("Fetch PMR by ID error:", error);
        res.status(500).json({ message: "Server error fetching PMR report" });
    }
};

export const getAllPmrReports = async (req, res) => {
    try {
        const reports = await PmrModel.getAllPmrForms();
        res.status(200).json(reports);
    } catch (error) {
        console.error("Fetch PMR reports error:", error);
        res.status(500).json({ message: "Server error fetching PMR reports" });
    }
};
