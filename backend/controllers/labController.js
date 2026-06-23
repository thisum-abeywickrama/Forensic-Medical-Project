import LabModel from "../models/LabModel.js";

export const createLabRequest = async (req, res) => {
    try {
        const labData = req.body;
        if (!labData.id || !labData.patientId) {
            return res.status(400).json({ message: "Lab ID and Patient ID are required" });
        }

        const data = {
            ...labData,
            requestedBy: req.user ? req.user.id : labData.requestedBy,
            requestedByName: req.user ? req.user.name : labData.requestedByName
        };

        const result = await LabModel.createLabRequest(data);
        res.status(201).json(result);
    } catch (error) {
        console.error("Create Lab Request error:", error);
        res.status(500).json({ message: "Server error creating lab request" });
    }
};

export const updateLabRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const updated = await LabModel.updateLabRequest(id, updateData);
        if (!updated) return res.status(404).json({ message: "Lab request not found" });

        res.status(200).json(updated);
    } catch (error) {
        console.error("Update Lab Request error:", error);
        res.status(500).json({ message: "Server error updating lab request" });
    }
};

export const getAllLabRequests = async (req, res) => {
    try {
        const requests = await LabModel.getAllLabRequests();
        res.status(200).json(requests);
    } catch (error) {
        console.error("Fetch Lab Requests error:", error);
        res.status(500).json({ message: "Server error fetching lab requests" });
    }
};

export const getLabRequestById = async (req, res) => {
    try {
        const request = await LabModel.getLabRequestById(req.params.id);
        if (!request) return res.status(404).json({ message: "Lab request not found" });
        res.status(200).json(request);
    } catch (error) {
        console.error("Fetch Lab Request by ID error:", error);
        res.status(500).json({ message: "Server error fetching lab request" });
    }
};
