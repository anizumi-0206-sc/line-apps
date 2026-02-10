// ▼▼▼ 設定エリア ▼▼▼
const MY_LIFF_ID = "2009080549-aia5HOne"; 
const BASE_URL   = "https://exaggerative-zavier-nonfluidly.ngrok-free.dev/"; // ngrokのURL
// ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲

let lineProfile = null;
let calendar = null;

async function main() {
    try {
        await liff.init({ liffId: MY_LIFF_ID });
        if (!liff.isLoggedIn()) { liff.login(); return; }

        const profile = await liff.getProfile();
        lineProfile = profile;

        try {
            const response = await fetch(`${BASE_URL}/check_user`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'ngrok-skip-browser-warning': 'true'
                },
                body: JSON.stringify({ userId: profile.userId })
            });

            const userStatus = await response.json();
            document.getElementById('loading').style.display = 'none';

            if (userStatus.status === 'registered') {
                if (userStatus.role === 'student') {
                    showStudentCalendar(userStatus.name);
                } else {
                    showTeacherDashboard(userStatus.name);
                }
            } else {
                showRegistrationForm(profile);
            }

        } catch (e) {
            alert("APIエラー: " + e.message);
        }
    } catch (err) {
        alert("LIFF初期化エラー: " + err);
    }
}

// --------------------------------------------------
// 共通: イベント取得
// --------------------------------------------------
async function fetchEvents(info, successCallback, failureCallback) {
    try {
        const res = await fetch(`${BASE_URL}/get_schedules`, {
            headers: { 'ngrok-skip-browser-warning': 'true' }
        });
        const events = await res.json();
        successCallback(events);
    } catch (e) {
        failureCallback(e);
    }
}

// --------------------------------------------------
// 学生用カレンダー
// --------------------------------------------------
function showStudentCalendar(userName) {
    document.getElementById('student-page').style.display = 'block';
    
    const calendarEl = document.getElementById('calendar');
    calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        locale: 'ja',
        height: 'auto',
        events: fetchEvents, 

        // 日付クリックで予約 (時間入力付き)
        dateClick: async function(info) {
            // 時間を入力させる
            const timeStr = prompt(`${info.dateStr} の希望時間を入力してください (例: 10:00)`);
            if (!timeStr) return; // キャンセルされたら終了

            const confirmMsg = `${info.dateStr} ${timeStr} に予約を申請しますか？`;
            if (!confirm(confirmMsg)) return;

            try {
                const res = await fetch(`${BASE_URL}/book`, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'ngrok-skip-browser-warning': 'true'
                    },
                    body: JSON.stringify({
                        userId: lineProfile.userId,
                        userName: lineProfile.displayName,
                        date: info.dateStr,
                        time: timeStr // 時間も送る
                    })
                });
                const result = await res.json();
                if (result.status === 'success') {
                    alert("申請しました！\n先生の承認をお待ちください。");
                    calendar.refetchEvents();
                } else {
                    alert("エラー: " + result.message);
                }
            } catch (e) {
                alert("通信エラー: " + e);
            }
        },
        
        // 自分の予定をタップした時
        eventClick: function(info) {
            const status = info.event.extendedProps.status;
            const statusText = status === 1 ? "【確定済み】" : "【申請中】";
            alert(`${statusText}\n日時: ${info.event.startStr} ${info.event.extendedProps.time}`);
        }
    });
    calendar.render();
}

// --------------------------------------------------
// 教師用ダッシュボード (承認・削除・登録機能)
// --------------------------------------------------
function showTeacherDashboard(userName) {
    document.getElementById('teacher-page').style.display = 'block';
    
    const calendarEl = document.getElementById('teacher-calendar');
    calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        locale: 'ja',
        height: 'auto',
        events: fetchEvents,

        // 教師も予約を追加できるようにする
        dateClick: async function(info) {
            const timeStr = prompt(`【管理者登録】\n${info.dateStr} に予定を追加しますか？\n時間を入力してください (例: 13:00)`);
            if (!timeStr) return;

            try {
                const res = await fetch(`${BASE_URL}/book`, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'ngrok-skip-browser-warning': 'true'
                    },
                    body: JSON.stringify({
                        userId: lineProfile.userId,
                        userName: "管理者: " + lineProfile.displayName,
                        date: info.dateStr,
                        time: timeStr
                    })
                });
                const result = await res.json();
                if (result.status === 'success') {
                    alert("管理者予定を追加しました。");
                    calendar.refetchEvents();
                } else {
                    alert("エラー: " + result.message);
                }
            } catch (e) {
                alert("通信エラー: " + e);
            }
        },

        // 予約クリックで「承認」または「削除」
        eventClick: async function(info) {
            const eventObj = info.event;
            const props = eventObj.extendedProps;
            const statusText = props.status === 1 ? "確定済み" : "未確定(申請中)";
            
            // 選択肢を表示 (ブラウザ標準機能ではボタンを複数出せないので、promptで代用または確認ダイアログ連打)
            // ここではシンプルに confirm の分岐で実装します
            
            // 1. 削除しますか？
            if (confirm(`【${statusText}】\n${eventObj.title}\n日時: ${eventObj.startStr} ${props.time}\n\nこの予約を削除しますか？\n(キャンセルを押すと承認メニューに進みます)`)) {
                // 削除処理
                deleteSchedule(eventObj.id);
                eventObj.remove();
            } 
            // 2. 承認しますか？ (未確定の場合のみ)
            else if (props.status === 0) {
                if (confirm("では、この予約を【確定】してLINEを送りますか？")) {
                    const msg = prompt("学生へのメッセージを入力してください", "予約を受け付けました！当日お待ちしています。");
                    if (msg !== null) {
                        confirmSchedule(eventObj.id, msg);
                    }
                }
            }
        }
    });
    calendar.render();
}

// 予約削除処理
async function deleteSchedule(id) {
    try {
        await fetch(`${BASE_URL}/delete_schedule`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'ngrok-skip-browser-warning': 'true'
            },
            body: JSON.stringify({ id: id }) 
        });
        alert("削除しました。");
    } catch (e) {
        alert("削除エラー: " + e);
    }
}

// 予約確定処理
async function confirmSchedule(id, message) {
    try {
        const res = await fetch(`${BASE_URL}/confirm_schedule`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'ngrok-skip-browser-warning': 'true'
            },
            body: JSON.stringify({ id: id, message: message }) 
        });
        const result = await res.json();
        if (result.status === 'success') {
            alert("✅ 確定しました！学生にLINEを送りました。");
            calendar.refetchEvents(); // 色を変えるために再読み込み
        } else {
            alert("確定エラー: " + result.message);
        }
    } catch (e) {
        alert("通信エラー: " + e);
    }
}

// --------------------------------------------------
// 登録フォームなど (変更なし)
// --------------------------------------------------
function showRegistrationForm(profile) {
    document.getElementById('display-name').innerText = profile.displayName;
    if (profile.pictureUrl) document.getElementById('profile-img').src = profile.pictureUrl;
    document.getElementById('student-page').style.display = 'none';
    document.getElementById('teacher-page').style.display = 'none';
    document.getElementById('registration-form').style.display = 'block';
}

window.toggleTeacherAuth = function(isTeacher) {
    const authArea = document.getElementById('teacher-auth-area');
    authArea.style.display = isTeacher ? 'block' : 'none';
    if (!isTeacher) document.getElementById('teacher-pass').value = "";
};

window.registerUser = async function() {
    const roleEl = document.querySelector('input[name="role"]:checked');
    if (!roleEl) return alert("役割が選択されていません");
    const role = roleEl.value;
    if (role === 'teacher' && document.getElementById('teacher-pass').value !== "anabuki-js27") {
        return alert("パスワードが違います");
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
