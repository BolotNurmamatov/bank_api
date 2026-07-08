module.exports = {
  apps: [
    {
      name: "api_bank_backend",
      script: "run.py",
      cwd: "./backend",
      interpreter: "python", // Uses the active python environment (like your .venv)
      env: {
        "DATABASE_URL": "clickhouse://default:root@127.0.0.1:8888/default", // Update this to match your ClickHouse production string
        "INTERNAL_API_SECRET": "your-secure-internal-secret-here"
      }
    },
    {
      name: "api_bank_frontend",
      script: "npm",
      args: "run start",
      cwd: "./frontend",
      env: {
        "NODE_ENV": "production",
        "PORT": "3000",
        "BACKEND_INTERNAL_URL": "http://127.0.0.1:8000",
        "INTERNAL_API_SECRET": "your-secure-internal-secret-here",
        "GOOGLE_CLIENT_ID": "add_your_google_client_id_here",
        "GOOGLE_CLIENT_SECRET": "add_your_google_client_secret_here",
        "NEXTAUTH_SECRET": "add_a_very_secure_random_string_here",
        "NEXTAUTH_URL": "http://YOUR_WINDOWS_IP" // Update to the IP address of your Windows Server
      }
    }
  ]
};
