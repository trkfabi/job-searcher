// frontend/src/App.tsx
import React, { useEffect, useMemo, useState } from "react";
import type { Job, Application } from "./types";

const isLocal =
  typeof window !== "undefined" && window.location.hostname === "localhost";

const API = isLocal ? "http://localhost:3333/api" : __API_BASE__;

function useJobs(query: string) {
  const [data, setData] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    setLoading(true);
    fetch(`${API}/jobs?query=${encodeURIComponent(query)}`)
      .then((r) => r.json())
      .then((j) => setData(j.results || []))
      .finally(() => setLoading(false));
  }, [query]);
  return { data, loading };
}

function useApplications() {
  const [apps, setApps] = useState<Application[]>([]);
  const refresh = () =>
    fetch(`${API}/applications`)
      .then((r) => r.json())
      .then((j) => setApps(j.results || []));
  useEffect(() => {
    refresh();
  }, []);
  const upsert = async (payload: Application) => {
    await fetch(`${API}/applications`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    refresh();
  };
  const patch = async (jobId: string, body: Partial<Application>) => {
    await fetch(`${API}/applications/${jobId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    refresh();
  };
  return { apps, upsert, patch, refresh };
}

export default function App() {
  const [tab, setTab] = useState<"jobs" | "applications">("jobs");
  const [q, setQ] = useState("");
  const { data: jobs, loading } = useJobs(q);
  const { apps, upsert, patch } = useApplications();
  const appsById = useMemo(
    () => new Map(apps.map((a) => [a.jobId, a])),
    [apps]
  );

  const [modal, setModal] = useState<{ open: boolean; job?: Job }>({
    open: false,
  });
  const openApply = (job: Job) => setModal({ open: true, job });
  const closeApply = () => setModal({ open: false });

  return (
    <div
      style={{
        maxWidth: 1100,
        margin: "20px auto",
        fontFamily: "ui-sans-serif, system-ui",
      }}
    >
      <h1 style={{ fontSize: 28, marginBottom: 12 }}>Jobs Dashboard</h1>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <TabButton active={tab === "jobs"} onClick={() => setTab("jobs")}>
          Jobs {jobs.length ? `(${jobs.length})` : ""}
        </TabButton>
        <TabButton
          active={tab === "applications"}
          onClick={() => setTab("applications")}
        >
          Applications {apps.length ? `(${apps.length})` : ""}
        </TabButton>
      </div>

      {tab === "jobs" && (
        <>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search (title/company)"
              style={{
                flex: 1,
                padding: 8,
                border: "1px solid #ddd",
                borderRadius: 8,
              }}
            />
          </div>

          {loading ? (
            <p>Loading...</p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", padding: 8 }}>Title</th>
                  <th style={{ textAlign: "left", padding: 8 }}>Company</th>
                  <th style={{ textAlign: "left", padding: 8 }}>Source</th>
                  <th style={{ textAlign: "left", padding: 8 }}>Found</th>
                  <th style={{ textAlign: "left", padding: 8 }}>Applied</th>
                  <th style={{ textAlign: "right", padding: 8 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => {
                  const app = appsById.get(job.id);
                  return (
                    <tr key={job.id} style={{ borderTop: "1px solid #eee" }}>
                      <td style={{ padding: 8 }}>
                        <a href={job.url} target="_blank">
                          {job.title}
                        </a>
                      </td>
                      <td style={{ padding: 8 }}>{job.company}</td>
                      <td style={{ padding: 8 }}>{job.source}</td>
                      <td style={{ padding: 8 }}>
                        {job.createdAt
                          ? new Date(job.createdAt).toISOString().slice(0, 10)
                          : "—"}
                      </td>
                      <td style={{ padding: 8 }}>{app ? app.status : "—"}</td>
                      <td style={{ padding: 8, textAlign: "right" }}>
                        <button
                          onClick={() => openApply(job)}
                          style={{ padding: "6px 10px" }}
                        >
                          Apply / Save
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {modal.open && modal.job && (
            <div
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,0.4)",
                display: "grid",
                placeItems: "center",
              }}
            >
              <div
                style={{
                  background: "#fff",
                  padding: 16,
                  borderRadius: 12,
                  width: 520,
                }}
              >
                <h3 style={{ marginTop: 0 }}>Apply / Track</h3>
                <p>
                  <strong>{modal.job.title}</strong> @ {modal.job.company}
                </p>

                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const fd = new FormData(e.currentTarget as HTMLFormElement);
                    const payload: Application = {
                      jobId: modal.job!.id,
                      status: (fd.get("status") as any) || "applied",
                      track: (fd.get("track") as any) || "backend",
                      note: String(fd.get("note") || ""),
                      cvVersion: String(fd.get("cvVersion") || ""),
                      nextFollowUp: String(fd.get("nextFollowUp") || ""),
                    };
                    await upsert(payload);
                    closeApply();
                    setTab("applications"); // salta a la pestaña de applications tras guardar
                  }}
                >
                  <div style={{ display: "grid", gap: 8 }}>
                    <label>
                      Status
                      <select
                        name="status"
                        defaultValue="applied"
                        style={{ width: "100%" }}
                      >
                        <option value="saved">saved</option>
                        <option value="applied">applied</option>
                        <option value="interviewing">interviewing</option>
                        <option value="offer">offer</option>
                        <option value="rejected">rejected</option>
                      </select>
                    </label>
                    <label>
                      Track
                      <select
                        name="track"
                        defaultValue="backend"
                        style={{ width: "100%" }}
                      >
                        <option value="backend">backend</option>
                        <option value="mobile">mobile</option>
                        <option value="other">other</option>
                      </select>
                    </label>
                    <label>
                      CV version{" "}
                      <input
                        name="cvVersion"
                        placeholder="cv-backend-v1.pdf"
                        style={{ width: "100%" }}
                      />
                    </label>
                    <label>
                      Follow-up date{" "}
                      <input
                        type="date"
                        name="nextFollowUp"
                        style={{ width: "100%" }}
                      />
                    </label>
                    <label>
                      Notes
                      <textarea
                        name="note"
                        rows={4}
                        placeholder="What did you send / who did you DM?"
                        style={{ width: "100%" }}
                      />
                    </label>
                  </div>
                  <div
                    style={{
                      marginTop: 12,
                      display: "flex",
                      gap: 8,
                      justifyContent: "flex-end",
                    }}
                  >
                    <button type="button" onClick={closeApply}>
                      Cancel
                    </button>
                    <button type="submit">Save</button>
                    <a
                      href={modal.job.url}
                      target="_blank"
                      style={{ alignSelf: "center" }}
                    >
                      Open Job
                    </a>
                  </div>
                </form>
              </div>
            </div>
          )}
        </>
      )}

      {tab === "applications" && (
        <>
          <h2 style={{ marginTop: 8, marginBottom: 12 }}>Applications</h2>
          <ApplicationsTable apps={apps} onPatch={patch} />
        </>
      )}
    </div>
  );
}

function TabButton(props: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  const { active, onClick, children } = props;
  return (
    <button
      onClick={onClick}
      style={{
        padding: "8px 12px",
        borderRadius: 10,
        border: "1px solid #ddd",
        background: active ? "#111" : "#fff",
        color: active ? "#fff" : "#111",
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

function ApplicationsTable({
  apps,
  onPatch,
}: {
  apps: Application[];
  onPatch: (id: string, body: Partial<Application>) => Promise<void>;
}) {
  if (!apps.length) return <p>No applications yet.</p>;
  return (
    <table style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead>
        <tr>
          <th style={{ textAlign: "left", padding: 8 }}>JobId</th>
          <th style={{ textAlign: "left", padding: 8 }}>Status</th>
          <th style={{ textAlign: "left", padding: 8 }}>Track</th>
          <th style={{ textAlign: "left", padding: 8 }}>Applied</th>
          <th style={{ textAlign: "left", padding: 8 }}>Next follow-up</th>
          <th style={{ textAlign: "left", padding: 8 }}>Note</th>
          <th style={{ textAlign: "right", padding: 8 }}>Actions</th>
        </tr>
      </thead>
      <tbody>
        {apps.map((a) => (
          <tr key={a.jobId} style={{ borderTop: "1px solid #eee" }}>
            <td style={{ padding: 8 }}>{a.jobId}</td>
            <td style={{ padding: 8 }}>{a.status}</td>
            <td style={{ padding: 8 }}>{a.track}</td>
            <td style={{ padding: 8 }}>{a.appliedAt?.slice(0, 10)}</td>
            <td style={{ padding: 8 }}>{a.nextFollowUp}</td>
            <td style={{ padding: 8, maxWidth: 320 }}>{a.note}</td>
            <td style={{ padding: 8, textAlign: "right" }}>
              <button
                onClick={() => onPatch(a.jobId, { status: "interviewing" })}
                style={{ marginRight: 6 }}
              >
                Interviewing
              </button>
              <button
                onClick={() => onPatch(a.jobId, { status: "offer" })}
                style={{ marginRight: 6 }}
              >
                Offer
              </button>
              <button onClick={() => onPatch(a.jobId, { status: "rejected" })}>
                Rejected
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
