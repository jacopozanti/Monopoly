import ReactDOM from "react-dom/client";
// @ts-ignore
import { BrowserRouter as Router, Route, Routes, RouterProvider, createBrowserRouter } from "react-router-dom";
import Gallery from "./Pages/Galery/gallery.tsx";
import Home from "./Pages/Home/home.tsx";
import Users from "./Pages/Users/users.tsx";
import { SettingsProvider } from "./contexts/SettingsContext.tsx";
const router = createBrowserRouter([
    {
        path: "Monopoly",
        element: <Home />,
    },
    {
        path: "Monopoly/gallery",
        element: <Gallery />,
    },
    {
        path: "/Monopoly/users",
        element: <Users />,
    },
]);

function App() {
    return (
        <SettingsProvider>
            <RouterProvider router={router} />
        </SettingsProvider>
    );
}

document.title = "Monopoly";
ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(<App />);
