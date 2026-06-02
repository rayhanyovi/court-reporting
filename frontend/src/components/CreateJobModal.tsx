import { useState } from "react";
import { useData } from "../data";
import { useToast } from "../toast";
import { Button, Field, Modal } from "../ui";
import { IconAlert, IconBuilding, IconVideo } from "./icons";
import type { Location } from "../types";

const FORM_ID = "create-job-form";

export function CreateJobModal({ onClose }: { onClose: () => void }) {
  const { createJob } = useData();
  const toast = useToast();
  const [caseName, setCaseName] = useState("");
  const [duration, setDuration] = useState("");
  const [location, setLocation] = useState<Location>("physical");
  const [city, setCity] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const mins = Number(duration);
    if (!caseName.trim()) return setError("Case name is required.");
    if (!Number.isInteger(mins) || mins <= 0)
      return setError("Duration must be a whole number of minutes greater than 0.");
    if (location === "physical" && !city.trim())
      return setError("City is required for physical (in-person) jobs.");

    setBusy(true);
    try {
      await createJob({
        case_name: caseName.trim(),
        duration_minutes: mins,
        location,
        city: location === "physical" ? city.trim() : undefined,
      });
      toast.success("Job created");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create job");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      title="New job"
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" form={FORM_ID} loading={busy}>
            Create job
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

        <Field label="Case name" required htmlFor="case_name">
          <input
            id="case_name"
            value={caseName}
            onChange={(e) => setCaseName(e.target.value)}
            placeholder="e.g. State v. Hartono — Deposition"
            autoFocus
          />
        </Field>

        <div className="row">
          <Field label="Duration (minutes)" required htmlFor="duration" hint="Used to compute the reporter payout.">
            <input
              id="duration"
              type="number"
              min={1}
              inputMode="numeric"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="90"
            />
          </Field>
        </div>

        <Field label="Location" required>
          <div className="choice">
            <button
              type="button"
              className={`choice-opt ${location === "physical" ? "selected" : ""}`}
              onClick={() => setLocation("physical")}
            >
              <IconBuilding size={17} /> In-person
            </button>
            <button
              type="button"
              className={`choice-opt ${location === "remote" ? "selected" : ""}`}
              onClick={() => setLocation("remote")}
            >
              <IconVideo size={17} /> Remote
            </button>
          </div>
        </Field>

        {location === "physical" && (
          <Field
            label="City"
            required
            htmlFor="city"
            hint="We'll prioritize reporters in this city."
          >
            <input
              id="city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g. Jakarta"
            />
          </Field>
        )}
      </form>
    </Modal>
  );
}
