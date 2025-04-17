import { useState, useEffect, } from "react";
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

                if (data.player) {
                    setUser(data.player);
                    localStorage.setItem("user", JSON.stringify(data.player));
                }

                if(data.status === "error") alert(data.message)
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

    const handleAddFriend = (login, friendLogin) => {
        const data = {
            type: "addFriend",
            login, 
            friendLogin
        };
        socket.send(JSON.stringify(data));
        console.log("Відправлено на сервер:", data);
    };
        
    return (
        <div>
            {user ? (
                <ProfilePage user={user} onLogout={handleLogout} onAddFriend={handleAddFriend}/>
            ) : (
                <AuthPage onAuthenticate={handleAuth} />
            )}
        </div>
    );    
}

export default App;
