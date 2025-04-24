import { useState } from "react";
import { useNavigate } from "react-router-dom";

const SessionPage = ({user, session, onCreateSession, onLeaveSession}) => {
    const navigate = useNavigate();
    const admin = user.login;
    const [startBalance, setStartBalance] = useState("");
    const [minBet, setMinBet] = useState("");
    const [maxBet, setMaxBet] = useState("");
    const [roundTime, setRoundTime] = useState("");

    const handleCreateSession = () => {
        const balance = Number.parseInt(startBalance);
        const min = Number.parseInt(minBet);
        const max = Number.parseInt(maxBet);
        const time = Number.parseInt(roundTime);
        if(isNaN(balance) || isNaN(min) || isNaN(max) || isNaN(time)){
            alert("Всі поля мають бути числом");
            return;
        }

        onCreateSession(admin, balance, min, max, time);
    }

    return (
        <div>
            {session ? (
                <>
                    <h2>у вас вже є сесія</h2>
                    <button onClick={() => onLeaveSession()}>Покинути сесію</button>
                </>
            ) : (
                <>
                    <h2>Параметри сесії</h2>
                    <div>
                        <input
                            type="text"
                            placeholder="Стартовий баланс"
                            value={startBalance}
                            onChange={(e) => setStartBalance(e.target.value)}
                        />
                    </div>
                    <div>
                        <input
                            type="text"
                            placeholder="Мінімальна ставка"
                            value={minBet}
                            onChange={(e) => setMinBet(e.target.value)}
                        />
                    </div>
                    <div>
                        <input
                            type="text"
                            placeholder="Максимальна ставка"
                            value={maxBet}
                            onChange={(e) => setMaxBet(e.target.value)}
                        />
                    </div>
                    <div>
                        <input
                            type="text"
                            placeholder="Час ходу гравця (сек)"
                            value={roundTime}
                            onChange={(e) => setRoundTime(e.target.value)}
                        />
                    </div>
                    <div>
                        <button onClick={handleCreateSession}>Створити сесію</button>
                    </div>
                    <div>
                        <button onClick={() => {onLeaveSession(); navigate("/profile")}}>Покинути сесію</button>
                    </div>
                </>
            )}
        </div>
    );
};

export default SessionPage;
