import { Route, Routes } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import PresentationView from "./views/PresentationView.jsx";
import MasterView from "./views/MasterView.jsx";
import DetailView from "./views/DetailView.jsx";
import AddUpdateView from "./views/AddUpdateView.jsx";
import FavoritesView from "./views/FavoritesView.jsx";
import LoginView from "./views/LoginView.jsx";
import RegisterView from "./views/RegisterView.jsx";
import ForgotPasswordView from "./views/ForgotPasswordView.jsx";
import ResetPasswordView from "./views/ResetPasswordView.jsx";
import StatisticsView from "./views/StatisticsView.jsx";
import ChatView from "./views/ChatView.jsx";
import AdminObservationsView from "./views/AdminObservationsView.jsx";
import AdminRevenueView from "./views/AdminRevenueView.jsx";
import AdminDemoView from "./views/AdminDemoView.jsx";
import AdminCheckInView from "./views/AdminCheckInView.jsx";
import AdminPrizeDrawView from "./views/AdminPrizeDrawView.jsx";
import OAuthCallbackView from "./views/OAuthCallbackView.jsx";
import MyTicketsView from "./views/MyTicketsView.jsx";
import ProtectedRoute from "./auth/ProtectedRoute.jsx";
import useVerifyToken from "./hooks/useVerifyToken.js";
import PrizeDrawPopup from "./components/PrizeDrawPopup.jsx";
import { getActiveDraw, getMyResult } from "./api/prizeDrawAPI.js";
import { getCurrentUser } from "./auth/currentUser.js";

// Derive WebSocket URL from current page
function wsUrl() {
    if (import.meta.env.VITE_WS_URL) return import.meta.env.VITE_WS_URL
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    return `${protocol}//${window.location.host}/ws`
}

function App() {
    const { verifying } = useVerifyToken()

    // ── Prize draw state ──────────────────────────────────────────────────
    const [drawPopup,     setDrawPopup]     = useState(null)  // { mode: 'opt-in'|'result', draw, winner, participants }
    const [optedInDraws,  setOptedInDraws]  = useState(() => {
        try { return new Set(JSON.parse(localStorage.getItem('prizeOptedIn') || '[]')) }
        catch { return new Set() }
    })
    const wsRef = useRef(null)

    function markSeen(drawId)    { localStorage.setItem(`prizeDrawSeen_${drawId}`, '1') }
    function hasSeen(drawId)     { return !!localStorage.getItem(`prizeDrawSeen_${drawId}`) }
    function markResultSeen(id)  { localStorage.setItem(`prizeResultSeen_${id}`, '1') }
    function hasResultSeen(id)   { return !!localStorage.getItem(`prizeResultSeen_${id}`) }

    function addOptedIn(drawId) {
        setOptedInDraws(prev => {
            const next = new Set(prev)
            next.add(drawId)
            localStorage.setItem('prizeOptedIn', JSON.stringify([...next]))
            return next
        })
    }

    // ── Check active draw + pending results on mount ──────────────────────
    useEffect(() => {
        const user = getCurrentUser()

        // Check for a pending result first (user opted in to a completed draw)
        if (user) {
            getMyResult().then(res => {
                if (!res) return
                const drawId = res.draw?.id
                if (drawId && !hasResultSeen(drawId)) {
                    setDrawPopup({ mode: 'result', ...res })
                }
            }).catch(() => {})
        }

        // Then check for active draw
        getActiveDraw().then(draw => {
            if (!draw) return
            if (!hasSeen(draw.id)) {
                setDrawPopup({ mode: 'opt-in', draw })
            }
        }).catch(() => {})
    }, [])

    // ── Global WebSocket for prize draw events ────────────────────────────
    useEffect(() => {
        let ws
        let reconnectTimer

        function connect() {
            ws = new WebSocket(wsUrl())
            wsRef.current = ws

            ws.onmessage = (evt) => {
                try {
                    const msg = JSON.parse(evt.data)
                    if (msg.type === 'PRIZE_DRAW_STARTED') {
                        const draw = msg.draw
                        if (!hasSeen(draw.id)) {
                            setDrawPopup({ mode: 'opt-in', draw })
                        }
                    } else if (msg.type === 'PRIZE_DRAW_RESULT') {
                        const { draw, winner, participants } = msg
                        const drawId = draw?.id
                        if (drawId && !hasResultSeen(drawId) && optedInDraws.has(drawId)) {
                            setDrawPopup({ mode: 'result', draw, winner, participants })
                        }
                    }
                } catch { /* ignore */ }
            }

            ws.onclose = () => {
                reconnectTimer = setTimeout(connect, 5000)
            }
        }

        connect()

        return () => {
            clearTimeout(reconnectTimer)
            ws?.close()
        }
    }, [optedInDraws])   // re-subscribe when optedInDraws changes

    function handlePopupClose() {
        if (!drawPopup) return
        const drawId = drawPopup.draw?.id
        if (drawPopup.mode === 'opt-in' && drawId) markSeen(drawId)
        if (drawPopup.mode === 'result' && drawId) markResultSeen(drawId)
        setDrawPopup(null)
    }

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
        <>
        {drawPopup && (
            <PrizeDrawPopup
                mode={drawPopup.mode}
                draw={drawPopup.draw}
                winner={drawPopup.winner}
                participants={drawPopup.participants || []}
                onClose={handlePopupClose}
                onOptIn={() => drawPopup.draw?.id && addOptedIn(drawPopup.draw.id)}
            />
        )}
        <Routes>
            <Route path="/" element={<PresentationView/>}/>

            {/* ── Public routes ── */}
            <Route path="/events" element={<MasterView/>}/>
            <Route path="/events/:id" element={<DetailView/>}/>
            <Route path="/statistics" element={<StatisticsView/>}/>
            <Route path="/login" element={<LoginView/>}/>
            <Route path="/register" element={<RegisterView/>}/>
            <Route path="/forgot-password" element={<ForgotPasswordView/>}/>
            <Route path="/reset-password" element={<ResetPasswordView/>}/>
            <Route path="/oauth-callback" element={<OAuthCallbackView/>}/>

            {/* ── Protected routes (any authenticated user) ── */}
            <Route path="/favorites" element={
                <ProtectedRoute><FavoritesView /></ProtectedRoute>
            }/>
            <Route path="/my-tickets" element={
                <ProtectedRoute><MyTicketsView /></ProtectedRoute>
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
            <Route path="/admin/revenue" element={
                <ProtectedRoute><AdminRevenueView/></ProtectedRoute>
            }/>
            <Route path="/admin/check-in" element={
                <ProtectedRoute><AdminCheckInView/></ProtectedRoute>
            }/>
            <Route path="/admin/demo" element={<AdminDemoView/>}/>
            <Route path="/admin/prize-draw" element={
                <ProtectedRoute><AdminPrizeDrawView/></ProtectedRoute>
            }/>
        </Routes>
        </>
    )
}

export default App;
