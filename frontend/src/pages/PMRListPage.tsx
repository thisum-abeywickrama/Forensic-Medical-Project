import { useNavigate } from "react-router";
import { Clipboard } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { FormList } from "@/components/forms/FormList";

export function PMRListPage() {
  const { currentUser, patients, pmrForms } = useApp();
  const navigate = useNavigate();
  const isJmo = currentUser?.role === "jmo";

  return (
    <FormList
      title="Post-Mortem Reports (PMR)"
      icon={<Clipboard size={18} />}
      items={pmrForms}
      patients={patients}
      onOpen={id => navigate(`/pmr/${id}`)}
      onNew={isJmo ? () => navigate("/pmr/new") : undefined}
      newLabel="New PMR Form"
    />
  );
}
