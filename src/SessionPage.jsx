import { useState } from "react";
import { useNavigate } from "react-router-dom";

const MIN_TIME_ROUND = 45;
const BALANCE_RATIO = 5;
const BET_RATIO = 2;

const SessionPage = ({user, session, onCreateSession, onLeaveSession}) => {
    const navigate = useNavigate();
    const admin = user.login;
    const [startBalance, setStartBalance] = useState("10");
    const [minBet, setMinBet] = useState("2");
    const [maxBet, setMaxBet] = useState("4");
    const [roundTime, setRoundTime] = useState("45");

    const handleCreateSession = () => {
        const balance = Number.parseInt(startBalance);
        const min = Number.parseInt(minBet);
        const max = Number.parseInt(maxBet);
        const time = Number.parseInt(roundTime);
        if(isNaN(balance) || isNaN(min) || isNaN(max) || isNaN(time) || 
            !Number.isInteger(balance) || !Number.isInteger(min) || 
            !Number.isInteger(max) || !Number.isInteger(time)){
            alert("Всі поля мають бути цілими числами");
            return;
        }
        if(BET_RATIO*min > max) {
            alert(`Мінімальна має бути менше від максимальної щонайменше в ${BET_RATIO} рази`);
            return;
        }
        if(balance/min < BALANCE_RATIO){
            alert(`Баланс має покривати щонайменше ${BALANCE_RATIO} мінімальних ставок`);
            return;
        }
        if(time < MIN_TIME_ROUND){
            alert(`Хід гравця має бути щонайменше ${MIN_TIME_ROUND} секунд`);
            return
        }

        onCreateSession(admin, balance, min, max, time);
    }

    return (
        <div>
            {session ? (
                <>
                    <h2>у вас вже є сесія</h2>
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
                        <button onClick={() => {navigate("/profile")}}>Покинути сесію</button>
                    </div>
                </>
            )}
        </div>
    );
};

export default SessionPage;
