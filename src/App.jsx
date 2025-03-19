import { Routes, Route } from "react-router-dom"; 
import PdfViewer from "./components/Home";
import ViewPdfsPage from "./components/Pdf";

function App() {
  return (
    <Routes>
      <Route path="/" element={<PdfViewer />} />
      <Route path="/view-pdfs" element={<ViewPdfsPage />} />
    </Routes>
  );
}

export default App;
