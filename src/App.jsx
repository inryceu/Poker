import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import AuthPage from "./AuthPage";
import ProfilePage from "./ProfilePage";
import SessionPage from "./SessionPage";

function App() {
    const [socket, setSocket] = useState(null);
    const [user, setUser] = useState(() => {
        const savedUser = localStorage.getItem("user");
        return savedUser ? JSON.parse(savedUser) : null;
    });
    const [session, setSession] = useState(() => {
        const savedSession = localStorage.getItem("session");
        return savedSession ? JSON.parse(savedSession) : null;
    });

    useEffect(() => {
        if (user) localStorage.setItem("user", JSON.stringify(user));
        else localStorage.removeItem("user");
    }, [user]);

    useEffect(() => {
        if (session) localStorage.setItem("session", JSON.stringify(session));
        else localStorage.removeItem("session");
    }, [session]);

    useEffect(() => {
        const ws = new WebSocket("ws://localhost:8080");

        ws.onopen = () => {
            console.log("Підключено до WebSocket");
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                console.log("Отримано повідомлення від сервера:", data);

                if (data.player) {
                    setUser(prevUser => ({
                        ...prevUser,
                        ...data.player
                    }));
                }

                if (data.session) {
                    setSession(data.session);
                    setUser(prevUser => ({
                        ...prevUser,
                        session: data.session.id
                    }));
                }

                if (data.status === "error") alert(data.message);
            } catch (error) {
                console.error("Помилка парсингу повідомлення:", error);
            }
        };

        ws.onerror = (error) => {
            console.error("WebSocket помилка:", error);
        };

        ws.onclose = () => {
            console.log("З'єднання WebSocket закрите");
        };

        setSocket(ws);

        return () => {
            ws.close();
        };
    }, []);

    const handleAuth = (login, password, isNewAccount) => {
        const data = {
            type: isNewAccount ? "create" : "auth",
            login,
            password,
        };
        socket.send(JSON.stringify(data));
    };

    const handleLogout = () => {
        setSession(null);
        setUser(null);
    };

    const handleAddFriend = (login, friendLogin) => {
        socket.send(JSON.stringify({ type: "addFriend", login, friendLogin }));
    };

    const handleDeleteFriend = (login, friendLogin) => {
        socket.send(JSON.stringify({ type: "deleteFriend", login, friendLogin }));
    };

    const handleCreateSession = (admin, startBalance, minBet, maxBet, roundTime) => {
        if (user?.session) {
            alert("Ви вже маєте активну сесію");
            return;
        }

        socket.send(JSON.stringify({
            type: "createSession",
            login: admin,
            admin,
            startBalance,
            minBet,
            maxBet,
            roundTime
        }));
    };

    const handleLeaveSession = () => {
        setSession(null);
        setUser(prevUser => ({
            ...prevUser,
            session: null
        }));
    };

    return (
        <Router>
            <Routes>
                <Route 
                    path="/" 
                    element={
                        user ? (
                            <Navigate to="/profile" />
                        ) : (
                            <AuthPage onAuthenticate={handleAuth} />
                        )
                    } 
                />
                <Route 
                    path="/profile" 
                    element={
                        user ? (
                            <ProfilePage 
                                user={user}
                                onLogout={handleLogout}
                                onAddFriend={handleAddFriend}
                                onDeleteFriend={handleDeleteFriend}
                            />
                        ) : (
                            <Navigate to="/" />
                        )
                    }
                />
                <Route 
                    path="/session" 
                    element={
                        user ? (
                            <SessionPage 
                                user={user} 
                                session={session}
                                onCreateSession={handleCreateSession}
                                onLeaveSession={handleLeaveSession}
                            />
                        ) : (
                            <Navigate to="/" />
                        )
                    } 
                />
            </Routes>
        </Router>
    );
}

export default App;
