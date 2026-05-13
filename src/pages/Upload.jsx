import { useState } from "react";

const API = "http://127.0.0.1:8000";

function UploadBox({ title, subtitle, endpoint, allowCamera }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [fileName, setFileName] = useState("");

  async function uploadFile(file) {
    if (!file) return;

    setLoading(true);
    setMessage("");
    setFileName(file.name);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${API}/${endpoint}`, {
        method: "POST",
        body: formData
      });

      const data = await res.json();
      setMessage(data.message || "Upload successful");
    } catch {
      setMessage("Upload failed");
    }

    setLoading(false);
  }

  return (
    <div style={{
      background: "white",
      border: "1px solid #e5e7eb",
      borderRadius: 14,
      padding: 20,
      display: "flex",
      flexDirection: "column",
      gap: 14
    }}>

      <div>
        <div style={{ fontSize: 15, fontWeight: 600 }}>{title}</div>
        <div style={{ fontSize: 12, color: "#6b7280" }}>{subtitle}</div>
      </div>

      {/* DROP AREA */}
      <div style={{
        border: "1.5px dashed #d1d5db",
        borderRadius: 12,
        padding: 24,
        textAlign: "center",
        background: "#f9fafb"
      }}>
        <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 12 }}>
          Upload your file
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>

          {/* FILE UPLOAD */}
          <label style={{
            background: "#111827",
            color: "white",
            padding: "8px 14px",
            borderRadius: 8,
            fontSize: 12,
            cursor: "pointer"
          }}>
            📁 Upload File
            <input
              type="file"
              hidden
              onChange={(e) => uploadFile(e.target.files[0])}
            />
          </label>

          {/* CAMERA (ONLY FOR RECEIPTS) */}
          {allowCamera && (
            <label style={{
              background: "#e5e7eb",
              color: "#111827",
              padding: "8px 14px",
              borderRadius: 8,
              fontSize: 12,
              cursor: "pointer"
            }}>
              📸 Camera
              <input
                type="file"
                accept="image/*"
                capture="environment"
                hidden
                onChange={(e) => uploadFile(e.target.files[0])}
              />
            </label>
          )}

        </div>
      </div>

      {fileName && (
        <div style={{ fontSize: 12, color: "#6b7280" }}>
          📄 {fileName}
        </div>
      )}

      {loading && (
        <div style={{ fontSize: 12, color: "#6b7280" }}>
          Uploading...
        </div>
      )}

      {message && (
        <div style={{ fontSize: 12, color: "#059669", fontWeight: 500 }}>
          {message}
        </div>
      )}
    </div>
  );
}

export default function Upload() {
  return (
    <div style={{
      padding: 28,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 22
    }}>

      <div style={{ textAlign: "center" }}>
        <h2 style={{ margin: 0 }}>Upload 📤</h2>
        <p style={{ fontSize: 13, color: "#6b7280" }}>
          Import transactions or upload receipts
        </p>
      </div>

      <div style={{
        width: "100%",
        maxWidth: 900,
        display: "grid",
        gridTemplateColumns: window.innerWidth < 768 ? "1fr" : "1fr 1fr",
        gap: 18
      }}>
        {/* TRANSACTIONS */}
        <UploadBox
          title="Upload Statement"
          subtitle="PDF or CSV (transactions only)"
          endpoint="upload-statement"
          allowCamera={false}
        />

        {/* RECEIPTS */}
        <UploadBox
          title="Upload Receipt"
          subtitle="Image, PDF or take photo (AI extracts data)"
          endpoint="upload-receipt"
          allowCamera={true}
        />
      </div>

    </div>
  );
}