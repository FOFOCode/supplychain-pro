from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException

class ShipmentPage:
    def __init__(self, driver, base_url="http://localhost:5173"):
        self.driver = driver
        self.wait = WebDriverWait(driver, 10)
        self.base_url = base_url

    # Formularios y botones genéricos basados en estructura vista
    TRACKING_CODE = (By.XPATH, "//label[contains(., 'Código Rastreo')]/input")
    VEHICLE_SELECT = (By.XPATH, "//label[contains(., 'Vehículo')]/select")
    ROUTE_SELECT = (By.XPATH, "//label[contains(., 'Ruta')]/select")
    ORIGIN = (By.XPATH, "//label[contains(., 'Origen')]/input")
    DESTINATION = (By.XPATH, "//label[contains(., 'Destino')]/input")
    TEMP_MIN = (By.XPATH, "//label[contains(., 'Temp mín')]/input")
    TEMP_MAX = (By.XPATH, "//label[contains(., 'Temp máx')]/input")
    SUBMIT_BUTTON = (By.XPATH, "//button[contains(text(), 'Crear Envío')]")
    SUCCESS_MESSAGE = (By.CSS_SELECTOR, ".alert.success")
    ERROR_MESSAGE = (By.CSS_SELECTOR, ".alert.error")
    
    def open_simulator(self):
        self.driver.get(f"{self.base_url}/")
        return self

    def create_shipment(self, tracking_code, vehicle_idx, route_idx, origin, destination, temp_min, temp_max):
        self.wait.until(EC.element_to_be_clickable(self.TRACKING_CODE)).send_keys(tracking_code)
        
        vehicle_select = self.driver.find_element(*self.VEHICLE_SELECT)
        vehicle_select.click()
        # Seleccionar la primera opción real
        vehicle_select.find_elements(By.TAG_NAME, "option")[vehicle_idx].click()
        
        route_select = self.driver.find_element(*self.ROUTE_SELECT)
        route_select.click()
        route_select.find_elements(By.TAG_NAME, "option")[route_idx].click()
        
        self.driver.find_element(*self.ORIGIN).send_keys(origin)
        self.driver.find_element(*self.DESTINATION).send_keys(destination)
        self.driver.find_element(*self.TEMP_MIN).send_keys(str(temp_min))
        self.driver.find_element(*self.TEMP_MAX).send_keys(str(temp_max))
        
        self.driver.find_element(*self.SUBMIT_BUTTON).click()
        return self

    def get_success_message(self):
        try:
            return self.wait.until(EC.visibility_of_element_located(self.SUCCESS_MESSAGE)).text
        except TimeoutException:
            return None

    def get_error_message(self):
        try:
            return self.wait.until(EC.visibility_of_element_located(self.ERROR_MESSAGE)).text
        except TimeoutException:
            return None
