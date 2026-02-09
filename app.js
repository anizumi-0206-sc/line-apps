// 教師用パスワードエリアの表示/非表示を切り替える関数
function toggleTeacherAuth(isTeacher) {
    const authArea = document.getElementById('teacher-auth-area');
    if (isTeacher) {
        authArea.style.display = 'block';
    } else {
        authArea.style.display = 'none';
        document.getElementById('teacher-pass').value = ""; // 学生に戻したらリセット
    }
}

async function registerUser() {
    // 選択されているロールを取得
    const role = document.querySelector('input[name="role"]:checked').value;
    
    // --- 追加ここから: パスワードチェック ---
    if (role === 'teacher') {
        const pass = document.getElementById('teacher-pass').value;
        // パスワードが一致しない場合
        if (pass !== "anabuki-js27") {
            alert("パスワードが違います。\n教師登録は許可された人のみ可能です。");
            return; // 処理をここで中断
        }
    }
    // --- 追加ここまで ---

    const profile = window.lineProfile;

    // 以下、送信処理（変更なし）
    const btn = document.querySelector('.btn-primary');
    btn.disabled = true;
    btn.innerText = "送信中...";

    try {
        // 仮の成功アラート
        alert(`【認証成功】\n${profile.displayName} さんを [${role}] として登録します。`);

        // TODO: ここにStep 3で作る fetch() 処理が入ります

        document.getElementById('registration-form').style.display = 'none';
        document.getElementById('complete-message').style.display = 'block';

    } catch (error) {
        console.error(error);
        alert("エラーが発生しました。");
        btn.disabled = false;
        btn.innerText = "連携を開始する";
    }
}