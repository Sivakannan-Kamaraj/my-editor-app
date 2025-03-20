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
    if (content.trim()) {
      setEditorContent(content);
      localStorage.setItem("documentContent", content);
    } else {
      console.warn("Editor content is empty!");
    }
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

  const htmlToWordML = (html) => {
    let wordMLContent = html;

    // Replace bold, italic, underline, and other tags
    wordMLContent = wordMLContent.replace(/<b>(.*?)<\/b>/g, '<w:r><w:rPr><w:b/></w:rPr><w:t>$1</w:t></w:r>');
    wordMLContent = wordMLContent.replace(/<strong>(.*?)<\/strong>/g, '<w:r><w:rPr><w:b/></w:rPr><w:t>$1</w:t></w:r>');
    wordMLContent = wordMLContent.replace(/<i>(.*?)<\/i>/g, '<w:r><w:rPr><w:i/></w:rPr><w:t>$1</w:t></w:r>');
    wordMLContent = wordMLContent.replace(/<u>(.*?)<\/u>/g, '<w:r><w:rPr><w:u val="single"/></w:rPr><w:t>$1</w:t></w:r>');
    wordMLContent = wordMLContent.replace(/<em>(.*?)<\/em>/g, '<w:r><w:rPr><w:i/></w:rPr><w:t>$1</w:t></w:r>');
    
    // Handle paragraphs and line breaks
    wordMLContent = wordMLContent.replace(/<p>/g, '<w:p><w:r><w:t>').replace(/<\/p>/g, '</w:t></w:r></w:p>');
    wordMLContent = wordMLContent.replace(/<br>/g, '<w:r><w:t>&#10;</w:t></w:r>');

    // Optional: Handle other tags or custom styles as necessary
    wordMLContent = wordMLContent.replace(/<table>/g, '<w:tbl>').replace(/<\/table>/g, '</w:tbl>'); // Example for tables
    
    // Clean up unwanted tags
    wordMLContent = wordMLContent.replace(/<span[^>]*>/g, '').replace(/<\/span>/g, '').replace(/&nbsp;/g, ' ');

    return wordMLContent;
  };

  const handleExportWord = () => {
    const content = editorContent;
    console.log("Editor Content before conversion:", content);
    
    const wordML = htmlToWordML(content);
    console.log("Generated WordML:", wordML);

    if (!wordML.trim()) {
      console.error("Generated WordML is empty!");
      return;
    }

    const zip = new PizZip();
    const docTemplate = `<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
        <w:body>
          ${wordML}
        </w:body>
      </w:document>`;

    zip.file("word/document.xml", docTemplate);

    try {
      const output = zip.generate({ type: "blob", mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
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
  
    const doc = new jsPDF();
  
    // Define the margin values (top, left, right, bottom)
    const margin = 10;  // You can adjust this value to fit your content better
    const maxHeight = doc.internal.pageSize.height - 2 * margin; // Page height minus top and bottom margins
  
    // Start with y = margin (top margin)
    let currentHeight = margin;
  
    doc.html(content, {
      callback: function (doc) {
        // This callback is invoked once the content has been rendered
  
        // Check if content height exceeds page height, and if so, add more pages
        if (currentHeight > maxHeight) {
          doc.addPage();  // Add a new page when content exceeds the page height
          currentHeight = margin;  // Reset the y position to top of the next page
        }
  
        doc.save("document.pdf");
      },
      x: margin,  // Set starting X position (left margin)
      y: currentHeight,  // Set starting Y position (top margin)
      width: doc.internal.pageSize.width - 2 * margin,  // Set width of the content area (page width minus left and right margins)
      windowWidth: 800, // Window width to scale content
      margin: [margin, margin, margin, margin],  // Apply the margin as needed (top, right, bottom, left)
      autoPaging: true,  // Handle page breaks automatically
    });
  };
  
  return (
    <div style={styles.container}>
      <div style={styles.leftPanel}>
        <h2>Uploaded Documents</h2>
        {pdfFiles.length === 0 ? (
          <p>No documents uploaded!</p>
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
        <div style={{ marginTop: "10px" }}>
          <input
            type="file"
            accept=".docx"
            onChange={handleDocxUpload}
            style={{ padding: "10px", cursor: "pointer" }}
          />
        </div>

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
