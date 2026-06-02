import { useState } from "react";
import { useData } from "../data";
import { useToast } from "../toast";
import { Button, Field, Modal } from "../ui";
import { IconAlert } from "./icons";

const FORM_ID = "create-person-form";

export function CreatePersonModal({
  kind,
  onClose,
}: {
  kind: "reporter" | "editor";
  onClose: () => void;
}) {
  const { createReporter, createEditor } = useData();
  const toast = useToast();
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [fee, setFee] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const isReporter = kind === "reporter";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) return setError("Name is required.");

    if (isReporter) {
      if (!city.trim()) return setError("City is required.");
    } else {
      const f = Number(fee);
      if (!Number.isFinite(f) || f <= 0)
        return setError("Flat fee must be a number greater than 0.");
    }

    setBusy(true);
    try {
      if (isReporter) {
        await createReporter({ name: name.trim(), city: city.trim() });
        toast.success("Reporter added");
      } else {
        await createEditor({ name: name.trim(), flat_fee: Number(fee) });
        toast.success("Editor added");
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      title={isReporter ? "Add reporter" : "Add editor"}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" form={FORM_ID} loading={busy}>
            {isReporter ? "Add reporter" : "Add editor"}
          </Button>
        </>
      }
    >
      <form id={FORM_ID} onSubmit={submit}>
        {error && (
          <div className="form-error" style={{ marginBottom: 15 }}>
            <IconAlert size={16} />
            {error}
          </div>
        )}

        <Field label="Full name" required htmlFor="person_name">
          <input
            id="person_name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={isReporter ? "e.g. Dewi Lestari" : "e.g. Rina Hapsari"}
            autoFocus
          />
        </Field>

        {isReporter ? (
          <Field
            label="City"
            required
            htmlFor="person_city"
            hint="Used to match reporters to in-person jobs."
          >
            <input
              id="person_city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g. Jakarta"
            />
          </Field>
        ) : (
          <Field
            label="Flat fee per job (IDR)"
            required
            htmlFor="person_fee"
            hint="Charged once per job the editor reviews."
          >
            <input
              id="person_fee"
              type="number"
              min={1}
              inputMode="numeric"
              value={fee}
              onChange={(e) => setFee(e.target.value)}
              placeholder="60000"
            />
          </Field>
        )}
      </form>
    </Modal>
  );
}
