import PatientModel from "../models/PatientModel.js";

export const registerPatient = async (req, res) => {
    try {
        const { id, name, dob, sex, address, nic, email, phone } = req.body;

        if (!id || !name || !dob || !sex || !address || !nic || !email || !phone) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const registeredBy = req.user ? req.user.name : "System";
        const registeredAt = new Date().toISOString();

        const newPatient = await PatientModel.createPatient({
            id, name, dob, sex, address, nic, email, phone, registeredBy, registeredAt
        });

        res.status(201).json(newPatient);
    } catch (error) {
        console.error("Patient registration error:", error);
        res.status(500).json({ message: "Server error during patient registration" });
    }
};

export const getAllPatients = async (req, res) => {
    try {
        const patients = await PatientModel.getAllPatients();
        res.status(200).json(patients);
    } catch (error) {
        console.error("Fetch patients error:", error);
        res.status(500).json({ message: "Server error fetching patients" });
    }
};
