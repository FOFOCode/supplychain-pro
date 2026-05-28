from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

class LoginPage:
    def __init__(self, driver, base_url="http://localhost:5173"):
        self.driver = driver
        self.wait = WebDriverWait(driver, 10)
        self.base_url = base_url

    # Locators
    EMAIL = (By.ID, "correo")
    PASSWORD = (By.ID, "contrasena")
    LOGIN_BUTTON = (By.CSS_SELECTOR, "button[type='submit']")
    ERROR_MESSAGE = (By.CLASS_NAME, "error-message")

    def open(self, path="/dashboard"):
        self.driver.get(f"{self.base_url}{path}")
        return self

    def login(self, email, password):
        email_el = self.wait.until(EC.element_to_be_clickable(self.EMAIL))
        email_el.clear()
        email_el.send_keys(email)
        pwd_el = self.driver.find_element(*self.PASSWORD)
        pwd_el.clear()
        pwd_el.send_keys(password)
        self.driver.find_element(*self.LOGIN_BUTTON).click()
        return self

    def get_error_message(self):
        # Intentar varios selectores comunes para mensajes de error para hacer la comprobación más robusta
        selectors = [
            (By.CLASS_NAME, "error-message"),
            (By.CSS_SELECTOR, ".error-message"),
            (By.CSS_SELECTOR, ".login-error"),
            (By.CSS_SELECTOR, ".error"),
            (By.CSS_SELECTOR, "[role='alert']"),
        ]
        for sel in selectors:
            try:
                el = self.wait.until(EC.visibility_of_element_located(sel))
                text = el.text
                if text:
                    return text
            except:
                continue
        # Fallback: buscar texto de error en el HTML completo (palabras clave comunes)
        page = self.driver.page_source
        for keyword in ["Credenciales", "inválid", "invalido", "invalid"]:
            if keyword.lower() in page.lower():
                # Devolver una porción para la aserción
                return keyword
        try:
            # Guardar screenshot para debugging si no se encontró el mensaje
            self.driver.save_screenshot('/tmp/login_debug.png')
        except:
            pass
        return None