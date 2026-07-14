import { useState } from "react";
import { useNavigate } from "react-router";
import { Save, User } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { PageHeader } from "@/components/ui/PageHeader";
import { Btn } from "@/components/ui/Btn";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { FormField } from "@/components/ui/FormField";
import { genId, cls } from "@/lib/utils";
import type { Patient } from "@/types";
import { api } from "@/lib/api";
import { toast } from "sonner";

export function PatientRegisterPage() {
  const { currentUser, addPatient } = useApp();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: "", dob: "", sex: "Male", address: "", nic: "", email: "", phone: "" });
  const set = (k: string) => (v: string) => setForm(f => ({ ...f, [k]: v }));

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Image file size should be less than 2MB");
        return;
      }
      setImageFile(file);
      const url = URL.createObjectURL(file);
      setImagePreview(url);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
      setImagePreview("");
    }
  };

  const handleSave = async () => {
    if (!form.name || !form.dob || !form.nic || !form.email || !form.phone || !currentUser) {
      toast.error("Please fill in all required fields.");
      return;
    }
    setIsSubmitting(true);
    let profilePictureUrl = "";
    try {
      if (imageFile) {
        profilePictureUrl = await api.storage.uploadImage(imageFile);
      }
      const dob = new Date(form.dob);
      const age = new Date().getFullYear() - dob.getFullYear();
      const p: Patient = {
        id: genId("P"),
        name: form.name, dob: form.dob, age, sex: form.sex,
        address: form.address, nic: form.nic, email: form.email, phone: form.phone,
        registeredAt: new Date().toISOString(), registeredBy: currentUser.id,
        profilePictureUrl: profilePictureUrl || undefined,
      };
      await addPatient(p);
      navigate("/patients");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to register patient. Profile picture upload might have failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Register New Patient"
        onBack={() => navigate("/patients")}
        actions={
          <>
            <Btn variant="secondary" onClick={() => navigate("/patients")} disabled={isSubmitting}>Cancel</Btn>
            <Btn variant="primary" icon={<Save size={14} />} onClick={handleSave} disabled={isSubmitting}>
              {isSubmitting ? "Registering..." : "Register Patient"}
            </Btn>
          </>
        }
      />
      <div className="bg-card border border-border rounded-xl p-6 max-w-2xl">
        <div className="mb-5 pb-5 border-b border-border">
          <FormField label="Profile Picture">
            <div className="flex items-center gap-4 mt-1">
              <div className="relative group w-20 h-20 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden bg-slate-50 hover:bg-slate-100/80 transition-colors">
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-slate-400 flex flex-col items-center gap-1">
                    <User size={24} />
                    <span className="text-[10px] font-medium">Upload</span>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  disabled={isSubmitting}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={cls(
                  "cursor-pointer bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded px-2.5 py-1 text-xs font-medium inline-block text-center transition-colors",
                  isSubmitting ? "opacity-50 cursor-not-allowed" : ""
                )}>
                  Choose File
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    disabled={isSubmitting}
                  />
                </label>
                {imageFile && (
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    disabled={isSubmitting}
                    className="text-red-500 hover:text-red-700 text-xs font-semibold text-left transition-colors disabled:opacity-50"
                  >
                    Remove Photo
                  </button>
                )}
                <p className="text-[10px] text-slate-400">JPG, PNG or WEBP. Max 2MB.</p>
              </div>
            </div>
          </FormField>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
          <FormField label="Full Name" required><Input value={form.name} onChange={set("name")} placeholder="Full name" /></FormField>
          <FormField label="NIC Number" required><Input value={form.nic} onChange={set("nic")} placeholder="e.g. 901234567V" /></FormField>
          <FormField label="Date of Birth" required><Input type="date" value={form.dob} onChange={set("dob")} /></FormField>
          <FormField label="Sex" required>
            <Select value={form.sex} onChange={set("sex")}
              options={[{ value: "Male", label: "Male" }, { value: "Female", label: "Female" }, { value: "Other", label: "Other" }]} />
          </FormField>
          <FormField label="Email Address" required><Input type="email" value={form.email} onChange={set("email")} placeholder="e.g. patient@example.com" /></FormField>
          <FormField label="Phone Number" required><Input value={form.phone} onChange={set("phone")} placeholder="e.g. 0712345678" /></FormField>
          <FormField label="Address" colSpan="full">
            <Textarea value={form.address} onChange={set("address")} rows={2} placeholder="Full residential address" />
          </FormField>
        </div>
        <p className="text-xs text-slate-400 mt-2">* Required. Patient ID auto-generated on registration.</p>
      </div>
    </div>
  );
}
