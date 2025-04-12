import { useState } from "react";

function ProfilePage({ user, onLogout }) {
    const [friendName, setFriendName] = useState("");
    const [sessionCode, setSessionCode] = useState("");

    const handleAddFriend = () => {
        if (friendName.trim()) {
            alert(`Додано друга: ${friendName}`);
            setFriendName("");
        }
    };

    const handleJoinSession = () => {
        if (sessionCode.trim()) {
            alert(`Спроба доєднатися до сесії: ${sessionCode}`);
            setSessionCode("");
        }
    };

    return (
        <div>
            <h2>Привіт, {user.login}!</h2>

            <div>
                <input
                    type="text"
                    placeholder="Ім'я друга"
                    value={friendName}
                    onChange={(e) => setFriendName(e.target.value)}
                />
                <button onClick={handleAddFriend}>Додати друга</button>
            </div>

            <div>
                <input
                    type="text"
                    placeholder="Код сесії"
                    value={sessionCode}
                    onChange={(e) => setSessionCode(e.target.value)}
                />
                <button onClick={handleJoinSession}>Доєднатися до сесії</button>
            </div>

            <div>
                <button onClick={() => alert("Створено нову ігрову сесію!")}>
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
