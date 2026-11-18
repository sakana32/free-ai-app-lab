# 0円で動く自律アプリ開発ラボ（実験用）

GitHub Actions と Gemini API の無料枠を使い、毎日1回、市場の手がかりを調べて小さな日本語Webアプリを改良する実験です。

## 初期設定

1. GitHub にサインアップし、`free-ai-app-lab` という**Public**リポジトリを作る。`Add a README file` はオフでもオンでも構いません（このZIPのREADMEで上書きします）。
2. このZIPを展開し、**中のファイルと `.github` フォルダ**をリポジトリの `Add file` → `Upload files` にドラッグして保存する。**ZIPファイルそのものをアップロードしない**。アップロード後 `.github/workflows/daily-agent.yml` の存在を確認。
3. Google AI Studio `https://aistudio.google.com/api-keys` で、**課金設定のない無料枠プロジェクト**の Gemini API キーを発行する。課金アップグレードはしない。
4. GitHubのリポジトリで `Settings` → `Secrets and variables` → `Actions` → `New repository secret`。名前は `GEMINI_API_KEY`、Valueにキーを貼って保存。キーをREADMEやチャットに貼らない。
5. `Settings` → `Pages` → `Build and deployment` → `Source` は **GitHub Actions** を選択する。
6. `Actions` → `Free Autonomous App Lab` → `Run workflow` → 緑の実行を選ぶ。初回の実行が緑になれば、`Settings` → `Pages` に公開URLが表示される。
7. 以降は毎日13:17頃（日本時間）にGitHub側が実行。`PROGRESS.md` と `RESEARCH.md` でAIの仕事を確認。

**失敗した場合**： `Actions` → 該当実行 → 赤いステップを開いてエラーを読む。無料APIの利用制限、APIキーの誤り、モデルの利用可否、AI出力の形式エラー、GitHub Pages設定などが原因になり得ます。

## この仕組みの機能

- Hacker Newsの**公開コメント**から小規模な需要の手がかりを収集（市場調査の一部分でしかありません）。
- Geminiが日本語アプリを企画し、既存のコードを読みながら毎回小さく改善。
- `index.html`、`style.css`、`app.js` だけを生成。外部API・アカウント・データ送信は作らせない。
- 実行環境でJavaScript構文などを最低限確認した場合だけコードをコミットし、GitHub Pagesに公開。
- リポジトリの `MISSION.md` を編集すれば目標を変更可能。

## 制限と重要な注意

- **安全性や実際の動作まで自動検証できるわけではありません。** 本番事業、決済、機密データ、医療・金融・法律用途には使わないでください。
- AIが作るのは静的なWebアプリです。スマホ・PCブラウザで動作し、データは各端末のブラウザに保存されます。
- 公開リポジトリなのでソースコードと進捗は誰でも閲覧可能。秘密情報は絶対に書かないでください。
- 無料枠には回数・速度制限があり、制限を超えれば**停止**します。必ずAPIプロジェクトを無料枠のままにしてください。
- GitHubの定期実行は遅延・停止することがあり、永久稼働の保証はありません。
- GitHub Pages上で公開されるアプリは誰でもアクセスできます。公開前に完全な安全確認はしていないので、定期的に人間が確認してください。
- 毎日新しいアプリを作り続けるのではなく、1つを継続改善する設計です。

## 停止するには

GitHubリポジトリ → `Actions` → `Free Autonomous App Lab` → メニュー → `Disable workflow`。サイト公開を止める場合は `Settings` → `Pages` も確認します。

## ファイル一覧

- `.github/workflows/daily-agent.yml`：毎日実行と公開を担当
- `agent.py`：調査、AIへの指示、コード検査、進捗保存
- `MISSION.md`：オーナーの指示
- `index.html`、`style.css`、`app.js`：AIが改良するWebアプリ
- `state.json`（初回実行後）：何回目か、現在の製品名
- `PROGRESS.md`、`RESEARCH.md`（初回実行後）：活動記録
