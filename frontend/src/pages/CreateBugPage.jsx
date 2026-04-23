import { useNavigate } from "react-router-dom";
import BugForm from "../components/BugForm";
import { createBug } from "../services/bugService";

export default function CreateBugPage() {
  const navigate = useNavigate();

  const onSubmit = async (payload) => {
    const created = await createBug(payload);
    navigate(`/bugs/${created.data.id}`);
  };

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Create Bug</h1>
      <BugForm onSubmit={onSubmit} submitLabel="Create Bug" />
    </section>
  );
}
