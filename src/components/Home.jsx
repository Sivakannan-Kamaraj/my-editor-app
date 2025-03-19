import React from "react";
import { useNavigate } from "react-router-dom";

function PdfViewer() {
  const navigate = useNavigate();

  const handleFileChange = (event) => {
    const files = Array.from(event.target.files);

    if (files.length > 0) {
      const urls = files.map((file) => URL.createObjectURL(file));

      // Store as JSON in localStorage
      localStorage.setItem("uploadedPdfs", JSON.stringify(urls));
    }
  };

  return (
    <div>
      <h2>Upload and View PDFs</h2>
      <input type="file" multiple accept="application/pdf" onChange={handleFileChange} />
      <button onClick={() => navigate("/view-pdfs")}>View PDFs</button>
    </div>
  );
}

export default PdfViewer;
