import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import { ExamProvider } from "./context/ExamContext";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>
      <ExamProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ExamProvider>
    </AuthProvider>
  </StrictMode>,
);
