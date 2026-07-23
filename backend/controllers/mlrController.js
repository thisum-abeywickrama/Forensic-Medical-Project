import MlrModel from "../models/MlrModel.js";

export const saveMlrReport = async (req, res) => {
    try {
        const report = req.body;
        const { injuries, grievousEntries, ...mlrData } = report;

        if (!report.id || !report.patientId) {
            return res.status(400).json({ message: "Report ID and Patient ID are required" });
        }

        if (!Array.isArray(injuries)) {
            return res.status(400).json({ message: "Injuries must be provided as a list" });
        }

        const incompleteInjury = injuries.some(injury =>
            !injury || !injury.no || !injury.description
        );
        if (incompleteInjury) {
            return res.status(400).json({
                message: "Each injury must include both an injury number and description"
            });
        }

        const existing = await MlrModel.getMlrById(report.id);
        let resultId;

        if (existing) {
            resultId = await MlrModel.updateMlrReport(report.id, mlrData, injuries, grievousEntries);
        } else {
            const data = {
                ...mlrData,
                createdBy: req.user ? req.user.id : mlrData.createdBy
            };
            resultId = await MlrModel.createMlrReport(data, injuries, grievousEntries);
        }

        const savedReport = await MlrModel.getMlrById(resultId);
        res.status(200).json(savedReport);
    } catch (error) {
        console.error("Save MLR error:", error);
        res.status(500).json({ message: "Server error saving MLR report" });
    }
};

export const getMlrById = async (req, res) => {
    try {
        const report = await MlrModel.getMlrById(req.params.id);
        if (!report) return res.status(404).json({ message: "MLR report not found" });
        res.status(200).json(report);
    } catch (error) {
        console.error("Fetch MLR by ID error:", error);
        res.status(500).json({ message: "Server error fetching MLR report" });
    }
};

export const getAllMlrReports = async (req, res) => {
    try {
        const reports = await MlrModel.getAllMlrReports();
        res.status(200).json(reports);
    } catch (error) {
        console.error("Fetch MLR reports error:", error);
        res.status(500).json({ message: "Server error fetching MLR reports" });
    }
};
