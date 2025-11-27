document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');

    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;

        if (!username || !password) {
            alert('아이디와 비밀번호를 모두 입력해주세요.');
            return;
        }

        try {
            const response = await fetch('http://localhost:3000/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('authToken', data.token);
                localStorage.setItem('currentUser', JSON.stringify(data.user));
                alert('로그인 성공!');
                window.location.href = 'index.html';
            } else {
                alert(`로그인 실패: ${data.message || '아이디 또는 비밀번호가 올바르지 않습니다.'}`);
            }

        } catch (error) {
            console.error('로그인 중 오류 발생:', error);
            alert('로그인 중 네트워크 오류가 발생했습니다. 백엔드 서버가 실행 중인지 확인해주세요.');
        }
    });
});