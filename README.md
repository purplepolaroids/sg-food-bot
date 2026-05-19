# 🍜 SG Food Bot

Your personal Singapore food recommendation Telegram bot.

## Setup

### 1. Clone and install
```bash
cd sg-food-bot
npm install
```

### 2. Create your .env file
```bash
cp .env.example .env
```

Fill in:
```
TELEGRAM_BOT_TOKEN=your_token_from_botfather
TELEGRAM_CHAT_ID=your_chat_id        # message @userinfobot to get this
NOTION_API_KEY=secret_xxx            # from notion.so/my-integrations
NOTION_DATABASE_ID=6e1ae8fa39cf46f69f0d9660ddbd0e18
OPENAI_API_KEY=sk-xxx
```

### 3. Connect Notion integration to your database
1. Go to notion.so/my-integrations → Create integration
2. Copy the secret key → paste as NOTION_API_KEY
3. Open your 🍜 SG Food Database in Notion
4. Click ··· → Connections → Add your integration

### 4. Run locally
```bash
npm run dev      # with auto-reload
npm start        # production
```

### 5. Deploy to Railway
1. Push to GitHub
2. Connect repo at railway.app
3. Add environment variables in Railway dashboard
4. Deploy — it auto-detects Node.js

## Commands

| Command | Description |
|---------|-------------|
| `/eat` | Step-by-step recommendation wizard |
| `/random` | Random pick from your favourites |
| `/toprated` | Your highest-rated places |
| `/save` | Add a new restaurant to Notion |
| `/cravings [text]` | Natural language: "cheap supper near Central" |

You can also just type what you want — any free text triggers `/cravings` mode.

## Notion Database
Database ID: `6e1ae8fa39cf46f69f0d9660ddbd0e18`  
Direct link: https://www.notion.so/6e1ae8fa39cf46f69f0d9660ddbd0e18

## Folder Structure
```
src/
├── bot/
│   ├── index.js          # Entry point, all command + callback wiring
│   ├── keyboards.js      # Inline keyboard builders
│   └── commands/
│       ├── eat.js        # /eat wizard
│       ├── random.js     # /random
│       ├── toprated.js   # /toprated
│       ├── cravings.js   # /cravings NLP
│       └── save.js       # /save wizard
├── notion/
│   └── client.js         # All Notion API calls
├── ai/
│   └── parseIntent.js    # OpenAI intent parsing + scoring
├── formatters/
│   └── card.js           # Telegram message formatters
└── utils/
    └── constants.js      # Enums for regions, cuisines, etc.
```
