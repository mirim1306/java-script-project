document.addEventListener('DOMContentLoaded', () => {
    const headerLoginLink = document.getElementById('header-login-link');
    const headerRegisterLink = document.getElementById('header-register-link');
    const headerLogoutLink = document.getElementById('header-logout-link');
    const mypageTitle = document.getElementById('mypage-title');
    const displayUsername = document.getElementById('display-username');
    const displayEmail = document.getElementById('display-email');
    const reservationListContainer = document.getElementById('reservation-list');
    const noReservationsMessage = document.getElementById('no-reservations');
    const logoutButton = document.getElementById('logout-button');

    // 1. 로그인 상태 확인 및 헤더 UI 업데이트
    async function checkLoginStatus() {
        const authToken = localStorage.getItem('authToken');
        if (authToken) {
            headerLoginLink.style.display = 'none';
            headerRegisterLink.style.display = 'none';
            headerLogoutLink.style.display = 'inline';
            logoutButton.style.display = 'block';

            try {
                const response = await fetch('http://localhost:3000/api/user/me', {
                    headers: {
                        'Authorization': `Bearer ${authToken}`
                    }
                });
                if (!response.ok) {
                    localStorage.removeItem('authToken');
                    localStorage.removeItem('currentUser');
                    checkLoginStatus();
                    return;
                }
                const userData = await response.json();
                localStorage.setItem('currentUser', JSON.stringify(userData));

                displayUsername.textContent = userData.username;
                displayEmail.textContent = userData.email;
                mypageTitle.textContent = `${userData.username}님의 마이페이지`;

            } catch (error) {
                console.error('사용자 정보를 불러오는 데 실패했습니다:', error);
                displayUsername.textContent = '정보를 불러올 수 없습니다.';
                displayEmail.textContent = '정보를 불러올 수 없습니다.';
                mypageTitle.textContent = '마이페이지 (정보 오류)';
            }

        } else {
            headerLoginLink.style.display = 'inline';
            headerRegisterLink.style.display = 'inline';
            headerLogoutLink.style.display = 'none';
            logoutButton.style.display = 'none';
            mypageTitle.textContent = '로그인이 필요합니다.';
            displayUsername.textContent = '로그인 필요';
            displayEmail.textContent = '로그인 필요';
            reservationListContainer.innerHTML = '<p>로그인하시면 예약 내역을 확인하실 수 있습니다.</p>';
            noReservationsMessage.style.display = 'none';
        }
    }

    // 2. 예약 내역 로드 및 렌더링
    async function renderReservations() {
        const authToken = localStorage.getItem('authToken');
        if (!authToken) {
            reservationListContainer.innerHTML = '<p>로그인하시면 예약 내역을 확인하실 수 있습니다.</p>';
            noReservationsMessage.style.display = 'none';
            return;
        }

        try {
            const response = await fetch('http://localhost:3000/api/reservations', {
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });
            if (!response.ok) {
                throw new Error(`예약 내역을 불러오는 데 실패했습니다: ${response.status}`);
            }
            const reservations = await response.json();
            displayReservations(reservations);
        } catch (error) {
            console.error('예약 내역을 불러오는 데 실패했습니다:', error);
            reservationListContainer.innerHTML = '<p>예약 내역을 불러올 수 없습니다. 오류: ' + error.message + '</p>';
            noReservationsMessage.style.display = 'none';
        }
    }

    function displayReservations(reservations) {
        reservationListContainer.innerHTML = '';

        if (reservations.length === 0) {
            noReservationsMessage.style.display = 'block';
            return;
        } else {
            noReservationsMessage.style.display = 'none';
        }

        reservations.forEach(res => {
            const card = document.createElement('div');
            card.className = 'reservation-card';
            card.innerHTML = `
                <h4>${res.hospitalName || '병원명 없음'}</h4>
                <p><strong>진료 과목:</strong> ${res.department}</p>
                <p><strong>예약 날짜:</strong> ${res.date}</p>
                <p><strong>예약 시간:</strong> ${res.time}</p>
                <p class="reservation-status"><strong>상태:</strong> ${res.status}</p>
                <button class="cancel-reservation-btn" data-reservation-id="${res.reservationId}">예약 취소</button>
            `;
            reservationListContainer.appendChild(card);
        });

        reservationListContainer.querySelectorAll('.cancel-reservation-btn').forEach(button => {
            button.addEventListener('click', cancelReservation);
        });
    }

    // 3. 예약 취소 기능
    async function cancelReservation(event) {
        const reservationId = event.target.dataset.reservationId;
        const authToken = localStorage.getItem('authToken');

        if (!authToken) {
            alert('로그인이 필요합니다.');
            window.location.href = 'login.html';
            return;
        }

        if (!confirm('정말로 이 예약을 취소하시겠습니까?')) {
            return;
        }

        try {
            const response = await fetch(`http://localhost:3000/api/reservations/${reservationId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });

            const data = await response.json();

            if (response.ok) {
                alert('예약이 성공적으로 취소되었습니다!');
                renderReservations();
            } else {
                alert(`예약 취소 실패: ${data.message || '알 수 없는 오류 발생'}`);
            }
        } catch (error) {
            console.error('예약 취소 중 오류 발생:', error);
            alert('예약 취소 중 네트워크 오류가 발생했습니다.');
        }
    }


    // 4. 로그아웃 기능 (기존과 동일)
    const performLogout = () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
        alert('로그아웃되었습니다.');
        window.location.href = 'index.html';
    };

    headerLogoutLink.addEventListener('click', performLogout);
    logoutButton.addEventListener('click', performLogout);

    checkLoginStatus();
    renderReservations();
});