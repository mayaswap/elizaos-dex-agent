# Heroku Procfile for ElizaOS DEX Agent
# Choose ONE of these based on your deployment needs:

# Web server mode (default - includes API and web interface)
web: npm run heroku

# Telegram bot only
telegram: DEPLOYMENT_MODE=telegram npm start

# Both web and telegram
multi: DEPLOYMENT_MODE=all npm start

# Release phase (run migrations, setup)
release: npm run build 