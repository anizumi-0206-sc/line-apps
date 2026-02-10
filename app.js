// ▼▼▼ 設定エリア (書き換えてください) ▼▼▼
const MY_LIFF_ID = "2009080549-aia5HOne"; 
const BASE_URL   = "https://exaggerative-zavier-nonfluidly.ngrok-free.de/register"; // ngrokのURL
// ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲

let lineProfile = null;
let calendar = null; // カレンダーオブジェクト

async function main() {
    try {
        await liff.init({ liffId: MY_LIFF_ID });
        if (!liff.isLoggedIn()) { liff.login(); return; }

        const profile = await liff.getProfile();
        lineProfile = profile;

        // ユーザー状態を確認
        try {
            const response = await fetch(`${BASE_URL}/check_user`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'ngrok-skip-browser-warning': 'true'
                },
                body: JSON.stringify({ userId: profile.userId })
            });

            if (!response.ok) throw new Error("API Error");
            const userStatus = await response.json();

            // ローディング消去
            document.getElementById('loading').style.display = 'none';

            // ★ 振り分け処理
            if (userStatus.status === 'registered') {
                if (userStatus.role === 'student') {
                    // 学生 -> カレンダー表示
                    showStudentCalendar(userStatus.name);
                } else {
                    // 教師 -> 管理画面表示
                    document.getElementById('teacher-page').style.display = 'block';
                }
            } else {
                // 未登録 -> 登録フォーム
                showRegistrationForm(profile);
            }

        } catch (e) {
            alert("エラー: " + e.message);
        }
    } catch (err) {
        alert("LIFF初期化エラー: " + err);
    }
}

// --------------------------------------------------
// 画面表示関数
// --------------------------------------------------
function showRegistrationForm(profile) {
    document.getElementById('display-name').innerText = profile.displayName;
    if (profile.pictureUrl) document.getElementById('profile-img').src = profile.pictureUrl;
    document.getElementById('registration-form').style.display = 'block';
}

function showStudentCalendar(userName) {
    document.getElementById('student-page').style.display = 'block';
    
    // カレンダーの初期化 (FullCalendar)
    const calendarEl = document.getElementById('calendar');
    calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth', // 月表示
        locale: 'ja',                // 日本語化
        headerToolbar: {
            left: 'prev,next',
            center: 'title',
            right: 'today'
        },
        height: 'auto',
        // イベント(予定)の仮データ
        events: [
            { title: '面談練習', start: '2026-02-15', color: '#ff9f89' },
            { title: '提出日', start: '2026-02-20', color: '#3788d8' }
        ],
        // 日付をクリックした時の処理
        dateClick: function(info) {
            alert('選択された日付: ' + info.dateStr);
            // 次のステップでここに予約処理を書きます
        }
    });
    calendar.render();
}

// --------------------------------------------------
// 登録関連の処理 (前回と同じ)
// --------------------------------------------------
window.toggleTeacherAuth = function(isTeacher) {
    const authArea = document.getElementById('teacher-auth-area');
    authArea.style.display = isTeacher ? 'block' : 'none';
    if (!isTeacher) document.getElementById('teacher-pass').value = "";
};

window.registerUser = async function() {
    const roleEl = document.querySelector('input[name="role"]:checked');
    if (!roleEl) return alert("役割が選択されていません");
    const role = roleEl.value;

    if (role === 'teacher') {
        if (document.getElementById('teacher-pass').value !== "anabuki-js27") {
            return alert("パスワードが違います");
        }
    }

    const btn = document.querySelector('.btn-primary');
    btn.disabled = true;
    btn.innerText = "送信中...";

    try {
        const response = await fetch(`${BASE_URL}/register`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'ngrok-skip-browser-warning': 'true'
            },
            body: JSON.stringify({
                userId: lineProfile.userId,
                displayName: lineProfile.displayName,
                role: role
            })
        });
        const result = await response.json();
        
        if (result.status === 'success') {
            document.getElementById('registration-form').style.display = 'none';
            document.getElementById('complete-message').style.display = 'block';
        } else {
            alert("登録失敗: " + result.message);
            btn.disabled = false;
        }
    } catch (error) {
        alert("エラー: " + error);
        btn.disabled = false;
    }
};

main();
