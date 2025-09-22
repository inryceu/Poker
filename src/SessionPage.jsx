import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";

const MIN_TIME_ROUND = 45;
const BALANCE_RATIO = 5;
const BET_RATIO = 2;

export default function SessionPage({
  user,
  session,
  onCreateSession,
  onLeaveSession,
  socket,
}) {
  const navigate = useNavigate();
  const admin = user.login;

  const [startBalance, setStartBalance] = useState("10");
  const [minBet, setMinBet] = useState("2");
  const [maxBet, setMaxBet] = useState("4");
  const [roundTime, setRoundTime] = useState("45");
  const [playerStacks, setPlayerStacks] = useState({});
  const [timer, setTimer] = useState(null);
  const timerRef = useRef(null);

  const [communityCards, setCommunityCards] = useState([]);
  const [playerCards, setPlayerCards] = useState([]);

  const sendAction = useCallback(
    (action) => {
      if (!socket || !session?.id) return;
      socket.send(
        JSON.stringify({
          type: "action",
          sessionId: session.id,
          login: user.login,
          action: action,
        })
      );
    },
    [socket, session, user]
  );

  const startTurnTimer = useCallback(
    (duration) => {
      clearInterval(timerRef.current);
      let timeLeft = duration;
      setTimer(timeLeft);
      timerRef.current = setInterval(() => {
        timeLeft -= 1;
        setTimer(timeLeft);
        if (timeLeft <= 0) {
          clearInterval(timerRef.current);
          sendAction("fold");
        }
      }, 1000);
    },
    [sendAction]
  );

  useEffect(() => {
    if (!socket) return;

    const handleMessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "start_round" || data.type === "your_turn") {
        if(session && session.roundTime) startTurnTimer(session.roundTime);
        else startTurnTimer(MIN_TIME_ROUND);
      } else if (data.type === "end_round") {
        clearInterval(timerRef.current);
        setTimer(null);
      } else if (data.type === "game_state") {
        if (data.communityCards) setCommunityCards(data.communityCards);
      } else if (data.type === "player_cards"){
        if (data.playerCards) setPlayerCards(data.playerCards);
      }
    };

    socket.addEventListener("message", handleMessage);
    return () => {
      socket.removeEventListener("message", handleMessage);
      clearInterval(timerRef.current);
    };
  }, [socket, startTurnTimer, user, session]);

  useEffect(() => {
    if (session && session.players) {
      const balance = parseInt(startBalance);
      if (!isNaN(balance)) {
        const stacks = {};
        session.players.forEach((p) => {
          stacks[p] = balance;
        });
        setPlayerStacks(stacks);
      }
    }
  }, [session, startBalance]);

  const handleCreateSession = () => {
    const balance = Number.parseInt(startBalance);
    const min = Number.parseInt(minBet);
    const max = Number.parseInt(maxBet);
    const time = Number.parseInt(roundTime);

    if (
      isNaN(balance) ||
      isNaN(min) ||
      isNaN(max) ||
      isNaN(time) ||
      !Number.isInteger(balance) ||
      !Number.isInteger(min) ||
      !Number.isInteger(max) ||
      !Number.isInteger(time)
    ) {
      alert("Всі поля мають бути цілими числами");
      return;
    }
    if (BET_RATIO * min > max) {
      alert(
        `Мінімальна ставка має бути менше від максимальної щонайменше в ${BET_RATIO} рази`
      );
      return;
    }
    if (balance / min < BALANCE_RATIO) {
      alert(`Баланс має покривати щонайменше ${BALANCE_RATIO} мінімальних ставок`);
      return;
    }
    if (time < MIN_TIME_ROUND) {
      alert(`Час ходу гравця має бути щонайменше ${MIN_TIME_ROUND} секунд`);
      return;
    }

    const newSession = {
      id: Date.now().toString(),
      players: [admin],
      settings: {
        startBalance: balance,
        minBet: min,
        maxBet: max,
        roundTime: time,
      },
      currentPlayer: admin,
      turnEndTime: null,
    };
    onCreateSession(newSession);
  };

  return (
    <div>
      {session ? (
        <>
          <h2>Session ID: {session.id}</h2>
          <h3>Гравці:</h3>
          <ul>
            {session.players.map((player, index) => (
              <li key={index}>
                {player} - Stack: {playerStacks[player]}
              </li>
            ))}
          </ul>

          {timer !== null && (
            <p style={{ fontWeight: "bold", color: timer <= 10 ? "red" : "black" }}>
              Час ходу: {timer} секунд
            </p>
          )}

          {/* 🔹 Відображення карт на столі */}
          <div>
            <h3>Карти на столі:</h3>
            <div style={{ display: "flex", gap: "10px" }}>
              {communityCards.map((card, idx) => (
                <div
                  key={idx}
                  style={{
                    border: "1px solid black",
                    padding: "10px",
                    borderRadius: "5px",
                  }}
                >
                  {card.rank}{card.suit}
                </div>
              ))}
            </div>
          </div>

          {/* 🔹 Відображення карманних карт */}
          <div>
            <h3>Ваші карти:</h3>
            <div style={{ display: "flex", gap: "10px" }}>
              {playerCards.map((card, idx) => (
                <div
                  key={idx}
                  style={{
                    border: "1px solid green",
                    padding: "10px",
                    borderRadius: "5px",
                    backgroundColor: "#e0ffe0",
                  }}
                >
                  {card.rank}{card.suit}
                </div>
              ))}
            </div>
          </div>

          {user.login === session.players[0] && (
            <button onClick={() => sendAction("start_game")}>Почати гру</button>
          )}

          <button onClick={() => sendAction("check")}>Check</button>
          <button onClick={() => sendAction("call")}>Call</button>
          <button onClick={() => sendAction("raise")}>Raise</button>
          <button onClick={() => sendAction("fold")}>Fold</button>
          <button onClick={() => onLeaveSession(user.login, session.id)}>Покинути сесію</button>
        </>
      ) : (
        <>
          <h2>Параметри сесії</h2>
          <div>
            <h4>Стартовий баланс</h4>
            <input
              type="text"
              placeholder="10"
              value={startBalance}
              onChange={(e) => setStartBalance(e.target.value)}
            />
          </div>
          <div>
            <h4>Мінімальна ставка</h4>
            <input
              type="text"
              placeholder="2"
              value={minBet}
              onChange={(e) => setMinBet(e.target.value)}
            />
          </div>
          <div>
            <h4>Максимальна ставка</h4>
            <input
              type="text"
              placeholder="4"
              value={maxBet}
              onChange={(e) => setMaxBet(e.target.value)}
            />
          </div>
          <div>
            <h4>Час ходу гравця (сек)</h4>
            <input
              type="text"
              placeholder="45"
              value={roundTime}
              onChange={(e) => setRoundTime(e.target.value)}
            />
          </div>
          <div>
            <button onClick={handleCreateSession}>Створити сесію</button>
          </div>
          <div>
            <button onClick={() => navigate("/profile")}>До профілю</button>
          </div>
        </>
      )}
    </div>
  );
}
