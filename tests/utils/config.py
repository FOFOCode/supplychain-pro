import os

# URLs de los servicios a probar (pueden sobreescribirse mediante variables de entorno)
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
API_BASE_URL = os.getenv("API_BASE_URL", "http://localhost:5001/api")

# Credenciales de prueba
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "admin@local.test")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "admin123")
