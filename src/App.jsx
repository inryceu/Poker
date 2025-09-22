import {useEffect, useState} from "react";
import {
  BrowserRouter as Router,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";
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
    const savedSession =
        localStorage.getItem("session");
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
      if (!event.data || event.data.trim() === "") return;
      let data;
      try {
        data = JSON.parse(event.data);
        console.log("Отримано повідомлення від сервера:", data);
      } catch (error) {
        console.error("Помилка парсингу повідомлення:", error);
        return;
      }

      if (data.player) {
        setUser(prevUser => ({
          ...prevUser,
          ...data.player
        }));
      }

      if (data.players) {
        setSession(prevSession => ({
          ...prevSession,
          players: [...data.players]
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
      if (data.status === "unauth error") {
        alert(data.message);
        setSession(null);
        setUser(null);
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

  const sendMessage = (message) => {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      alert("З'єднання WebSocket не встановлено або закрите");
      return false;
    }
    socket.send(JSON.stringify(message));
    return true;
  };

  //====HANDLERS===
  const handleAuth = (login, password, isNewAccount) => {
    sendMessage({
      type: isNewAccount ? "create" : "auth",
      login,
      password,
    });
  };

  const handleLogout = () => {
    if (user?.login) {
      sendMessage({
        type: "logout",
        login: user.login
      });
    }
    setSession(null);
    setUser(null);
  };

  const handleAddFriend = (login, friendLogin) => {
    sendMessage({ type: "addFriend", login, friendLogin });
  };

  const handleDeleteFriend = (login, friendLogin) => {
    sendMessage({ type: "deleteFriend", login, friendLogin });
  };

  const handleCreateSession = (admin, startBalance, minBet, maxBet, roundTime) => {
    if (session) {
      alert("Ви вже маєте активну сесію");
      return;
    }
    sendMessage({
      type: "createSession",
      login: admin,
      admin,
      startBalance,
      minBet,
      maxBet,
      roundTime
    });
  };

  const handleJoinSession = (login, id) => {
    if (session) {
      alert("Ви вже маєте активну сесію");
      return;
    }
    sendMessage({
      type: "joinSession",
      login,
      id
    });
  };

  const handleLeaveSession = (login, id) => {
    setSession(null);
    setUser(prevUser => ({
      ...prevUser,
      session: null
    }));
    sendMessage({
      type: "leaveSession",
      login,
      id
    });
  };

  const handleDeposit = (login, value)=>{
    sendMessage({
      type: "deposit",
      login,
      value
    });
  }

  const handleWithdraw = (login, value)=>{
    sendMessage({
      type: "withdraw",
      login,
      value
    });  
  }

  //====ROUTES===
  const RootRoute = () => (
    user ? <Navigate to="/profile" /> : <AuthPage onAuthenticate={handleAuth} />
  );

  const ProfileRoute = () => {
    if (!user) return <Navigate to="/" />;
    return session ? <Navigate to="/session" /> : (
      <ProfilePage
        user={user}
        onLogout={handleLogout}
        onAddFriend={handleAddFriend}
        onDeleteFriend={handleDeleteFriend}
        onJoinSession={handleJoinSession}
        onDeposit={handleDeposit}
        onWithdraw={handleWithdraw}
      />
    );
  };

  const SessionRoute = () => (
    user ? (
      <SessionPage
        user={user}
        session={session}
        onCreateSession={(newSession) =>
          handleCreateSession(
            newSession.players[0],
            newSession.settings.startBalance,
            newSession.settings.minBet,
            newSession.settings.maxBet,
            newSession.settings.roundTime
          )
        }
        onLeaveSession={() => handleLeaveSession(user.login, session?.id)}
        socket={socket}      
      />
    ) : <Navigate to="/" />
  );

  return (
    <Router>
      <Routes>
        <Route path="/" element={<RootRoute />} />
        <Route path="/profile" element={<ProfileRoute />} />
        <Route path="/session" element={<SessionRoute />} />
      </Routes>
    </Router>
  );
}

export default App;
