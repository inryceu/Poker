import { useState } from "react";

const AuthPage = ({ onAuthenticate }) => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [isNewAccount, setIsNewAccount] = useState(false);

    const handleAuth = () => {
        if (username.trim() && password.trim()) {
            onAuthenticate(username, password, isNewAccount);
        }
    };

    return (
        <>
            <h2>{isNewAccount ? "Створити акаунт" : "Вхід"}</h2>
            <div>
                <input
                    type="text"
                    placeholder="Ім'я користувача"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                />
            </div>
            <div>
                <input
                    type="text"
                    placeholder="Пароль"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
            </div>
            <div>
                <button onClick={handleAuth}>
                    {isNewAccount ? "Зареєструватися" : "Увійти"}
                </button>
            </div>
            <div>
                <button onClick={() => setIsNewAccount(!isNewAccount)}>
                {isNewAccount ? "Вже є акаунт?" : "Немає акаунту?"}
                </button>
            </div>
        </>
    );
};

export default AuthPage;
