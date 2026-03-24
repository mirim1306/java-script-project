const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = 3000;
const JWT_SECRET = 'your_jwt_secret_key';

// 미들웨어 설정
app.use(cors());
app.use(bodyParser.json());

// 더미 데이터
let users = [];
let hospitals = [
    {
        "id": "H001",
        "name": "서울튼튼병원",
        "location": { "address": "서울특별시 강남구 테헤란로 123", "latitude": 37.4979, "longitude": 127.0276 },
        "department": ["내과", "정형외과", "피부과"],
        "currentPatients": 12,
        "totalCapacity": 30,
        "phone": "02-1234-5678",
        "openingHours": "평일 09:00~18:00, 토 09:00~13:00",
        "description": "친절한 진료와 첨단 장비를 갖춘 서울 강남의 대표 병원입니다.",
        "rating": 4.5,
        "medicalStaffCount": { "doctors": 10, "nurses": 20 },
        "equipmentCount": { "medicalEquipment": 50, "pharmaceuticals": 1000 },
        "closedHours": ["일요일", "공휴일", "점심시간 12:30~13:30"]
    },
    {
        "id": "H002",
        "name": "강남굿닥터의원",
        "location": { "address": "서울특별시 강남구 봉은사로 456", "latitude": 37.5089, "longitude": 127.0600 },
        "department": ["피부과", "이비인후과", "소아청소년과"],
        "currentPatients": 5,
        "totalCapacity": 15,
        "phone": "02-9876-5432",
        "openingHours": "평일 10:00~19:00",
        "description": "피부 질환 전문의가 상주하며 꼼꼼한 진료를 제공합니다.",
        "rating": 4.2,
        "medicalStaffCount": { "doctors": 3, "nurses": 5 },
        "equipmentCount": { "medicalEquipment": 15, "pharmaceuticals": 300 },
        "closedHours": ["토요일", "일요일", "점심시간 13:00~14:00"]
    },
    {
        "id": "H003",
        "name": "종로바로병원",
        "location": { "address": "서울특별시 종로구 종로 789", "latitude": 37.5700, "longitude": 126.9800 },
        "department": ["정형외과", "신경외과"],
        "currentPatients": 8,
        "totalCapacity": 25,
        "phone": "02-2345-6789",
        "openingHours": "평일 09:30~17:30",
        "description": "관절 및 척추 질환에 특화된 병원으로, 재활 치료도 가능합니다.",
        "rating": 4.7,
        "medicalStaffCount": { "doctors": 7, "nurses": 15 },
        "equipmentCount": { "medicalEquipment": 40, "pharmaceuticals": 800 },
        "closedHours": ["일요일", "점심시간 12:00~13:00"]
    },
    {
        "id": "H004",
        "name": "마포우리내과",
        "location": { "address": "서울특별시 마포구 마포대로 101", "latitude": 37.5400, "longitude": 126.9500 },
        "department": ["내과", "가정의학과"],
        "currentPatients": 7,
        "totalCapacity": 20,
        "phone": "02-3456-7890",
        "openingHours": "평일 09:00~18:30, 토 09:00~12:00",
        "description": "든든한 주치의가 되어드리는 편안한 내과입니다.",
        "rating": 4.0,
        "medicalStaffCount": { "doctors": 4, "nurses": 8 },
        "equipmentCount": { "medicalEquipment": 20, "pharmaceuticals": 500 },
        "closedHours": ["일요일", "공휴일", "점심시간 12:30~13:30"]
    },
    {
        "id": "H005",
        "name": "미림보건실",
        "location": { "address": "서울특별시 관악구 호암로 546", "latitude": 37.4727, "longitude": 126.9366 },
        "department": ["안정실", "상담실", "진료실"],
        "currentPatients": 0,
        "totalCapacity": 2,
        "phone": "02-872-4071",
        "openingHours": "화~목 09:00~16:50, 월,금 09:00~16:00",
        "description": "미림의 편안한 보건실입니다. 학생과 교직원의 건강을 책임집니다.",
        "rating": 4.8,
        "medicalStaffCount": { "doctors": 1, "nurses": 0 },
        "equipmentCount": { "medicalEquipment": 2, "pharmaceuticals": 100 },
        "closedHours": ["토요일", "일요일", "공휴일", "점심시간 12:30~13:30"]
    }
];

let reservations = [];
let hospitalPosts = [ // 병원 상세 페이지 게시판 더미 데이터 (병원 ID와 연결)
    { postId: "P001", hospitalId: "H001", userId: "U001", username: "testuser", title: "진료 후기 남깁니다.", content: "원장님 친절하시고 진료 잘 봐주셨어요!", createdAt: "2025-06-01T10:00:00Z" },
    { postId: "P002", hospitalId: "H001", userId: "U002", username: "guestuser", title: "주차 정보 문의", content: "병원 주차장은 어떻게 이용하나요?", createdAt: "2025-06-03T14:30:00Z" },
    { postId: "P003", hospitalId: "H002", userId: "U001", username: "testuser", title: "새로운 소식", content: "강남굿닥터의원에서 여름 이벤트 진행한대요!", createdAt: "2025-06-05T09:15:00Z" }
];

let boardPosts = [ // 전체 자유 게시판 더미 데이터
    { boardPostId: "BP001", userId: "U001", username: "testuser", title: "자유 게시판 첫 글입니다!", content: "안녕하세요. 이 게시판은 병원과 관계없는 자유로운 주제로 글을 쓸 수 있습니다.", createdAt: "2025-06-15T11:00:00Z" },
    { boardPostId: "BP002", userId: "U002", username: "guestuser", title: "날씨가 좋네요", content: "오늘 날씨 정말 좋네요! 다들 좋은 하루 보내세요.", createdAt: "2025-06-15T15:00:00Z" }
];

let publicAdvertisements = [ // 공익 광고 더미 데이터
    { adId: "PUBAD001", title: "헌혈은 사랑입니다. 지금 바로 참여하세요!", link: "https://www.bloodinfo.net/knrcbs/main.do", description: "헌혈은 소중한 생명을 살리는 가장 쉬운 방법입니다. 가까운 헌혈의 집을 방문하세요." },
    { adId: "PUBAD002", title: "국경없는 의사회 정기 후원, 당신의 도움이 필요합니다", link: "https://msf.or.kr/?NaPm=ct%3Dmbyw5dhk%7Cci%3Dcheckout%7Ctr%3Dds%7Ctrx%3Dnull%7Chk%3D98240739f5b5c2c780b0b1156ea1fe6d7b1131a9", description: "정기 후원은 국경없는 의사회가 도움이 필요한 현장에 양질의 의료 지원을 꾸준히 제공할 수 있게 해주는 중요한 원동력 입니다." },
    { adId: "PUBAD003", title: "금연! 지금 바로 시작하세요", link: "https://www.nosmokeguide.go.kr/index.do", description: "건강한 삶을 위한 첫 걸음, 금연 클리닉에서 도와드립니다." }
];


// --- JWT 인증 미들웨어 ---
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// 1. 회원가입
app.post('/api/register', (req, res) => {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
        return res.status(400).json({ message: '모든 필드를 입력해주세요.' });
    }
    if (users.find(u => u.username === username || u.email === email)) {
        return res.status(409).json({ message: '이미 존재하는 아이디 또는 이메일입니다.' });
    }
    const newUser = {
        id: `U${Date.now()}`,
        username,
        email,
        password
    };
    users.push(newUser);
    console.log('새 사용자 등록:', newUser);
    res.status(201).json({ message: '회원가입이 성공적으로 완료되었습니다.' });
});

// 2. 로그인
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const user = users.find(u => u.username === username);
    if (!user || user.password !== password) {
        return res.status(401).json({ message: '아이디 또는 비밀번호가 올바르지 않습니다.' });
    }
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ message: '로그인 성공!', token, user: { id: user.id, username: user.username, email: user.email } });
});

// 3. 현재 로그인된 사용자 정보 조회 (인증 필요)
app.get('/api/user/me', authenticateToken, (req, res) => {
    const user = users.find(u => u.id === req.user.id);
    if (!user) {
        return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    }
    res.json({ id: user.id, username: user.username, email: user.email });
});

// 4. 모든 병원 목록 조회
app.get('/api/hospitals', (req, res) => {
    hospitals.forEach(hospital => {
        hospital.currentPatients = Math.floor(Math.random() * (hospital.totalCapacity + 1));
    });
    res.json(hospitals);
});

// 5. 특정 병원 상세 정보 조회
app.get('/api/hospitals/:id', (req, res) => {
    const hospitalId = req.params.id;
    const hospital = hospitals.find(h => h.id === hospitalId);
    if (!hospital) {
        return res.status(404).json({ message: '병원을 찾을 수 없습니다.' });
    }
    hospital.currentPatients = Math.floor(Math.random() * (hospital.totalCapacity + 1));
    res.json(hospital);
});

// 6. 예약 생성 (인증 필요)
app.post('/api/reservations', authenticateToken, (req, res) => {
    const { hospitalId, department, date, time } = req.body;
    const userId = req.user.id;
    const username = req.user.username;

    if (!hospitalId || !department || !date || !time) {
        return res.status(400).json({ message: '모든 예약 정보를 입력해주세요.' });
    }

    const hospital = hospitals.find(h => h.id === hospitalId);
    if (!hospital) {
        return res.status(404).json({ message: '존재하지 않는 병원입니다.' });
    }

    const newReservation = {
        reservationId: `R${Date.now()}`,
        userId,
        username,
        hospitalId,
        department,
        date,
        time,
        status: "예약 완료",
        hospitalName: hospital.name,
        createdAt: new Date().toISOString()
    };
    reservations.push(newReservation);
    console.log('새 예약 생성:', newReservation);
    res.status(201).json({ message: '예약이 성공적으로 완료되었습니다.', reservation: newReservation });
});

// 7. 사용자별 예약 내역 조회 (인증 필요)
app.get('/api/reservations', authenticateToken, (req, res) => {
    const userId = req.user.id;
    const userReservations = reservations.filter(res => res.userId === userId);
    res.json(userReservations);
});

// 8. 예약 취소 (인증 필요)
app.delete('/api/reservations/:id', authenticateToken, (req, res) => {
    const reservationId = req.params.id;
    const userId = req.user.id;

    const reservationIndex = reservations.findIndex(res => res.reservationId === reservationId && res.userId === userId);

    if (reservationIndex === -1) {
        return res.status(404).json({ message: '예약을 찾을 수 없거나 취소 권한이 없습니다.' });
    }

    reservations.splice(reservationIndex, 1);
    console.log(`예약 취소됨: ${reservationId} (사용자: ${userId})`);
    res.status(200).json({ message: '예약이 성공적으로 취소되었습니다.' });
});

// 9. 특정 병원의 게시글 조회
app.get('/api/hospitals/:id/posts', (req, res) => {
    const hospitalId = req.params.id;
    const postsForHospital = hospitalPosts.filter(post => post.hospitalId === hospitalId);
    res.json(postsForHospital);
});

// 10. 특정 병원의 게시글 작성
app.post('/api/hospitals/:id/posts', authenticateToken, (req, res) => {
    const hospitalId = req.params.id;
    const { title, content } = req.body;
    const userId = req.user.id;
    const username = req.user.username;

    if (!title || !content) {
        return res.status(400).json({ message: '제목과 내용을 모두 입력해주세요.' });
    }

    const hospital = hospitals.find(h => h.id === hospitalId);
    if (!hospital) {
        return res.status(404).json({ message: '존재하지 않는 병원입니다.' });
    }

    const newPost = {
        postId: `HPOST${Date.now()}`,
        hospitalId,
        userId,
        username,
        title,
        content,
        createdAt: new Date().toISOString()
    };
    hospitalPosts.push(newPost);
    console.log('새 병원 게시글 작성:', newPost);
    res.status(201).json({ message: '게시글이 성공적으로 작성되었습니다.', post: newPost });
});

// 11. 전체 자유 게시판 게시글 조회
app.get('/api/board-posts', (req, res) => {
    res.json(boardPosts);
});

// 12. 전체 자유 게시판 게시글 작성 (인증 필요)
app.post('/api/board-posts', authenticateToken, (req, res) => {
    const { title, content } = req.body;
    const userId = req.user.id;
    const username = req.user.username;

    if (!title || !content) {
        return res.status(400).json({ message: '제목과 내용을 모두 입력해주세요.' });
    }

    const newBoardPost = {
        boardPostId: `BPOST${Date.now()}`,
        userId,
        username,
        title,
        content,
        createdAt: new Date().toISOString()
    };
    boardPosts.push(newBoardPost);
    console.log('새 자유 게시글 작성:', newBoardPost);
    res.status(201).json({ message: '게시글이 성공적으로 작성되었습니다.', post: newBoardPost });
});

// 13. 공익 광고 목록 조회
app.get('/api/public-ads', (req, res) => {
    res.json(publicAdvertisements);
});

// 서버 시작
app.listen(PORT, () => {
    console.log(`백엔드 서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
});
