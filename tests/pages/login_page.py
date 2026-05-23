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
        self.wait.until(EC.element_to_be_clickable(self.EMAIL)).send_keys(email)
        self.driver.find_element(*self.PASSWORD).send_keys(password)
        self.driver.find_element(*self.LOGIN_BUTTON).click()
        return self

    def get_error_message(self):
        return self.wait.until(
            EC.visibility_of_element_located(self.ERROR_MESSAGE)
        ).text