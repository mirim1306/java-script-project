document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const hospitalId = params.get('id');

    if (!hospitalId) {
        alert('잘못된 접근입니다. 병원 ID가 없습니다.');
        window.location.href = 'index.html';
        return;
    }

    const hospitalNameElem = document.getElementById('detail-hospital-name');
    const departmentElem = document.getElementById('detail-department');
    const addressElem = document.getElementById('detail-address');
    const phoneElem = document.getElementById('detail-phone');
    const openingHoursElem = document.getElementById('detail-opening-hours');
    const currentPatientsElem = document.getElementById('detail-current-patients');
    const totalCapacityElem = document.getElementById('detail-total-capacity');
    const descriptionElem = document.getElementById('detail-description');

    const medicalStaffElem = document.getElementById('detail-medical-staff');
    const equipmentCountElem = document.getElementById('detail-equipment-count');
    const closedHoursElem = document.getElementById('detail-closed-hours');

    const reservationDepartmentSelect = document.getElementById('reservation-department');
    const reservationDateInput = document.getElementById('reservation-date');
    const reservationTimeInput = document.getElementById('reservation-time');
    const reservationForm = document.getElementById('reservation-form');

    const hospitalPostsContainer = document.getElementById('hospital-posts');
    const postForm = document.getElementById('post-form');
    const postTitleInput = document.getElementById('post-title');
    const postContentInput = document.getElementById('post-content');

    let currentHospital = null;

    // 1. 병원 상세 데이터 로드 및 렌더링 (기존과 동일, 병원 정보 추가 필드 포함)
    async function fetchHospitalDetail(id) {
        try {
            const response = await fetch(`http://localhost:3000/api/hospitals/${id}`);
            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('병원 정보를 찾을 수 없습니다.');
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const hospital = await response.json();
            currentHospital = hospital;

            hospitalNameElem.textContent = hospital.name;
            departmentElem.textContent = hospital.department.join(', ');
            addressElem.textContent = hospital.location.address;
            phoneElem.textContent = hospital.phone;
            openingHoursElem.textContent = hospital.openingHours;
            currentPatientsElem.textContent = hospital.currentPatients;
            totalCapacityElem.textContent = hospital.totalCapacity;
            descriptionElem.textContent = hospital.description;

            medicalStaffElem.textContent = `의사: ${hospital.medicalStaffCount.doctors}명, 간호사: ${hospital.medicalStaffCount.nurses}명`;
            equipmentCountElem.textContent = `의료 장비: ${hospital.equipmentCount.medicalEquipment}개, 의약품: ${hospital.equipmentCount.pharmaceuticals}종`;
            closedHoursElem.textContent = hospital.closedHours.join(', ');

            reservationDepartmentSelect.innerHTML = hospital.department.map(dept => `<option value="${dept}">${dept}</option>`).join('');

            await fetchPosts(id);

        } catch (error) {
            console.error('병원 상세 정보를 불러오는 데 실패했습니다:', error);
            alert('병원 정보를 불러오는 데 오류가 발생했습니다: ' + error.message);
            window.location.href = 'index.html';
        }
    }

    // 2. 예약 기능 (기존과 동일)
    reservationForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        if (!currentHospital) {
            alert('병원 정보를 찾을 수 없습니다. 다시 시도해주세요.');
            return;
        }

        const authToken = localStorage.getItem('authToken');
        if (!authToken) {
            alert('로그인이 필요합니다. 로그인 페이지로 이동합니다.');
            window.location.href = 'login.html';
            return;
        }

        const selectedDepartment = reservationDepartmentSelect.value;
        const selectedDate = reservationDateInput.value;
        const selectedTime = reservationTimeInput.value;

        if (!selectedDepartment || !selectedDate || !selectedTime) {
            alert('진료 과목, 날짜, 시간을 모두 선택해주세요.');
            return;
        }

        const newReservation = {
            hospitalId: currentHospital.id,
            department: selectedDepartment,
            date: selectedDate,
            time: selectedTime,
        };

        try {
            const response = await fetch('http://localhost:3000/api/reservations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify(newReservation),
            });
            
            const data = await response.json();

            if (response.ok) {
                alert('진료 예약이 완료되었습니다!');
                reservationForm.reset();
                window.location.href = 'mypage.html';
            } else {
                alert(`예약 실패: ${data.message || '알 수 없는 오류 발생'}`);
            }

        } catch (error) {
            console.error('예약 중 오류 발생:', error);
            alert('예약 중 네트워크 오류가 발생했습니다. 백엔드 서버가 실행 중인지 확인해주세요.');
        }
    });

    // 3. 게시글 렌더링 (백엔드에서 가져오기)
    async function fetchPosts(hospitalId) {
        try {
            const response = await fetch(`http://localhost:3000/api/hospitals/${hospitalId}/posts`);
            if (!response.ok) {
                throw new Error(`게시글 정보를 불러오는 데 실패했습니다: ${response.status}`);
            }
            const posts = await response.json();
            displayPosts(posts);
        } catch (error) {
            console.error('게시글 정보를 불러오는 데 실패했습니다:', error);
            hospitalPostsContainer.innerHTML = '<p>게시글 정보를 불러올 수 없습니다.</p>';
        }
    }

    function displayPosts(postsToDisplay) {
        hospitalPostsContainer.innerHTML = '';

        if (postsToDisplay.length === 0) {
            hospitalPostsContainer.innerHTML = '<p>아직 등록된 게시글이 없습니다.</p>';
            return;
        }

        postsToDisplay.forEach(post => {
            const postCard = document.createElement('div');
            postCard.className = 'post-card';
            postCard.innerHTML = `
                <h4>${post.title}</h4>
                <p><strong>작성자:</strong> ${post.username}</p>
                <p>${post.content}</p>
                <p class="post-date">${new Date(post.createdAt).toLocaleDateString()}</p>
            `;
            hospitalPostsContainer.appendChild(postCard);
        });
    }

    // 4. 게시글 작성 기능
    postForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const authToken = localStorage.getItem('authToken');
        if (!authToken) {
            alert('로그인이 필요합니다. 로그인 후 게시글을 작성할 수 있습니다.');
            window.location.href = 'login.html';
            return;
        }

        const title = postTitleInput.value.trim();
        const content = postContentInput.value.trim();

        if (!title || !content) {
            alert('제목과 내용을 모두 입력해주세요.');
            return;
        }

        try {
            const response = await fetch(`http://localhost:3000/api/hospitals/${hospitalId}/posts`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify({ title, content }),
            });

            const data = await response.json();

            if (response.ok) {
                alert('게시글이 성공적으로 작성되었습니다!');
                postForm.reset();
                await fetchPosts(hospitalId);
            } else {
                alert(`게시글 작성 실패: ${data.message || '알 수 없는 오류 발생'}`);
            }

        } catch (error) {
            console.error('게시글 작성 중 오류 발생:', error);
            alert('게시글 작성 중 네트워크 오류가 발생했습니다. 백엔드 서버가 실행 중인지 확인해주세요.');
        }
    });

    fetchHospitalDetail(hospitalId);
});
