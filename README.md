# 🎙️ VoiceCode.ai — Voice-Powered AI Coding Tutor

Learn to code by talking to an AI tutor. Your voice is transcribed, answered by
**Claude 3 Haiku on Amazon Bedrock**, and spoken back to you.

---

## 🏗️ Architecture

Custom voice pipeline — **no ElevenLabs Conversational AI Agent**:

```
Frontend (microphone, MediaRecorder)
        ↓  multipart/form-data: audio=<file>
AWS API Gateway  (POST /voice)
        ↓
LlmBridgeFunction (Lambda, nodejs20.x, arm64, ap-south-1)
        ├── ElevenLabs STT  (scribe_v2)  → transcript
        ├── Amazon Bedrock  (Claude 3 Haiku) → response text
        └── ElevenLabs TTS  (eleven_flash_v2_5) → audio bytes
        ↓  { transcript, response, audio(base64), toolCalls }
Frontend → speaker
```

- **ElevenLabs is used only for STT and TTS.**
- The **ElevenLabs API key stays server-side** in the Lambda and is never sent
  to the browser.
- **Bedrock is the LLM brain** (`anthropic.claude-3-haiku-20240307-v1:0`),
  called with the Lambda execution role (no hardcoded credentials).

### Request flow

1. User taps the mic → browser records audio with `MediaRecorder`.
2. User taps again → audio is uploaded to `POST /voice` as `multipart/form-data`.
3. The Lambda calls ElevenLabs STT → transcript.
4. The transcript (+ session context and editor code) goes to Bedrock Claude 3 Haiku.
5. Claude's reply is synthesized by ElevenLabs TTS → MP3 bytes.
6. The Lambda returns transcript + response + base64 audio + any tool calls.
7. The frontend shows the transcript/response and plays the audio.

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18 + TypeScript, Vite 5 |
| **Auth & DB** | Firebase (Authentication + Firestore) |
| **Editor** | Monaco Editor |
| **STT / TTS** | ElevenLabs (`scribe_v2`, `eleven_flash_v2_5`) |
| **LLM** | Amazon Bedrock — Claude 3 Haiku (`anthropic.claude-3-haiku-20240307-v1:0`) |
| **API / Compute** | Amazon API Gateway + AWS Lambda (SAM) |
| **Region** | `ap-south-1` |

---

## 🔌 API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/voice` | Audio in → `{ sessionId, transcript, response, audio, audioMimeType, audioEncoding, toolCalls }` |
| `GET` | `/session` | Issues a `{ sessionId }` for conversation context |
| `POST` | `/execute` | Runs learner JavaScript in a server-side sandbox |

`POST /voice` accepts either:

- `multipart/form-data` with an `audio` file (preferred), plus optional
  `sessionId`, `history` (JSON), `lessonTitle`, `objectives`, `aiMemory`, `editorCode`; or
- `application/json` with a base64 `audio` field (used by tests/tools).

> **Audio representation:** TTS output is returned as base64 in JSON for
> simplicity and because responses are short (1–3 sentences). For long audio,
> switch to returning binary/streaming to avoid the ~33% base64 overhead.

---

## 🔑 Environment Variables

| Variable | Where | Frontend-safe? | Description |
|----------|-------|:--------------:|-------------|
| `VITE_API_BASE_URL` | Frontend | ✅ | API Gateway base URL (e.g. `https://xxxx.execute-api.ap-south-1.amazonaws.com/prod`) |
| `ELEVENLABS_API_KEY` | Backend | ❌ **never** | ElevenLabs API key (STT + TTS) |
| `ELEVENLABS_VOICE_ID` | Backend | ❌ | ElevenLabs voice id used for TTS |

Optional backend overrides (defaults shown): `BEDROCK_MODEL_ID=anthropic.claude-3-haiku-20240307-v1:0`,
`BEDROCK_REGION=ap-south-1`, `STT_MODEL_ID=scribe_v2`, `TTS_MODEL_ID=eleven_flash_v2_5`.

> `ELEVENLABS_API_KEY` must **never** be prefixed with `VITE_` and must never be
> committed. `.env` is gitignored — use `.env.example` as the template.

---

## ✅ AWS Requirements

- AWS CLI, configured with credentials that can create Lambda/API Gateway/IAM/CloudFormation resources.
- AWS SAM CLI.
- Region **`ap-south-1`**.
- **Bedrock model access** enabled for `anthropic.claude-3-haiku-20240307-v1:0` in `ap-south-1`.
- An ElevenLabs API key and a voice id (from your ElevenLabs workspace).

---

## 🚀 Quick Start (frontend)

```bash
npm install
cp .env.example .env          # fill in VITE_API_BASE_URL
npm run dev                   # http://localhost:5173
```

## ☁️ Deploy (backend)

```bash
sam build --template infra/template.yaml

sam deploy --guided --template infra/template.yaml \
  --parameter-overrides \
    ElevenLabsApiKey=<your-key> \
    ElevenLabsVoiceId=<your-voice-id>
```

Copy the `ApiBaseUrl` stack output into `.env` as `VITE_API_BASE_URL`, then
rebuild the frontend. That's it — no ElevenLabs agent configuration step.

## 🧪 Tests

```bash
npm test        # unit tests: STT, Bedrock, TTS, full pipeline, error handling
npm run build   # type-check + production build
```

External APIs are mocked in tests — no real ElevenLabs/Bedrock calls are made.

---

## 📁 Project Structure

```
├── components/            # React UI (ConversationPanel, CodeWorkspace, LearningView...)
├── hooks/useVoiceTutor.ts # MediaRecorder -> POST /voice -> play audio
├── services/voiceService.ts # Backend client (session, voice, execute)
├── services/dbService.ts  # Firebase Firestore
├── lib/firebase.ts        # Firebase config
├── infra/
│   ├── template.yaml      # SAM: API Gateway + Lambdas
│   └── src/
│       ├── llm-bridge/    # /voice pipeline: elevenlabs.mjs, bedrock.mjs, tutor.mjs
│       └── execute-code/  # POST /execute sandbox
└── infra/test/            # node:test unit tests
```

---

## 🔒 Security Notes

- ElevenLabs API key and voice id live only in Lambda environment variables.
- Bedrock access uses the Lambda IAM role; no AWS keys in code.
- IAM grants only `bedrock:InvokeModel` on the specific model ARN.
- Errors are returned as generic codes; upstream details and secrets are redacted in logs.

---

## 📄 License

MIT License.
