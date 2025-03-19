import React, { useState, useEffect } from "react";
import { Editor } from "@tinymce/tinymce-react";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import * as mammoth from "mammoth"; // Import Mammoth library for DOCX parsing
import { jsPDF } from "jspdf"; // Import jsPDF for PDF export

function ViewPdfsPage() {
  const [pdfFiles, setPdfFiles] = useState([]);
  const [editorContent, setEditorContent] = useState("");

  useEffect(() => {
    const storedPdfs = JSON.parse(localStorage.getItem("uploadedPdfs")) || [];
    setPdfFiles(storedPdfs);

    const savedContent = localStorage.getItem("documentContent");
    if (savedContent) setEditorContent(savedContent);
  }, []);

  const handleEditorChange = (content) => {
    setEditorContent(content);
    localStorage.setItem("documentContent", content);
  };

  const handleDocxUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.name.endsWith(".docx")) {
      const reader = new FileReader();
      reader.onload = async function (e) {
        const arrayBuffer = e.target.result;
        try {
          const { value } = await mammoth.convertToHtml({ arrayBuffer });
          setEditorContent(value);
        } catch (error) {
          console.error("Error converting DOCX to HTML:", error);
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      alert("Please upload a valid DOCX file.");
    }
  };

  const handleExportWord = () => {
    const content = editorContent;

    // Helper function to convert HTML to WordprocessingML
    const htmlToWordML = (html) => {
      let wordMLContent = html;

      wordMLContent = wordMLContent.replace(/<b>/g, '<w:r><w:rPr><w:b/></w:rPr><w:t>')
                                   .replace(/<\/b>/g, '</w:t></w:r>');
      wordMLContent = wordMLContent.replace(/<i>/g, '<w:r><w:rPr><w:i/></w:rPr><w:t>')
                                   .replace(/<\/i>/g, '</w:t></w:r>');

      wordMLContent = wordMLContent.replace(/<p>/g, '<w:p><w:r><w:t>')
                                   .replace(/<\/p>/g, '</w:t></w:r></w:p>');

      return wordMLContent;
    };

    const wordML = htmlToWordML(content);

    if (!wordML.trim()) {
      console.error('Generated WordML is empty!');
      return;
    }

    const zip = new PizZip();
    const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });

    const docTemplate = `
      <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
        <w:body>
          ${wordML}
        </w:body>
      </w:document>
    `;

    zip.file("word/document.xml", docTemplate);

    try {
      const output = zip.generate({ type: "blob", mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });

      if (output.size === 0) {
        console.error('Generated DOCX file is empty!');
        return;
      }

      const link = document.createElement("a");
      link.href = URL.createObjectURL(output);
      link.download = "document.docx";
      link.click();
    } catch (error) {
      console.error("Error generating DOCX:", error);
    }
  };

  const handleExportPdf = () => {
    const content = editorContent;

    // Create a new jsPDF instance
    const doc = new jsPDF();

    // Add the editor content to the PDF (converting HTML to text or simplified content)
    doc.html(content, {
      callback: function (doc) {
        // Save the generated PDF
        doc.save("document.pdf");
      },
      x: 10,
      y: 10,
      width: 180, // Adjust the width for page content
      windowWidth: 800, // To ensure proper scaling
    });
  };

  return (
    <div style={styles.container}>
      <div style={styles.leftPanel}>
        <h2>Uploaded PDFs</h2>
        {pdfFiles.length === 0 ? (
          <p>No PDFs uploaded</p>
        ) : (
          pdfFiles.map((url, index) => (
            <iframe
              key={index}
              src={url}
              width="100%"
              height="500px"
              style={{ marginTop: "10px", border: "1px solid #ccc" }}
              title={`pdf-${index}`}
            />
          ))
        )}
      </div>

      <div style={styles.rightPanel}>
        <h2>Word Editor</h2>
        <Editor
          apiKey="mg26odid0ixyd613i1bwfesxk4eu8q54q3cyaoatbk2xyzjz"
          value={editorContent}
          init={{
            height: 500,
            menubar: true,
            plugins: "lists link image table code wordcount fullscreen",
            toolbar:
              "undo redo | formatselect | bold italic underline | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | table link image fullscreen | exportword exportpdf",
            setup(editor) {
              editor.ui.registry.addButton("exportword", {
                text: "Export as Word",
                onAction: () => handleExportWord(),
              });

              editor.ui.registry.addButton("exportpdf", {
                text: "Export as PDF",
                onAction: () => handleExportPdf(),
              });
            },
          }}
          onEditorChange={handleEditorChange}
        />

        <div style={{ marginTop: "10px" }}>
          <input
            type="file"
            accept=".docx"
            onChange={handleDocxUpload}
            style={{ padding: "10px", cursor: "pointer" }}
          />
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    height: "100vh",
    gap: "10px",
  },
  leftPanel: {
    flex: 1,
    padding: "10px",
    overflowY: "auto",
    background: "#f9f9f9",
  },
  rightPanel: {
    flex: 1,
    padding: "10px",
    overflowY: "auto",
    background: "#e3e3e3",
  },
};

export default ViewPdfsPage;
