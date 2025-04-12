import { useState, useEffect } from "react";
import AuthPage from "./AuthPage";
import ProfilePage from "./ProfilePage";

function App() {
    const [socket, setSocket] = useState(null);
    const [user, setUser] = useState(() => {
        const savedUser = localStorage.getItem("user");
        return savedUser ? JSON.parse(savedUser) : null;
    });
    

    useEffect(() => {
        const ws = new WebSocket("ws://localhost:8080");

        ws.onopen = () => {
            console.log("Підключено до WebSocket");
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                console.log("Отримано повідомлення від сервера:", data);
                setUser(data.player);
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
        console.log(isNewAccount ? "Реєстрація" : "Вхід", login);
        setUser(login);

        const data = {
            type: isNewAccount ? "create" : "auth",
            login,
            password,
        };
        
        socket.send(JSON.stringify(data));
        console.log("Відправлено на сервер:", data);
    };

    const handleLogout = () => {
        setUser(null);
        localStorage.removeItem("user");
    };
        
    return (
        <div>
            {user ? (
                <ProfilePage user={user} socket={socket} onLogout={handleLogout}/>
            ) : (
                <AuthPage onAuthenticate={handleAuth} />
            )}
        </div>
    );    
}

export default App;
