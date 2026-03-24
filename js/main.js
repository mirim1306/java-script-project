document.addEventListener('DOMContentLoaded', () => {
    // 기존 요소들
    const hospitalListContainer = document.getElementById('hospital-list');
    const searchInput = document.getElementById('hospital-search-input');
    const searchButton = document.getElementById('search-button');
    const categoryButtons = document.querySelectorAll('.category-btn');

    // 섹션 요소들
    const hospitalListSection = document.getElementById('hospital-list-section');
    const boardMainSection = document.getElementById('board-main-section');
    const adMainSection = document.getElementById('ad-main-section');

    // 목록 컨테이너
    const boardListContainer = document.getElementById('board-list-container');
    const publicAdListContainer = document.getElementById('public-ad-list');

    // 게시글 작성 폼 요소
    const boardPostForm = document.getElementById('board-post-form');
    const boardPostTitleInput = document.getElementById('board-post-title');
    const boardPostContentInput = document.getElementById('board-post-content');

    let allHospitals = [];
    let filteredHospitals = [];

    // --- 섹션 전환 함수 ---
    function showSection(sectionId) {
        document.querySelectorAll('.content-section').forEach(section => {
            section.style.display = 'none';
        });
        document.getElementById(sectionId).style.display = 'block';
    }

    // 1. 병원 데이터 로드 및 초기 렌더링 (기존과 동일)
    async function fetchHospitals() {
        try {
            const response = await fetch('http://localhost:3000/api/hospitals');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            allHospitals = data;
            filteredHospitals = [...allHospitals].sort((a, b) => b.rating - a.rating);
            renderHospitalCards(filteredHospitals);
            showSection('hospital-list-section');
        } catch (error) {
            console.error('병원 데이터를 불러오는 데 실패했습니다:', error);
            hospitalListContainer.innerHTML = '<p>병원 데이터를 불러올 수 없습니다. 잠시 후 다시 시도해주세요.</p>';
        }
    }

    // 2. 병원 카드 렌더링 함수 (기존과 동일)
    function renderHospitalCards(hospitalsToRender) {
        hospitalListContainer.innerHTML = '';
        if (hospitalsToRender.length === 0) {
            hospitalListContainer.innerHTML = '<p>검색 결과가 없습니다.</p>';
            return;
        }

        hospitalsToRender.forEach(hospital => {
            const card = document.createElement('div');
            card.className = 'hospital-card';
            card.innerHTML = `
                <h3>${hospital.name}</h3>
                <p>${hospital.department.join(', ')}</p>
                <p>${hospital.location.address}</p>
                <p class="current-patients">현재 진료 중: ${hospital.currentPatients}명 / ${hospital.totalCapacity}명</p>
                <button class="view-detail-btn" data-id="${hospital.id}">상세 정보</button>
            `;
            hospitalListContainer.appendChild(card);
        });

        hospitalListContainer.querySelectorAll('.view-detail-btn').forEach(button => {
            button.addEventListener('click', (event) => {
                const hospitalId = event.target.dataset.id;
                window.location.href = `hospital_detail.html?id=${hospitalId}`;
            });
        });
    }

    // 3. 검색 기능 (기존과 동일)
    searchButton.addEventListener('click', performSearch);
    searchInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            performSearch();
        }
    });

    function performSearch() {
        const query = searchInput.value.toLowerCase().trim();
        if (query === '') {
            filteredHospitals = [...allHospitals];
        } else {
            filteredHospitals = allHospitals.filter(hospital =>
                hospital.name.toLowerCase().includes(query) ||
                hospital.location.address.toLowerCase().includes(query) ||
                hospital.department.some(dept => dept.toLowerCase().includes(query)) ||
                hospital.description.toLowerCase().includes(query)
            );
        }
        renderHospitalCards(filteredHospitals);
    }

    // 4. 카테고리 필터링 및 섹션 전환
    categoryButtons.forEach(button => {
        button.addEventListener('click', async (event) => {
            categoryButtons.forEach(btn => btn.classList.remove('active'));
            event.target.classList.add('active');

            const category = event.target.dataset.category;

            if (category === 'hospital-list') {
                filteredHospitals = [...allHospitals];
                renderHospitalCards(filteredHospitals);
                showSection('hospital-list-section');
            } else if (category === 'popular') {
                filteredHospitals = [...allHospitals].sort((a, b) => b.rating - a.rating);
                renderHospitalCards(filteredHospitals);
                showSection('hospital-list-section');
            } else if (category === 'board') {
                await fetchAllBoardPosts();
                showSection('board-main-section');
            } else if (category === 'ad') {
                await fetchPublicAdvertisements();
                showSection('ad-main-section');
            }
        });
    });

    // --- 5. 전체 자유 게시판 게시글 로드 및 렌더링 함수 ---
    async function fetchAllBoardPosts() {
        try {
            const response = await fetch('http://localhost:3000/api/board-posts');
            if (!response.ok) {
                throw new Error(`전체 게시글을 불러오는 데 실패했습니다: ${response.status}`);
            }
            const posts = await response.json();
            displayAllBoardPosts(posts);
        } catch (error) {
            console.error('전체 게시글을 불러오는 데 실패했습니다:', error);
            boardListContainer.innerHTML = '<p>게시글을 불러오는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.</p>';
        }
    }

    function displayAllBoardPosts(postsToDisplay) {
        boardListContainer.innerHTML = '';
        if (postsToDisplay.length === 0) {
            boardListContainer.innerHTML = '<p>아직 등록된 게시글이 없습니다.</p>';
            return;
        }
        postsToDisplay.forEach(post => {
            const postItem = document.createElement('div');
            postItem.className = 'board-post-item';
            postItem.innerHTML = `
                <h4>${post.title}</h4>
                <p><strong>작성자:</strong> ${post.username || '알 수 없음'}</p>
                <p>${post.content}</p>
                <p class="post-date">${new Date(post.createdAt).toLocaleDateString()}</p>
            `;
            boardListContainer.appendChild(postItem);
        });
    }

    // --- 6. 전체 자유 게시판 게시글 작성 기능 ---
    boardPostForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const authToken = localStorage.getItem('authToken');
        if (!authToken) {
            alert('로그인이 필요합니다. 로그인 후 게시글을 작성할 수 있습니다.');
            window.location.href = 'login.html';
            return;
        }

        const title = boardPostTitleInput.value.trim();
        const content = boardPostContentInput.value.trim();

        if (!title || !content) {
            alert('제목과 내용을 모두 입력해주세요.');
            return;
        }

        try {
            const response = await fetch('http://localhost:3000/api/board-posts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify({ title, content }),
            });

            const data = await response.json();

            if (response.ok) {
                alert('게시글이 성공적으로 등록되었습니다!');
                boardPostForm.reset();
                await fetchAllBoardPosts();
            } else {
                alert(`게시글 등록 실패: ${data.message || '알 수 없는 오류 발생'}`);
            }

        } catch (error) {
            console.error('게시글 등록 중 오류 발생:', error);
            alert('게시글 등록 중 네트워크 오류가 발생했습니다. 백엔드 서버가 실행 중인지 확인해주세요.');
        }
    });

    // --- 7. 공익 광고 로드 및 렌더링 함수 ---
    async function fetchPublicAdvertisements() {
        try {
            const response = await fetch('http://localhost:3000/api/public-ads');
            if (!response.ok) {
                throw new Error(`공익 광고를 불러오는 데 실패했습니다: ${response.status}`);
            }
            const ads = await response.json();
            displayPublicAdvertisements(ads);
        } catch (error) {
            console.error('공익 광고를 불러오는 데 실패했습니다:', error);
            publicAdListContainer.innerHTML = '<p>공익 광고를 불러오는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.</p>';
            // 오류 시에도 더미 데이터로 보여주기 (필요하다면)
            const dummyAds = [
                { adId: "PUBAD001", title: "헌혈은 사랑입니다. 지금 바로 참여하세요!", link: "https://www.bloodinfo.net/knrcbs/main.do", description: "헌혈은 소중한 생명을 살리는 가장 쉬운 방법입니다. 가까운 헌혈의 집을 방문하세요." },
                { adId: "PUBAD002", title: "국경없는 의사회 정기 후원, 당신의 도움이 필요합니다", link: "https://msf.or.kr/?NaPm=ct%3Dmbyw5dhk%7Cci%3Dcheckout%7Ctr%3Dds%7Ctrx%3Dnull%7Chk%3D98240739f5b5c2c780b0b1156ea1fe6d7b1131a9", description: "정기 후원은 국경없는 의사회가 도움이 필요한 현장에 양질의 의료 지원을 꾸준히 제공할 수 있게 해주는 중요한 원동력 입니다." }
            ];
            displayPublicAdvertisements(dummyAds);
        }
    }
    
    function displayPublicAdvertisements(adsToDisplay) {
        publicAdListContainer.innerHTML = '';
        if (adsToDisplay.length === 0) {
            publicAdListContainer.innerHTML = '<p>현재 등록된 공익 광고가 없습니다.</p>';
            return;
        }
        adsToDisplay.forEach(ad => {
            const adItem = document.createElement('div');
            adItem.className = 'public-ad-item';
            adItem.innerHTML = `
                <h4><a href="${ad.link}" target="_blank">${ad.title}</a></h4>
                <p>${ad.description}</p>
            `;
            publicAdListContainer.appendChild(adItem);
        });
    }

    fetchHospitals();
});
