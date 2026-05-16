import { Route, Routes } from "react-router-dom";
import PresentationView from "./views/PresentationView.jsx";
import MasterView from "./views/MasterView.jsx";
import DetailView from "./views/DetailView.jsx";
import AddUpdateView from "./views/AddUpdateView.jsx";
import FavoritesView from "./views/FavoritesView.jsx";
import LoginView from "./views/LoginView.jsx";
import RegisterView from "./views/RegisterView.jsx";
import StatisticsView from "./views/StatisticsView.jsx";
import ChatView from "./views/ChatView.jsx";
import AdminObservationsView from "./views/AdminObservationsView.jsx";
import ProtectedRoute from "./auth/ProtectedRoute.jsx";
import useVerifyToken from "./hooks/useVerifyToken.js";

function App() {
    // Verify stored token on every full page load / refresh
    const { verifying } = useVerifyToken()

    // While we're checking, show nothing (avoids flash of login page)
    if (verifying) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                color: '#6C5CE7',
                fontFamily: 'sans-serif'
            }}>
                <p>Verifying session…</p>
            </div>
        )
    }

    return(
        <Routes>
            <Route path="/" element={<PresentationView/>}/>

            {/* ── Public routes ── */}
            <Route path="/events" element={<MasterView/>}/>
            <Route path="/events/:id" element={<DetailView/>}/>
            <Route path="/statistics" element={<StatisticsView/>}/>
            <Route path="/login" element={<LoginView/>}/>
            <Route path="/register" element={<RegisterView/>}/>

            {/* ── Protected routes (any authenticated user) ── */}
            <Route path="/favorites" element={
                <ProtectedRoute><FavoritesView /></ProtectedRoute>
            }/>
            <Route path="/chat" element={
                <ProtectedRoute><ChatView /></ProtectedRoute>
            }/>

            {/* ── Admin-only routes ── */}
            <Route path="/events/add" element={
                <ProtectedRoute permission="events.create"><AddUpdateView /></ProtectedRoute>
            }/>
            <Route path="/events/:id/edit" element={
                <ProtectedRoute permission="events.update"><AddUpdateView /></ProtectedRoute>
            }/>
            <Route path="/admin/observations" element={
                <ProtectedRoute><AdminObservationsView/></ProtectedRoute>
            }/>
        </Routes>
    )
}

export default App;
