import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function ProfilePage({
    user,
    onLogout,
    onAddFriend,
    onDeleteFriend,
    onJoinSession,
    onDeposit,
    onWithdraw     
}) {
    const [friendName, setFriendName] = useState("");
    const [sessionID, setSessionID] = useState("");
    const [friends, setFriends] = useState([]);
    const [amount, setAmount] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        if (user.friends) {
            try {
                const parsed = JSON.parse(user.friends);
                setFriends(parsed);
            } catch (err) {
                alert(err);
                setFriends([]);
            }
        }
    }, [user]);

    const handleAddFriend = () => {
        if (!friendName.trim() || user.login === friendName) {
            alert(`Значення '${friendName}' недопустиме`);
            return;
        }
        onAddFriend(user.login, friendName);
        setFriendName("");
    };

    const handleDeleteFriend = () => {
        if (!friendName.trim() || user.login === friendName) {
            alert(`Значення '${friendName}' недопустиме`);
            return;
        }
        onDeleteFriend(user.login, friendName);
        setFriendName("");
    };

    const handleJoinSession = () => {
        const id = Number.parseInt(sessionID);
        if (!sessionID.trim() || isNaN(id)) {
            alert("ID сесії має бути числом");
            return;
        }

        onJoinSession(user.login, id);
        setSessionID("");
    };

    const handleDeposit = () => {
        const value = parseInt(amount);
        if (isNaN(value) || value <= 0) {
            alert("Введіть коректну суму для поповнення");
            return;
        }
        onDeposit(user.login, value);
        setAmount("");
    };

    const handleWithdraw = () => {
        const value = parseInt(amount);
        if (isNaN(value) || value <= 0) {
            alert("Введіть коректну суму для виводу");
            return;
        }
        if (value > user.balance) {
            alert("Недостатньо коштів");
            return;
        }
        onWithdraw(user.login, value);
        setAmount("");
    };

    return (
        <div>
            <h2>Привіт, {user.login}!</h2>
            <p>Баланс: {user.balance}</p>

            <h3>Твої друзі:</h3>
            <ul>
                {friends.length > 0 ? (
                    friends.map((friend, index) => (
                        <li key={index}>{friend}</li>
                    ))
                ) : (
                    <li>Немає друзів</li>
                )}
            </ul>

            <div>
                <input
                    type="text"
                    placeholder="Ім'я друга"
                    value={friendName}
                    onChange={(e) => setFriendName(e.target.value)}
                />
                <button onClick={handleAddFriend}>Додати друга</button>
                <button onClick={handleDeleteFriend}>Видалити друга</button>
            </div>

            <div>
                <input
                    type="text"
                    placeholder="ID сесії"
                    value={sessionID}
                    onChange={(e) => setSessionID(e.target.value)}
                />
                <button onClick={handleJoinSession}>Доєднатися до сесії</button>
            </div>

            <div>
                <button onClick={() => navigate("/session")}>
                    Створити ігрову сесію
                </button>
            </div>

            <div style={{ marginTop: "20px" }}>
                <h4>Поповнення / Вивід балансу</h4>
                <input
                    type="text"
                    placeholder="Сума"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                />
                <button onClick={handleDeposit}>Поповнити</button>
                <button onClick={handleWithdraw}>Вивести</button>
            </div>

            <div>
                <button onClick={onLogout}>Вийти</button>
            </div>
        </div>
    );
}

export default ProfilePage;
