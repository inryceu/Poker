import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function ProfilePage({ user, onLogout, onAddFriend, onDeleteFriend, }) {
    const [friendName, setFriendName] = useState("");
    const [sessionCode, setSessionCode] = useState("");
    const [friends, setFriends] = useState([]);
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
    }
    
    const handleJoinSession = () => {
        if (sessionCode.trim()) {
            alert(`Спроба доєднатися до сесії: ${sessionCode}`);
            setSessionCode("");
        }
    };
    
    return (
        <div>
            <h2>Привіт, {user.login}!</h2>

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
                    placeholder="Код сесії"
                    value={sessionCode}
                    onChange={(e) => setSessionCode(e.target.value)}
                />
                <button onClick={handleJoinSession}>
                    Доєднатися до сесії
                </button>
            </div>

            <div>
                <button onClick={() => navigate("/session")}>
                    Створити ігрову сесію
                </button>
            </div>

            <div>
                <button onClick={onLogout}>Вийти</button>
            </div>
        </div>
    );
}

export default ProfilePage;
