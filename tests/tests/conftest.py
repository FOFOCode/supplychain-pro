import pytest
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
import requests
from utils.config import API_BASE_URL, ADMIN_EMAIL, ADMIN_PASSWORD

@pytest.fixture(scope="session")
def admin_token():
    """Obtiene un token de administrador para las pruebas de API"""
    response = requests.post(f"{API_BASE_URL}/auth/login", json={
        "correo": ADMIN_EMAIL,
        "contrasena": ADMIN_PASSWORD
    })
    
    # Si falla, imprimimos el error para facilitar el debugging
    if response.status_code != 200:
        print(f"Error login admin_token: {response.text}")
        
    assert response.status_code == 200
    data = response.json()
    return data.get("token")

@pytest.fixture(scope="function")
def api_client(admin_token):
    """Retorna una sesión de requests pre-autenticada"""
    session = requests.Session()
    session.headers.update({
        "Authorization": f"Bearer {admin_token}",
        "Content-Type": "application/json"
    })
    return session

@pytest.fixture(scope="function")
def driver():
    """Configura y retorna el webdriver de Selenium"""
    options = Options()
    options.add_argument("--headless")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--window-size=1920,1080")
    
    driver = webdriver.Chrome(options=options)
    driver.implicitly_wait(5)
    yield driver
    driver.quit()
