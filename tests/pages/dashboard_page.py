from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

class DashboardPage:
    def __init__(self, driver):
        self.driver = driver
        self.wait = WebDriverWait(driver, 10)

    # Locators
    DASHBOARD_TITLE = (By.XPATH, "//*[contains(text(), 'Panel Principal') or contains(text(), 'Monitoreo')]")
    LOGOUT_BUTTON = (By.XPATH, "//button[contains(text(), 'Cerrar sesion') or contains(text(), 'Cerrar sesión')]")

    def is_dashboard_loaded(self):
        try:
            self.wait.until(EC.url_contains("/dashboard"))
            return True
        except:
            return False

    def logout(self):
        self.wait.until(EC.element_to_be_clickable(self.LOGOUT_BUTTON)).click()
